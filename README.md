def update_and_save_docstore(
    chunk_store_path, main_store_path, backup_dir, deletion_id
):
    """
    Updates the main document store with a new chunk and saves it, also rotating backups.

    Args:
        chunk_store_path (str): The path to the chunk store directory.
        main_store_path (str): The path to the main store file.
        backup_dir (str): The directory for backup files.
    """
    chunk_store_full_path = os.path.join(os.getcwd(), chunk_store_path)

    chunk_store = None
    update_required = False

    # Check if chunk store directory exists and is not empty
    if os.path.exists(chunk_store_full_path) and os.listdir(chunk_store_full_path):
        update_required = True

    if not update_required and not deletion_id:
        return

    try:
        # Load the main store if it exists, else create a new InMemoryStore
        if os.path.exists(main_store_path):
            main_store = load_existing_docstore(main_store_path)
            rotate_backups(backup_dir, main_store_path)
        else:
            main_store = InMemoryStore()

        if update_required:
            chunk_store = load_full_docstore(chunk_store_full_path)
            main_store.store.update(chunk_store.store)

        if deletion_id:
            main_store.mdelete(deletion_id)

        # Save the updated main store
        save_full_docstore(main_store, main_store_path)

    except Exception as e:
        # Log or handle the error
        logging.error(f"An error occurred: {e}")
        return  # If there's an error, exit the function without deleting the chunks

    finally:
        # Remove the chunk store directory only if everything above succeeds
        if chunk_store:
            shutil.rmtree(chunk_store_full_path)
