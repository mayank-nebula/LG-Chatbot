full_store_normal_rag = load_full_docstore(
            os.path.join(os.getcwd(), "docstores_normal_rag")
        )
        save_full_docstore(
            full_store_normal_rag, os.path.join(os.getcwd(), "GatesVentures_Scientia.pkl")
        )

def load_full_docstore(path):
    full_store = InMemoryStore()
    for i in os.listdir(path):
        chunk = load_docstore_chunk(path, i)
        if chunk:
            full_store.store.update(chunk.store)
    return full_store


def save_full_docstore(docstore, path):
    with open(path, "wb") as f:
        pickle.dump(docstore, f)
