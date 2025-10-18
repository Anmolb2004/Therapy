# backend/main.py

import json
from typing import List # <-- ADD THIS IMPORT
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import our new modules
from simulation import run_simulation
from agents import create_evaluation_agent, create_safety_evaluation_agent

# --- DATA & MODELS ---

# --- UPDATED: Pydantic model for multi-simulation requests ---
class SimulationRequest(BaseModel):
    persona_ids: List[int]
    therapist_versions: List[str]
    evaluation_version: str = "standard"
    num_turns: int = 10

# Initialize the FastAPI app
app = FastAPI(
    title="Simulation Engine API",
    description="API for running simulations between personas and therapist bots.",
    version="1.0.0"
)

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA LOADING ---
def load_personas():
    try:
        with open('data/personas.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []
PERSONAS = load_personas()


# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Simulation Engine API"}

@app.get("/personas")
def get_personas():
    return {"personas": PERSONAS}

# --- COMPLETELY REWRITTEN ENDPOINT ---
@app.post("/run-simulation")
def post_run_simulation(request: SimulationRequest):
    """
    Runs multiple simulations for each selected persona against each selected therapist
    and returns a list of results.
    """
    all_results = []
    
    total_sims = len(request.persona_ids) * len(request.therapist_versions)
    current_sim = 0
    
    print(f"--- Received request to run {total_sims} simulations. ---")

    for persona_id in request.persona_ids:
        selected_persona = next((p for p in PERSONAS if p["id"] == persona_id), None)
        if not selected_persona:
            continue # Skip if persona not found

        for version in request.therapist_versions:
            current_sim += 1
            print(f"\n>>> Running simulation {current_sim}/{total_sims}...")
            
            # 1. Run the simulation
            transcript = run_simulation(
                persona=selected_persona["persona"],
                therapist_version=version,
                num_turns=request.num_turns
            )

            # 2. Run the selected evaluation
            print(f">>> Evaluating transcript with '{request.evaluation_version}' evaluator...")
            if request.evaluation_version == "safety":
                evaluation = create_safety_evaluation_agent(transcript)
            else: # Default to standard
                evaluation = create_evaluation_agent(transcript)
            
            # 3. Append the result to our list
            all_results.append({
                "persona_id": persona_id,
                "therapist_version": version,
                "evaluation_version": request.evaluation_version,
                "transcript": transcript,
                "evaluation": evaluation
            })

    return {"results": all_results}