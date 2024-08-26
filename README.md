import os
import pickle

import chromadb
from chromadb.config import Settings

settings = Settings(anonymized_telemetry=False)

CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)
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


def delete_form_vectostore(file_id_list):
    ids_to_delete_normal = []
    ids_to_delete_summary = []
    docstore_normal = load_docstore("GatesVentures_Scientia.pkl")
    docstore_summary = load_docstore("GatesVentures_Scientia_Summary.pkl")
    for id in file_id_list:
        collection_result_normal = collection_normal.get(where={"id": id})
        collection_normal.delete(where={"id": id})
        for metadata in collection_result_normal["metadatas"]:
            ids_to_delete_normal.append(metadata["GatesVentures_Scientia"])

        collection_result_summary = collection_summary.get(where={"id": id})
        collection_summary.delete(where={"id": id})
        for metadata in collection_result_summary["metadatas"]:
            ids_to_delete_summary.append(metadata["GatesVentures_Scientia_Summary"])

    docstore_normal.mdelete(ids_to_delete_normal)
    docstore_summary.mdelete(ids_to_delete_summary)
    save_docstore(docstore_normal, "GatesVentures_Scientia.pkl")
    save_docstore(docstore_summary, "GatesVentures_Scientia_Summary.pkl")
