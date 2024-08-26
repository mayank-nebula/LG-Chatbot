        csv_writer.writerow(["ID", "Name", "Path", "WebUrl", "CreatedDateTime"])




import os

def update_and_save_docstore(chunk_store_path, main_store_path):
    # Load the chunk store
    chunk_store = load_full_docstore(os.path.join(os.getcwd(), chunk_store_path))
    
    # Load the main store
    main_store = load_existing_docstore(os.path.join(os.getcwd(), main_store_path))
    
    # Update the main store with the chunk store
    main_store.store.update(chunk_store.store)
    
    # Save the updated main store
    save_full_docstore(main_store, os.path.join(os.getcwd(), main_store_path))

# Update and save for normal docstore
update_and_save_docstore("docstores_normal_rag", "GatesVentures_Scientia.pkl")

# Update and save for summary docstore
update_and_save_docstore("docstores_normal_summary", "GatesVentures_Scientia_Summary.pkl")

