import os 
from openai import OpenAI
from dotenv import load_dotenv
from projectplanner.schema import ProjectResponse, ProjectStep

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_plan(user_input: str) -> ProjectResponse:
    """
    Invokes the OpenAI client to essentially generate out a home improvement plan
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a home improvement planning assistant.
                Given a project description, return a JSON object with this exact structure:
                {
                  "steps": [
                    { "id": 1, "title": "Step title", "description": "Detailed description" },
                    ...
                  ]
                }
                Return only valid JSON, no markdown, no explanation."""
            },
            {
                "role": "user",
                "content": user_input
            }
        ],
        response_format={ "type": "json_object" }
    )

    raw = response.choices[0].message.content
    import json
    data = json.loads(raw)

    steps = [ProjectStep(**s) for s in data["steps"]]
    return ProjectResponse(steps=steps)