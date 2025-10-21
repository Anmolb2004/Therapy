import os
import json
from celery import Celery
from dotenv import load_dotenv

from simulation import run_simulation
from agents import create_evaluation_agent, create_safety_evaluation_agent


from models import SessionLocal, create_db_and_tables 
from db import update_simulation_job, add_simulation_result 
from schemas import SimulationRequest 

load_dotenv()


print("Worker starting up. Verifying database tables...")
create_db_and_tables()

celery_app = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL"),
    backend=os.getenv("CELERY_RESULT_BACKEND")
)

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
    request = SimulationRequest(**request_data) 

    db = SessionLocal()

    try:
        print(f"--- [Job ID: {job_id}] Worker picked up job. ---")
    
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

                transcript = run_simulation(
                    persona=persona_text,
                    therapist_version=version,
                    num_turns=request.num_turns
                )

                if request.evaluation_version == "safety":
                    evaluation = create_safety_evaluation_agent(transcript)
                else:
                    evaluation = create_evaluation_agent(transcript)

                result_item = {
                    "persona_id": persona_id,
                    "therapist_version": version,
                    "evaluation_version": request.evaluation_version,
                    "transcript": transcript,
                    "evaluation": evaluation 
                }

                add_simulation_result(db, job_id=job_id, result_data=result_item)
                completed_sims += 1

                progress_percent = f"{int((completed_sims / total_sims) * 100)}%"
                update_simulation_job(db, job_id=job_id, status="RUNNING", progress=progress_percent)

        print(f"--- [Job ID: {job_id}] All {total_sims} simulations complete. Finalizing. ---")
        update_simulation_job(db, job_id=job_id, status="COMPLETE", progress="100%")

    except Exception as e:
        print(f"!!! [Job ID: {job_id}] Critical error during simulation: {e} !!!")
        import traceback
        traceback.print_exc()
        update_simulation_job(db, job_id=job_id, status="FAILED", error_message=str(e))

    finally:
        db.close()
        print(f"--- [Job ID: {job_id}] Worker finished processing. DB session closed. ---")

    return f"Job {job_id} processing finished with status."