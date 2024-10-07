import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

# MongoDB client setup
client = AsyncIOMotorClient('mongodb://localhost:27017')
db = client["your_database"]
collection = db["your_collection"]

async def combine_fields_by_ids(ids):
    # Step 1: Fetch documents from MongoDB by IDs
    pipeline = [
        {
            "$match": {
                "_id": { "$in": [ObjectId(id) for id in ids] }
            }
        },
        {
            "$project": {
                "_id": 0,  # Exclude _id from the result
                "filename": 1,
                "createdAt": 1
            }
        }
    ]
    
    # Fetch the data
    result = await collection.aggregate(pipeline).to_list(length=None)

    # Step 2: Process each document to modify filename and format createdAt
    combined_results = []
    for file in result:
        # Extract filename without extension
        filename_without_ext = os.path.splitext(file["filename"])[0]
        
        # Format the createdAt timestamp
        if isinstance(file["createdAt"], datetime):
            timestamp_str = file["createdAt"].strftime("%Y-%m-%d-%H-%M-%S")
        else:
            timestamp_str = str(file["createdAt"])  # Handle cases where createdAt isn't a datetime
        
        # Combine the filename and timestamp using '_'
        combined_string = f"{filename_without_ext}_{timestamp_str}"
        
        # Add the combined result to the list
        combined_results.append(combined_string)

    return combined_results

# Example Usage
ids = ["652d6e234567890abcdef123", "652d6e234567890abcdef124"]  # Replace with actual ObjectId strings
combined_result = await combine_fields_by_ids(ids)
print(combined_result)
