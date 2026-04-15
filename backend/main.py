from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from projectplanner.schema import ProjectRequest
from projectplanner.service import generate_plan 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-plan")
def generate(request: ProjectRequest):
    return generate_plan(request.input)