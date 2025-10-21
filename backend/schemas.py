# backend/schemas.py
from pydantic import BaseModel
from typing import List

# This is the "recipe" for a simulation request that both the API and the Worker need to understand.
class SimulationRequest(BaseModel):
    persona_ids: List[int]
    therapist_versions: List[str]
    evaluation_version: str = "standard"
    num_turns: int = 10