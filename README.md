import pymongo
from pymongo import MongoClient

# MongoDB connection details
mongo_uri = "mongodb://localhost:27017/"  # Update this to your MongoDB URI if needed
db_name = "your_database_name"  # Replace with your database name
collection_name = "your_collection_name"  # Replace with your collection name

# Create a MongoClient to connect to the MongoDB server
client = MongoClient(mongo_uri)

# Select the database
db = client[db_name]

# Drop the collection
try:
    db.drop_collection(collection_name)
    print(f"Collection '{collection_name}' has been dropped.")
except pymongo.errors.PyMongoError as e:
    print(f"Error dropping collection: {e}")

# Close the connection
client.close()
