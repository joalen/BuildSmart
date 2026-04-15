from pydantic import BaseModel
from typing import List

class ProjectRequest(BaseModel):
    input: str

class Material(BaseModel):
    id: int
    name: str
    quantity: str
    unit: str

class Tool(BaseModel):
    id: int
    name: str

class ProjectStep(BaseModel):
    id: int
    title: str
    description: str

class ProjectResponse(BaseModel):
    overview: str
    materials: List[Material]
    tools: List[Tool]
    steps: List[ProjectStep]