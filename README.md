def rotate_backups(backup_dir, main_store_path):
    base_name = os.path.basename(main_store_path).replace(".pkl", "")
    backups = sorted(
        [f for f in os.listdir(backup_dir) if f.startswith(base_name)], reverse=True
    )

    if len(backups) >= 3:
        os.remove(os.path.join(backup_dir, backups[-1]))

    for i in range(len(backups), 0, -1):
        os.rename(
            os.path.join(backup_dir, f"{base_name}_backup_{i}.pkl"),
            os.path.join(backup_dir, f"{base_name}_backup_{i+1}.pkl"),
        )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copyfile(
        main_store_path,
        os.path.join(backup_dir, f"{base_name}_backup_1_{timestamp}.pkl"),
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
    print("hi2")
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return InMemoryStore()


def update_and_save_docstore(chunk_store_path, main_store_path, backup_dir):
    chunk_store = load_full_docstore(os.path.join(os.getcwd(), chunk_store_path))
    print("hi")
    main_store = load_existing_docstore(main_store_path)
    print("hi3")

    # rotate_backups(backup_dir, main_store_path)

    main_store.store.update(chunk_store.store)
    save_full_docstore(main_store, main_store_path)
