# backend/db.py
from sqlalchemy.orm import Session
import models # Import the SQLAlchemy models we just defined

# --- Job Management Functions ---

def create_simulation_job(db: Session, job_id: str):
    """Creates a new job record in the database."""
    db_job = models.SimulationJob(id=job_id, status='QUEUED', progress='0%')
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    print(f"Created job entry for {job_id}")
    return db_job

def update_simulation_job(db: Session, job_id: str, status: str, progress: str = None, error_message: str = None):
    """Updates the status and progress of an existing job."""
    db_job = db.query(models.SimulationJob).filter(models.SimulationJob.id == job_id).first()
    if db_job:
        db_job.status = status
        if progress is not None:
            db_job.progress = progress
        if error_message is not None:
            db_job.error_message = error_message
        db.commit()
        print(f"Updated job {job_id}: Status={status}, Progress={progress or 'N/A'}")
    else:
        print(f"Warning: Job {job_id} not found for update.")

# --- Result Management Functions ---

def add_simulation_result(db: Session, job_id: str, result_data: dict):
    """Adds a single simulation result associated with a job."""
    try:
        db_result = models.SimulationResult(
            job_id=job_id,
            persona_id=result_data['persona_id'],
            therapist_version=result_data['therapist_version'],
            evaluation_version=result_data['evaluation_version'],
            transcript=result_data['transcript'],
            evaluation=result_data['evaluation'] # Directly store the JSON evaluation
        )
        db.add(db_result)
        db.commit()
        print(f"Added result for job {job_id}, persona {result_data['persona_id']}, bot {result_data['therapist_version']}")
    except Exception as e:
        db.rollback() # Important: Rollback on error to keep DB consistent
        print(f"Error adding result for job {job_id}: {e}")


# --- Data Retrieval Functions ---

def get_job_status_and_results(db: Session, job_id: str):
    """Fetches a job's status and all its associated results."""
    # Use joinedload to efficiently fetch the job and all its results in one query
    from sqlalchemy.orm import joinedload
    job = db.query(models.SimulationJob).options(joinedload(models.SimulationJob.results)).filter(models.SimulationJob.id == job_id).first()

    if not job:
        return None

    # Convert the SQLAlchemy results objects into simple dictionaries for the API response
    results_list = [
        {
            "result_id": res.id, # Include result ID if needed
            "persona_id": res.persona_id,
            "therapist_version": res.therapist_version,
            "evaluation_version": res.evaluation_version,
            "transcript": res.transcript,
            "evaluation": res.evaluation,
            "run_at": res.run_at
        }
        for res in job.results # Access the loaded results directly
    ]

    return {
        "jobId": job.id,
        "status": job.status,
        "progress": job.progress,
        "results": results_list,
        "errorMessage": job.error_message,
        "created_at": job.created_at
    }

# --- Utility Functions ---

# Dependency for FastAPI endpoints to get a database session
def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()