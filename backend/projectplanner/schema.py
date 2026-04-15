from pydantic import BaseModel 

class ProjectRequest(BaseModel):
    input: str

class ProjectStep(BaseModel):
    id: int
    title: str
    description: str

class ProjectResponse(BaseModel):
    steps: list[ProjectStep]