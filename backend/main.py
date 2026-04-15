from fastapi import FastAPI
from projectplanner.schema import ProjectRequest
from projectplanner.service import generate_plan 

app = FastAPI()

@app.post("/generate-plan")
def generate(request: ProjectRequest):
    return generate_plan(request.input)