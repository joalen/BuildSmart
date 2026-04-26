import os
from infisical_client import ClientSettings, InfisicalClient, ListSecretsOptions
from dotenv import load_dotenv

load_dotenv() 

def load_secrets(environment="dev"):
    client = InfisicalClient(ClientSettings(
        client_id=os.environ["INFISICAL_CLIENT_ID"],
        client_secret=os.environ["INFISICAL_CLIENT_SECRET"],
    ))
    client.listSecrets(options=ListSecretsOptions(
        environment=environment,
        project_id="9c8f46ad-4c27-427c-8cb9-71387d296e74",
        attach_to_process_env=True,
    ))