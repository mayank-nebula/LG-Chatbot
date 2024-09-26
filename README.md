import os
import logging
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

mongo_client = None


# Initialize the MongoDB client and collection
def startup_db_client():
    """
    Initializes the MongoDB client and sets up the chat collection.
    Loads the connection string and database name from environment variables.
    """
    global mongo_client
    try:
        # Get the MongoDB connection URI from the environment variable
        mongo_uri = os.getenv("MONGO_API_KEY")
        if not mongo_uri:
            raise ValueError("MONGO_API_KEY environment variable not set")

        # Get the MongoDB database name from environment variables
        db_name = os.getenv("MONGODB_COLLECTION")
        if not db_name:
            raise ValueError("MONGODB_COLLECTION environment variable not set")

        # Initialize MongoDB client
        mongo_client = AsyncIOMotorClient(mongo_uri)
        logging.info(f"Connected to MongoDB at {mongo_uri}, Database: {db_name}")
    except Exception as e:
        logging.error(f"Error initializing MongoDB client: {str(e)}")
        raise


# Close the MongoDB client connection
def shutdown_db_client():
    """
    Shuts down the MongoDB client and closes the connection to the chat, user, and question collections.
    """
    global mongo_client
    try:
        if mongo_client is not None:
            mongo_client.close()
            mongo_client = None
            logging.info("MongoDB client closed successfully")
        else:
            logging.warning("MongoDB client was not initialized or already closed")
    except Exception as e:
        logging.error(f"Error closing MongoDB client: {str(e)}")
        raise


def get_db():
    """
    Retrieves the MongoDB database for operations.

    Returns:
    - db (MongoClient.Database): MongoDB database object.

    Raises:
    - Exception: If the MongoDB client is not initialized.
    """
    if mongo_client is None:
        raise Exception(
            "MongoDB client is not initialized. Call startup_db_client first."
        )

    db_name = os.getenv("MONGODB_COLLECTION")
    if not db_name:
        raise ValueError("MONGODB_COLLECTION environment variable not set")

    return mongo_client[db_name]


# Retrieve the collection to work with MongoDB
def get_chat_collection():
    """
    Retrieves the chat collection for CRUD operations.

    Returns:
    - collection_chat (MongoClient.Collection): MongoDB collection object.

    Raises:
    - Exception: If the MongoDB client is not initialized.
    """
    return get_db()["chats"]


def get_question_collection():
    """
    Retrieves the chat collection for CRUD operations.

    Returns:
    - collection_chat (MongoClient.Collection): MongoDB collection object.

    Raises:
    - Exception: If the MongoDB client is not initialized.
    """
    return get_db()["questions"]


def get_user_collection():
    """
    Retrieves the chat collection for CRUD operations.

    Returns:
    - collection_chat (MongoClient.Collection): MongoDB collection object.

    Raises:
    - Exception: If the MongoDB client is not initialized.
    """
    return get_db()["users"]
