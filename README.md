import json
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")  # Update with your MongoDB connection string
db = client["your_database_name"]  # Replace with your database name
collection = db["your_collection_name"]  # Replace with your collection name

# Retrieve questions as key-value pairs with document names
questions_dict = {}

# Fetch all documents in the collection
for document in collection.find({}, {"documentName": 1, "questions": 1}):
    document_name = document.get("documentName")
    questions = document.get("questions", [])

    # Populate dictionary with questions as keys and document name as values
    for question in questions:
        questions_dict[question] = document_name

# Save the result to a JSON file
with open("questions_document_map.json", "w") as json_file:
    json.dump(questions_dict, json_file, indent=4)

print("Data has been saved to questions_document_map.json")
