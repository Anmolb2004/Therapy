import uuid
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from worker import run_simulation_and_evaluation_task 
from db import create_simulation_job, get_job_status_and_results, get_db 
from schemas import SimulationRequest

app = FastAPI(
    title="Async Simulation Engine API (PostgreSQL)",
    description="API for running simulations asynchronously with Celery and PostgreSQL.",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    with open('data/personas.json', 'r') as f:
        PERSONAS = json.load(f)
    print(f"Loaded {len(PERSONAS)} personas.")
except FileNotFoundError:
    PERSONAS = []
    print("Warning: data/personas.json not found.")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Async Simulation Engine API (PostgreSQL)"}

@app.get("/personas")
def get_personas_endpoint(): 
    return {"personas": PERSONAS}

@app.post("/start-simulation", status_code=202)
def start_simulation_endpoint(request: SimulationRequest, db: Session = Depends(get_db)):
    """
    Accepts a simulation request, creates a job entry in PostgreSQL,
    queues the task for background processing, and immediately returns a job ID.
    """
    job_id = str(uuid.uuid4())
    print(f"--- API: Received request. Assigning Job ID: {job_id} ---")

    create_simulation_job(db, job_id=job_id)

    run_simulation_and_evaluation_task.delay(job_id, request.dict())

    print(f"--- API: Job {job_id} created and task queued. ---")
    return {"job_id": job_id}


@app.get("/results/{job_id}")
def get_simulation_results_endpoint(job_id: str, db: Session = Depends(get_db)):
    """
    Frontend polls this endpoint to get the latest status and results of a job
    by reading from PostgreSQL.
    """
    print(f"--- API: Checking status for Job ID: {job_id} ---")
    job_data = get_job_status_and_results(db, job_id=job_id)

    if not job_data:
        print(f"--- API: Job {job_id} not found in database. ---")
        raise HTTPException(status_code=404, detail="Job not found or still initializing.")

    print(f"--- API: Returning status for Job {job_id}: {job_data['status']} ---")
    return job_data

@app.get("/analytics/compare-bots")
def compare_bots_endpoint(db: Session = Depends(get_db)):
    """
    Example endpoint demonstrating the power of SQL for analytics.
    Calculates average scores for each bot version.
    """
    from sqlalchemy import func
    from models import SimulationResult 

    print("--- API: Running bot comparison analytics query ---")
    try:
        results = db.query(
            SimulationResult.therapist_version,
            func.count(SimulationResult.id).label('total_simulations'),
            func.avg(SimulationResult.evaluation['empathy_score'].astext.cast(Integer)).label('avg_empathy'),
        ).group_by(SimulationResult.therapist_version).all()

        comparison = [
            {
                "bot_version": version,
                "total_simulations": count,
                "avg_empathy": avg_empathy
            } for version, count, avg_empathy in results
        ]
        return comparison
    except Exception as e:
        print(f"Error during analytics query: {e}")
        raise HTTPException(status_code=500, detail="Error running analytics query.")