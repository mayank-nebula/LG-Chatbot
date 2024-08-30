update_and_save_docstore("docstores_normal_rag", "GatesVentures_Scientia.pkl")
        update_and_save_docstore(
            "docstores_normal_summary", "GatesVentures_Scientia_Summary.pkl"
        )


def load_docstore_chunk(path, chunk_id):
    if os.path.exists(os.path.join(path, chunk_id)):
        with open(os.path.join(path, chunk_id), "rb") as f:
            return pickle.load(f)
    return None


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


def load_existing_docstore(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return InMemoryStore()


def update_and_save_docstore(chunk_store_path, main_store_path):
    chunk_store = load_full_docstore(os.path.join(os.getcwd(), chunk_store_path))
    main_store = load_existing_docstore(os.path.join(os.getcwd(), main_store_path))
    main_store.store.update(chunk_store.store)
    save_full_docstore(main_store, os.path.join(os.getcwd(), main_store_path))
