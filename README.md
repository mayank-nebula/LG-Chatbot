import os
import pickle
import logging

import chromadb
from chromadb.config import Settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

settings = Settings(anonymized_telemetry=False)
CHROMA_CLIENT = chromadb.HttpClient(host="10.225.1.6", port=8000, settings=settings)

collection_normal = CHROMA_CLIENT.get_or_create_collection(
    name="GatesVentures_Scientia"
)
collection_summary = CHROMA_CLIENT.get_or_create_collection(
    name="GatesVentures_Scientia_Summary"
)


def load_docstore(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return None


def save_docstore(docstore, path):
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def delete_from_collection(collection, file_id, docstore_key):
    ids_to_delete = []
    collection_result = collection.get(where={"id": file_id})
    collection.delete(where={"id": file_id})

    for metadata in collection_result["metadatas"]:
        ids_to_delete.append(metadata[docstore_key])

    return ids_to_delete


def delete_from_vectostore(file_id_list):
    try:
        docstore_normal = load_docstore("GatesVentures_Scientia.pkl")
        docstore_summary = load_docstore("GatesVentures_Scientia_Summary.pkl")

        for file_id in file_id_list:
            normal_metadata = delete_from_collection(
                collection_normal,
                file_id,
                "GatesVentures_Scientia",
            )

            summary_metadata = delete_from_collection(
                collection_summary,
                file_id,
                "GatesVentures_Scientia_Summary",
            )

        docstore_normal.mdelete(normal_metadata)
        docstore_summary.mdelete(summary_metadata)

        save_docstore(docstore_normal, "GatesVentures_Scientia.pkl")
        save_docstore(docstore_summary, "GatesVentures_Scientia_Summary.pkl")

        logging.info("Document deleted successfully.")

    except Exception as e:
        logging.error("Failed to delete the doc.")
