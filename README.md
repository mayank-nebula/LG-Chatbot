import json
import pymongo
from pymongo import MongoClient

# MongoDB connection details
mongo_uri = "mongodb://localhost:27017/"  # Update this to your MongoDB URI if needed
db_name = "your_database_name"  # Replace with your database name
collection_name = "your_collection_name"  # Replace with your collection name

# Path to the JSON file
json_file = "documents.json"

# Read the JSON data from the file
with open(json_file, "r") as f:
    documents = json.load(f)

# Create a MongoClient to connect to the MongoDB server
client = MongoClient(mongo_uri)

# Select the database and collection
db = client[db_name]
collection = db[collection_name]

# Insert the documents into the collection
try:
    result = collection.insert_many(documents)
    print(f"Inserted {len(result.inserted_ids)} documents into the collection.")
except pymongo.errors.BulkWriteError as e:
    print(f"Error inserting documents: {e.details}")

# Close the connection
client.close()
