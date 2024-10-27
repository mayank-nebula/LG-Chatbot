import chromadb

chroma_client = chromadb.HttpClient(host="localhost", port=8000)
collection = chroma_client.get_or_create_collection("GatesVentures_Scientia_Summary")


def coversion(permission_string):
    permissions = [p for p in permission_string.split(";") if p.strip()]
    permissions = set(filter(None, permissions))
    permission_dict = {f"{perm}": True for perm in permissions}
    return permission_dict


def update_collection(ids, metadatas):
    for i, metadata in enumerate(metadatas):
        if metadata.get("DeliverablePermissions"):
            doc_id = ids[i]
            flag = coversion(metadata["DeliverablePermissions"])
            updated = {**metadata, **flag}

            collection.update(doc_id, metadatas=updated)


def main():
    result = collection.get()
    ids = result["ids"]
    metadatas = result["metadatas"]

    update_collection(ids, metadatas)


if __name__ == "__main__":
    main()
