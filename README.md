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
projects/steam-genius-475213-t6/locations/us-central1/clusters/ltsc-genai-cluster/instances/ltsc-genai-cluster-primary
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

# Convert Pydantic models to dictionaries
records = [ep.model_dump() for ep in validated]

insert_query = text("""
INSERT INTO episode_data (
    uuid,
    episode_number,
    post_id,
    title,
    short_title,
    slug,
    date,
    video_id,
    blurb,
    summary,
    main_points,
    recent_news,
    related_episodes,
    guest_highlights,
    web_content,
    categories,
    tags,
    media_link,
    media_description
)
VALUES (
    :uuid,
    :episode_number,
    :post_id,
    :title,
    :short_title,
    :slug,
    :date,
    :video_id,
    :blurb,
    :summary,
    :main_points,
    :recent_news,
    :related_episodes,
    :guest_highlights,
    :web_content,
    :categories,
    :tags,
    :media_link,
    :media_description
);
""")

with engine.connect() as conn:
    conn.execute(insert_query, records)  # bulk insert
    conn.commit()

print("Insert complete.")








with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users;"))
    rows = result.fetchall()

rows










from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class EpisodeDataSchema(BaseModel):
    """Podcast episode data and metadata"""

    uuid: Optional[str] = Field(None, max_length=50)
    episode_number: int
    post_id: Optional[int] = None
    title: Optional[str] = None
    short_title: Optional[str] = None
    slug: Optional[str] = None
    date: Optional[datetime] = None
    video_id: Optional[str] = Field(None, max_length=20)
    blurb: Optional[str] = None
    summary: Optional[str] = None
    main_points: Optional[str] = None
    recent_news: Optional[str] = None
    related_episodes: Optional[List[Dict[str, Any]]] = None
    guest_highlights: Optional[str] = None
    web_content: Optional[str] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    media_link: Optional[str] = None
    media_description: Optional[str] = None

    model_config = {
        "from_attributes": True  # allows ORM mode
    }


connector.close()
