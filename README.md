def update_and_save_docstore(chunk_store_path, main_store_path, backup_dir):
    """
    Updates the main document store with a new chunk and saves it, also rotating backups.

    Args:
        chunk_store_path (str): The path to the chunk store directory.
        main_store_path (str): The path to the main store file.
        backup_dir (str): The directory for backup files.
    """
    chunk_store_full_path = os.path.join(os.getcwd(), chunk_store_path)
    if not os.path.exists(chunk_store_full_path) or not os.listdir(chunk_store_full_path):
        return

    chunk_store = load_full_docstore(os.path.join(os.getcwd(), chunk_store_path))

    if os.path.exists(main_store_path):
        main_store = load_existing_docstore(main_store_path)
        rotate_backups(backup_dir, main_store_path)
    else:
        main_store = InMemoryStore()

    main_store.store.update(chunk_store.store)
    save_full_docstore(main_store, main_store_path)

    shutil.rmtree(chunk_store_full_path)
