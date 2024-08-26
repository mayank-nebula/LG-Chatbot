import os
import pickle
import chromadb
from chromadb.config import Settings

# Initialize Chroma client settings
settings = Settings(anonymized_telemetry=False)
CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)

# Get or create the collections
collection_normal = CHROMA_CLIENT.get_or_create_collection(name="GatesVentures_Scientia")
collection_summary = CHROMA_CLIENT.get_or_create_collection(name="GatesVentures_Scientia_Summary")

def load_docstore(path):
    """Load a docstore from a pickle file."""
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return {}

def save_docstore(docstore, path):
    """Save a docstore to a pickle file."""
    with open(path, "wb") as f:
        pickle.dump(docstore, f)

def delete_from_vectostore(file_id_list):
    """Delete documents from both the normal and summary collections and their corresponding docstores."""
    try:
        docstore_normal = load_docstore("GatesVentures_Scientia.pkl")
        docstore_summary = load_docstore("GatesVentures_Scientia_Summary.pkl")

        ids_to_delete_normal = []
        ids_to_delete_summary = []

        for file_id in file_id_list:
            # Delete from normal collection
            normal_metadata = delete_from_collection(collection_normal, file_id, ids_to_delete_normal, "GatesVentures_Scientia")

            # Delete from summary collection
            summary_metadata = delete_from_collection(collection_summary, file_id, ids_to_delete_summary, "GatesVentures_Scientia_Summary")

        # Delete from docstores
        docstore_normal.mdelete(ids_to_delete_normal)
        docstore_summary.mdelete(ids_to_delete_summary)

        # Save the updated docstores
        save_docstore(docstore_normal, "GatesVentures_Scientia.pkl")
        save_docstore(docstore_summary, "GatesVentures_Scientia_Summary.pkl")

    except Exception as e:
        print(f"An error occurred: {e}")

def delete_from_collection(collection, file_id, ids_to_delete, docstore_key):
    """Delete documents from a given collection and collect their metadata."""
    try:
        collection_result = collection.get(where={"id": file_id})
        collection.delete(where={"id": file_id})

        for metadata in collection_result["metadatas"]:
            ids_to_delete.append(metadata[docstore_key])

    except KeyError:
        print(f"KeyError: Metadata key '{docstore_key}' not found for file ID: {file_id}")
    except Exception as e:
        print(f"An error occurred while deleting from collection '{collection.name}': {e}")

# Example usage
file_ids_to_delete = ["file1", "file2"]
delete_from_vectostore(file_ids_to_delete)
