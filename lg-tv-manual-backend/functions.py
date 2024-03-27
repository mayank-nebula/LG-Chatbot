import json
import os

import requests
from openai import OpenAI

from prompts import assistant_instructions

OPENAI_API_KEY = os.environ['OPENAI_API_KEY']
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']

client = OpenAI(api_key=OPENAI_API_KEY)


def create_lead(name, phone, email):
  url = "https://api.airtable.com/v0/appOC5teaiX3Rihix/Table%201"
  headers = {
      "Authorization": f"Bearer {AIRTABLE_API_KEY}",
      "Content-Type": "application/json"
  }
  data = {
      "records": [{
          "fields": {
              "Name": name,
              "Phone": phone,
              "Email": email
          }
      }]
  }
  response = requests.post(url, headers=headers, json=data)
  if response.status_code == 200:
    print("Lead created successfully.")
    return response.json()
  else:
    print(f"Failed to create lead: {response.text}")


def create_assistant(client):
  assistant_file_path = 'assistant.json'

  if os.path.exists(assistant_file_path):
    with open(assistant_file_path, 'r') as file:
      assistant_data = json.load(file)
      assistant_id = assistant_data['assistant_id']
      print("Loaded existing assistant ID.")
  else:

    file = client.files.create(file=open("knowledge.pdf", "rb"),
                               purpose='assistants')

    assistant = client.beta.assistants.create(
        instructions=assistant_instructions,
        model="gpt-3.5-turbo",
        tools=[{
            "type": "retrieval"
        }, {
            "type": "function",
            "function": {
                "name": "create_lead",
                "description": "Capture lead details and save to Airtable.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name of the lead."
                        },
                        "phone": {
                            "type": "string",
                            "description": "Phone number of the lead."
                        },
                        "email": {
                            "type": "string",
                            "description": "Email Address of the lead."
                        }
                    },
                    "required": ["name", "phone", "address"]
                }
            }
        }],
        file_ids=[file.id])

    with open(assistant_file_path, 'w') as file:
      json.dump({'assistant_id': assistant.id}, file)
      print("Created a new assistant and saved the ID.")

    assistant_id = assistant.id

  return assistant_id
