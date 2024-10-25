import os
import pandas as pd
from pymongo import MongoClient

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["your_database_name"]
collection = db["your_collection_name"]

# Load the CSV
csv_file = "files_metadata.csv"
metadata_df = pd.read_csv(csv_file)

# Function to remove file extensions
def get_name_without_extension(name):
    return os.path.splitext(name)[0]  # Splits name and extension

# Iterate over each row in the DataFrame
for _, row in metadata_df.iterrows():
    name_without_extension = get_name_without_extension(row["Name"])
    doc_id = row["ID"]

    # Query MongoDB for documents with the matching name
    mongo_document = collection.find_one({"name": name_without_extension})

    # Add the new field with `id` if a document is found
    if mongo_document:
        collection.update_one(
            {"_id": mongo_document["_id"]},
            {"$set": {"id": doc_id}}
        )
