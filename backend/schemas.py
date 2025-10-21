# backend/schemas.py
from pydantic import BaseModel
from typing import List

class SimulationRequest(BaseModel):
    persona_ids: List[int]
    therapist_versions: List[str]
    evaluation_version: str = "standard"
    num_turns: int = 10