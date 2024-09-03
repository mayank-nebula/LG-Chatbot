def acquire_token_func():
    """
    Acquires an access token via MSAL for authentication with Microsoft Graph API.

    Returns:
        tuple: Contains the token response and the token expiration datetime.
    """
    ...

def get_site_id(client, site_url):
    """
    Retrieves the SharePoint site ID using the site URL.

    Args:
        client (GraphClient): The GraphClient instance.
        site_url (str): The URL of the SharePoint site.

    Returns:
        str: The ID of the SharePoint site.
    """
    ...

def get_last_run_timestamp():
    """
    Retrieves the timestamp of the last successful run from a JSON file.

    Returns:
        datetime: The datetime of the last run, or None if no timestamp exists.
    """
    ...

def update_last_run_timestamp():
    """
    Updates the JSON file with the current datetime as the timestamp of the last run.
    """
    ...

def load_existing_csv_data(csv_filename, colName):
    """
    Loads existing CSV data into a dictionary indexed by a specific column.

    Args:
        csv_filename (str): The path to the CSV file.
        colName (str): The column name to use as the dictionary key.

    Returns:
        dict: A dictionary containing the CSV data indexed by colName.
    """
    ...

def save_to_csv(data, csv_filename, additional_folders=None):
    """
    Saves data to a CSV file and optionally copies it to additional folders.

    Args:
        data (list): List of dictionaries representing rows of data.
        csv_filename (str): The path to the CSV file to save.
        additional_folders (list): List of folder paths to copy the CSV file to.
    """
    ...

def update_csv(existing_data, csv_filename):
    """
    Updates a CSV file with the given data.

    Args:
        existing_data (dict): Dictionary containing the data to be updated in the CSV.
        csv_filename (str): The path to the CSV file to update.
    """
    ...

def stream_file_content(site_id, drive_id, file_id, files_metadata, deliverables_list_metadata):
    """
    Downloads, ingests, and removes a file from SharePoint.

    Args:
        site_id (str): The ID of the SharePoint site.
        drive_id (str): The ID of the drive containing the file.
        file_id (str): The ID of the file to download.
        files_metadata (dict): Metadata of the files.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
    """
    ...

def traverse_folders_and_files(site_id, drive_id, parent_id, parent_path, last_run,
                               existing_files, created_files, updated_files,
                               existing_folders, created_folders, updated_folders):
    """
    Traverses folders and files in a SharePoint drive to identify created, updated, or deleted items.

    Args:
        site_id (str): The ID of the SharePoint site.
        drive_id (str): The ID of the drive.
        parent_id (str): The ID of the parent folder.
        parent_path (str): The path of the parent folder.
        last_run (datetime): The timestamp of the last run.
        existing_files (dict): Dictionary of existing files.
        created_files (list): List to store IDs of newly created files.
        updated_files (list): List to store IDs of updated files.
        existing_folders (dict): Dictionary of existing folders.
        created_folders (list): List to store IDs of newly created folders.
        updated_folders (list): List to store IDs of updated folders.

    Returns:
        tuple: Contains lists of current file IDs and folder IDs.
    """
    ...

def save_to_csv1(data, csv_filename, field_names, additional_folders=None):
    """
    Saves data to a CSV file and optionally copies it to additional folders with specific field names.

    Args:
        data (list): List of dictionaries representing rows of data.
        csv_filename (str): The path to the CSV file to save.
        field_names (list): List of field names to include in the CSV.
        additional_folders (list): List of folder paths to copy the CSV file to.
    """
    ...

def rotate_backups(backup_dir, main_store_path):
    """
    Rotates backup files, keeping the most recent three backups.

    Args:
        backup_dir (str): The directory containing the backup files.
        main_store_path (str): The path to the main store file to backup.
    """
    ...

def load_docstore_chunk(path, chunk_id):
    """
    Loads a chunk of the document store from a file.

    Args:
        path (str): The path to the directory containing the chunk files.
        chunk_id (str): The ID of the chunk to load.

    Returns:
        dict: The loaded chunk from the document store.
    """
    ...

def load_full_docstore(path):
    """
    Loads the entire document store by combining all chunks.

    Args:
        path (str): The path to the directory containing the chunk files.

    Returns:
        InMemoryStore: The complete document store loaded from chunks.
    """
    ...

def save_full_docstore(docstore, path):
    """
    Saves the entire document store to a file.

    Args:
        docstore (InMemoryStore): The document store to save.
        path (str): The path to the file where the document store will be saved.
    """
    ...

def load_existing_docstore(path):
    """
    Loads an existing document store from a file.

    Args:
        path (str): The path to the file containing the document store.

    Returns:
        InMemoryStore: The loaded document store.
    """
    ...

def update_and_save_docstore(chunk_store_path, main_store_path, backup_dir):
    """
    Updates the main document store with a new chunk and saves it, also rotating backups.

    Args:
        chunk_store_path (str): The path to the chunk store directory.
        main_store_path (str): The path to the main store file.
        backup_dir (str): The directory for backup files.
    """
    ...

def sharepoint_file_acquisition():
    """
    Main function to acquire files from SharePoint, process them, and update the document store.
    """
    ...
