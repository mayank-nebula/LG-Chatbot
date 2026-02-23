from sqlalchemy import create_engine
from google.cloud.alloydb.connector import Connector
import sqlalchemy

PROJECT_ID = "your-project-id"
REGION = "your-region"
CLUSTER_NAME = "your-cluster"
INSTANCE_NAME = "your-instance"
DB_USER = "your-user"
DB_PASS = "your-password"
DB_NAME = "your-db"

INSTANCE_URI = f"projects/{PROJECT_ID}/locations/{REGION}/clusters/{CLUSTER_NAME}/instances/{INSTANCE_NAME}"

connector = Connector()

def getconn():
    return connector.connect(
        INSTANCE_URI,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
    )

engine = create_engine("postgresql+pg8000://", creator=getconn)

print("Connected to AlloyDB!")








import json

with open("users.json", "r") as f:
    raw_data = json.load(f)

print(f"Loaded {len(raw_data)} records.")











from pydantic import BaseModel, EmailStr, ValidationError
from typing import Optional
from datetime import datetime

class UserSchema(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: Optional[int] = None
    created_at: datetime = datetime.utcnow()







    


valid_records = []
invalid_records = []

for record in raw_data:
    try:
        validated = UserSchema(**record)
        valid_records.append(validated.dict())
    except ValidationError as e:
        invalid_records.append({
            "record": record,
            "error": e.errors()
        })

print(f"Valid records: {len(valid_records)}")
print(f"Invalid records: {len(invalid_records)}")

invalid_records  # Optional: inspect validation errors






from sqlalchemy import text

insert_query = text("""
INSERT INTO users (id, name, email, age, created_at)
VALUES (:id, :name, :email, :age, :created_at);
""")

with engine.connect() as conn:
    conn.execute(insert_query, valid_records)  # bulk insert
    conn.commit()

print("Bulk insert complete!")









with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users;"))
    rows = result.fetchall()

rows








connector.close()
