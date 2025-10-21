# backend/worker.py
import os
import json
from celery import Celery
from dotenv import load_dotenv

# Your core simulation logic remains unchanged
from simulation import run_simulation
from agents import create_evaluation_agent, create_safety_evaluation_agent

# --- UPDATED IMPORTS for PostgreSQL ---
from models import SessionLocal, create_db_and_tables # Import session factory and table creator
from db import update_simulation_job, add_simulation_result # Import the new DB functions
from schemas import SimulationRequest # Pydantic model for request validation

load_dotenv()

# --- Initialize database tables on worker startup ---
# This ensures the tables exist before the worker starts processing tasks
print("Worker starting up. Verifying database tables...")
create_db_and_tables()

# Configure Celery using environment variables
celery_app = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL"),
    backend=os.getenv("CELERY_RESULT_BACKEND")
)

# Load personas at worker startup
try:
    with open('data/personas.json', 'r') as f:
        PERSONAS = {p["id"]: p["persona"] for p in json.load(f)}
    print(f"Loaded {len(PERSONAS)} personas.")
except FileNotFoundError:
    PERSONAS = {}
    print("Warning: data/personas.json not found.")


@celery_app.task(name="run_simulation_task")
def run_simulation_and_evaluation_task(job_id: str, request_data: dict):
    """
    Celery task to run simulations and store results in PostgreSQL.
    """
    request = SimulationRequest(**request_data) # Validate input data

    # --- Get a new database session specific to this task ---
    db = SessionLocal()

    try:
        print(f"--- [Job ID: {job_id}] Worker picked up job. ---")
        # Update job status in the database
        update_simulation_job(db, job_id=job_id, status="RUNNING", progress="0%")

        total_sims = len(request.persona_ids) * len(request.therapist_versions)
        completed_sims = 0

        for i, persona_id in enumerate(request.persona_ids):
            persona_text = PERSONAS.get(persona_id)
            if not persona_text:
                print(f"Warning: [Job ID: {job_id}] Persona ID {persona_id} not found. Skipping.")
                continue

            for j, version in enumerate(request.therapist_versions):
                current_sim_num = i * len(request.therapist_versions) + j + 1
                print(f">>> [Job ID: {job_id}] Running sub-task {current_sim_num}/{total_sims} (Persona: {persona_id}, Bot: {version})...")

                # --- Execute your core simulation logic (unchanged) ---
                transcript = run_simulation(
                    persona=persona_text,
                    therapist_version=version,
                    num_turns=request.num_turns
                )

                if request.evaluation_version == "safety":
                    evaluation = create_safety_evaluation_agent(transcript)
                else:
                    evaluation = create_evaluation_agent(transcript)
                # --- End of core logic ---

                result_item = {
                    "persona_id": persona_id,
                    "therapist_version": version,
                    "evaluation_version": request.evaluation_version,
                    "transcript": transcript,
                    "evaluation": evaluation # Store the raw JSON/dict
                }

                # --- Save the individual result to PostgreSQL ---
                add_simulation_result(db, job_id=job_id, result_data=result_item)
                completed_sims += 1

                # --- Update overall job progress ---
                progress_percent = f"{int((completed_sims / total_sims) * 100)}%"
                update_simulation_job(db, job_id=job_id, status="RUNNING", progress=progress_percent)

        print(f"--- [Job ID: {job_id}] All {total_sims} simulations complete. Finalizing. ---")
        update_simulation_job(db, job_id=job_id, status="COMPLETE", progress="100%")

    except Exception as e:
        # Log the error and mark the job as FAILED in the database
        print(f"!!! [Job ID: {job_id}] Critical error during simulation: {e} !!!")
        import traceback
        traceback.print_exc() # Print full traceback for debugging
        update_simulation_job(db, job_id=job_id, status="FAILED", error_message=str(e))

    finally:
        # --- IMPORTANT: Always close the database session when done ---
        db.close()
        print(f"--- [Job ID: {job_id}] Worker finished processing. DB session closed. ---")

    return f"Job {job_id} processing finished with status."