import os 
import json
from openai import OpenAI
from projectplanner.schema import ProjectResponse, ProjectStep, Material, Tool
from appsecrets import load_secrets

load_secrets()

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
                  "overview": "Brief summary of the project",
                  "materials": [
                    { "id": 1, "name": "Material name", "quantity": "Amount needed", "unit": "bags/sq ft/etc" }
                  ],
                  "tools": [
                    { "id": 1, "name": "Tool name" }
                  ],
                  "steps": [
                    { 
                      "id": 1, 
                      "title": "Step title", 
                      "description": "Detailed description",
                      "search_keyword": "2-4 word Home Depot search query for products needed in this step"
                    }
                  ]
                }
                Return only valid JSON, no markdown, no explanation. Every step MUST include search_keyword. Never omit it."""
            },
            {
                "role": "user",
                "content": user_input
            }
        ],
        response_format={ "type": "json_object" }
    )

    raw = response.choices[0].message.content    
    data = json.loads(raw)

    return ProjectResponse(**data)