import os
import pickle
import logging
import chromadb
from chromadb.config import Settings

# Configure logging to log both to a file and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Initialize ChromaDB client settings, disabling anonymized telemetry.
settings = Settings(anonymized_telemetry=False)

# Create an HTTP client for ChromaDB, connecting to the specified host and port.
CHROMA_CLIENT = chromadb.HttpClient(host="10.225.1.6", port=8000, settings=settings)

# Retrieve or create collections in ChromaDB for storing normal and summary data.
collection_normal = CHROMA_CLIENT.get_or_create_collection(
    name="GatesVentures_Scientia"
)
collection_summary = CHROMA_CLIENT.get_or_create_collection(
    name="GatesVentures_Scientia_Summary"
)


def load_docstore(path):
    """
    Load a docstore (a dictionary-like data structure) from a pickle file.

    Parameters:
    path (str): The file path to the pickle file.

    Returns:
    dict or None: The loaded docstore if the file exists, otherwise None.
    """
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return None


def save_docstore(docstore, path):
    """
    Save a docstore to a pickle file.

    Parameters:
    docstore (dict): The docstore to save.
    path (str): The file path where the pickle file will be saved.
    """
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def delete_from_collection(collection, file_id, docstore_key):
    """
    Delete documents from a specific ChromaDB collection and gather metadata for further deletion.

    Parameters:
    collection: The ChromaDB collection from which documents will be deleted.
    file_id (str): The ID of the document to delete.
    docstore_key (str): The key used to extract metadata from the collection.

    Returns:
    list: A list of metadata IDs that need to be deleted from the docstore.
    """
    ids_to_delete = []

    # Retrieve documents matching the given file_id from the collection.
    collection_result = collection.get(where={"id": file_id})

    # Delete the documents from the collection.
    collection.delete(where={"id": file_id})

    # Extract and store metadata IDs for deletion from the docstore.
    for metadata in collection_result["metadatas"]:
        ids_to_delete.append(metadata[docstore_key])

    return ids_to_delete


def delete_from_vectostore(file_id_list):
    """
    Delete documents from both the ChromaDB collections and the docstores.

    Parameters:
    file_id_list (list): A list of document IDs to delete from the collections.
    """
    try:
        # Load the docstores from their respective pickle files.
        docstore_normal = load_docstore("GatesVentures_Scientia.pkl")
        docstore_summary = load_docstore("GatesVentures_Scientia_Summary.pkl")

        # Initialize lists to store metadata IDs that need deletion.
        normal_metadata = []
        summary_metadata = []

        # Iterate through each file ID and delete the corresponding documents.
        for file_id in file_id_list:
            normal_metadata.extend(
                delete_from_collection(collection_normal, file_id, "GatesVentures_Scientia")
            )
            summary_metadata.extend(
                delete_from_collection(collection_summary, file_id, "GatesVentures_Scientia_Summary")
            )

        # Delete the corresponding metadata from the docstores.
        docstore_normal.mdelete(normal_metadata)
        docstore_summary.mdelete(summary_metadata)

        # Save the updated docstores back to their pickle files.
        save_docstore(docstore_normal, "GatesVentures_Scientia.pkl")
        save_docstore(docstore_summary, "GatesVentures_Scientia_Summary.pkl")

        logging.info("Document deleted successfully.")

    except Exception as e:
        # Log an error if the deletion process fails.
        logging.error(f"Failed to delete the document. {e}")
