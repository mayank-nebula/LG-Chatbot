import pickle
import chromadb

document_ids = []
final_documents = []

client = chromadb.HttpClient(host="10.1.0.4", port=8000)
collection = client.get_collection("GatesVentures_Scientia")

with open("GatesVentures_Scientia.pkl", "rb") as file:
    docstore = pickle.load(file)

ids = results["ids"]
metadatas = results["metadatas"]

for i, metadata in enumerate(metadatas):
    if not metadata.get("DeliverablePermissions").strip():
        document_ids.append(metadata["GatesVentures_Scientia"])
        metadata["DeliverablePermissions"] = "HLSConfidential"
        document_id = ids[i]
        colletion.update(document_id, metadatas=metadata)

docstore_documents = docstore.mget(document_ids)

for id, docstore_document in zip(document_ids, docstore_documents):
    docstore_document.metadata["DeliverablePermissions"] = "HLSConfidential"
    final_documents.append[(id, docstore_document)]

docstore.mset(final_documents)
with open("GatesVentures_Scientia.pkl", "wb") as file:
    pickle.dump(docstore, file)
