import os
import csv
import json
from datetime import datetime, timedelta

import msal
import logging
from office365.graph_client import GraphClient
from dotenv import load_dotenv

from ingest import ingest_files
from delete import delete_form_vectostore

# Load environment variables from .env file
load_dotenv()

# Retrieve environment variables
tenant_id = os.getenv('TENANT_ID')
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# SharePoint site URL
site_url = 'https://gatesventures.sharepoint.com/sites/scientia'

TIMESTAMP_FILE = 'last_run_timestamp.json'

def acquire_token_func():
    """
    Acquire an access token using MSAL (Microsoft Authentication Library).

    Returns:
        tuple: A tuple containing the token response and the token expiration datetime.
    """
    logging.info("Acquiring access token...")
    authority_url = f'https://login.microsoftonline.com/{tenant_id}'
    app = msal.ConfidentialClientApplication(
        authority=authority_url,
        client_id=client_id,
        client_credential=client_secret
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if 'access_token' in token_response:
        logging.info("Access token acquired.")
        token_expires_at = datetime.now() + timedelta(seconds=token_response['expires_in'])
        return token_response, token_expires_at
    else:
        raise Exception("Failed to acquire token", token_response.get('error'), token_response.get('error_description'))

def get_site_id(client, site_url):
    """
    Fetch the site ID from SharePoint using the site URL.

    Args:
        client (GraphClient): The authenticated GraphClient.
        site_url (str): The URL of the SharePoint site.

    Returns:
        str: The site ID.
    """
    logging.info("Fetching site ID...")
    site = client.sites.get_by_url(site_url).execute_query()
    logging.info(f"Site ID fetched: {site.id}")
    return site.id

def get_all_lists(client, site_id):
    """
    Retrieve all lists from the SharePoint site.

    Args:
        client (GraphClient): The authenticated GraphClient.
        site_id (str): The ID of the SharePoint site.

    Returns:
        list: A list of dictionaries containing metadata of each list.
    """
    logging.info("Fetching all lists...")
    lists = client.sites[site_id].lists.get().execute_query()
    lists_metadata = [{'ID': list.id, 'Name': list.name, 'WebUrl': list.web_url} for list in lists]
    logging.info(f"Found {len(lists_metadata)} lists.")
    return lists_metadata

def get_all_drives(client, site_id):
    """
    Retrieve all document libraries (drives) from the SharePoint site.

    Args:
        client (GraphClient): The authenticated GraphClient.
        site_id (str): The ID of the SharePoint site.

    Returns:
        list: A list of dictionaries containing metadata of each drive.
    """
    logging.info("Fetching all document libraries...")
    drives = client.sites[site_id].drives.get().execute_query()
    drives_metadata = [{'ID': drive.id, 'Name': drive.name, 'WebUrl': drive.web_url} for drive in drives]
    logging.info(f"Found {len(drives_metadata)} document libraries.")
    return drives_metadata

def get_last_run_timestamp():
    """
    Retrieve the timestamp of the last run from a JSON file.

    Returns:
        datetime: The timestamp of the last run, or None if the file does not exist.
    """
    if os.path.exists(TIMESTAMP_FILE):
        with open(TIMESTAMP_FILE, 'r') as file:
            return datetime.fromisoformat(json.load(file)['last_run'])
    else:
        return None

def update_last_run_timestamp():
    """
    Update the timestamp of the last run to the current time and save it to a JSON file.
    """
    with open(TIMESTAMP_FILE, 'w') as file:
        json.dump({'last_run': datetime.now().isoformat()}, file)
    logging.info("Last run timestamp updated.")

def load_existing_csv_data(csv_filename, colName):
    """
    Load existing data from a CSV file into a dictionary.

    Args:
        csv_filename (str): The name of the CSV file.
        colName (str): The column name to use as the dictionary key.

    Returns:
        dict: A dictionary with the specified column as keys and rows as values.
    """
    if not os.path.isfile(csv_filename):
        return {}
    with open(csv_filename, mode='r', encoding='utf-8') as in_file:
        reader = csv.DictReader(in_file)
        return {row[colName]: row for row in reader}

def save_to_csv(data, csv_filename):
    """
    Save a list of dictionaries to a CSV file.

    Args:
        data (list): The data to save.
        csv_filename (str): The name of the CSV file.
    """
    if data:
        with open(csv_filename, newline='', mode='w', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        logging.info(f'CSV file {csv_filename} created.')

def update_csv(existing_data, csv_filename):
    """
    Update a CSV file with the existing data.

    Args:
        existing_data (dict): The existing data to update.
        csv_filename (str): The name of the CSV file.
    """
    if not existing_data:
        logging.info(f'No data to update for {csv_filename}')
        return
    
    keys = list(next(iter(existing_data.values())).keys())
    with open(csv_filename, mode='w', newline='', encoding='utf-8') as output_file:
        dics_writer = csv.DictWriter(output_file, fieldnames=keys)
        dics_writer.writeheader()
        dics_writer.writerows(existing_data.values())
    logging.info(f'CSV file {csv_filename} updated.')

def stream_file_content(site_id, drive_id, file_id, files_metadata, deliverables_list_metadata):
    """
    Download and process a file from SharePoint.

    Args:
        site_id (str): The ID of the SharePoint site.
        drive_id (str): The ID of the drive.
        file_id (str): The ID of the file.
        files_metadata (dict): Metadata of the files.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
    """
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        logging.info("Refreshing access token...")
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    if file_id not in files_metadata:
        logging.info('File not found.')
        return 

    target_folder = 'files_to_ingest'
    file_name = files_metadata[file_id]['Name']

    logging.info(f"Downloading file: {file_name}...")
    response = client.sites[site_id].drives[drive_id].items[file_id].get_content().execute_query()

    with open(os.path.join(target_folder, file_name), 'wb') as file:
        file.write(response.value)
    logging.info(f'{file_name} saved.')

    logging.info(f"Ingesting file: {file_name}...")
    ingest_files(files_metadata[file_id], deliverables_list_metadata[file_name])

    os.remove(os.path.join(target_folder, file_name))
    logging.info(f'{file_name} removed from local storage.')

def traverse_folders_and_files(site_id, drive_id, parent_id, parent_path, last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders):
    """
    Traverse through folders and files in the SharePoint document library.

    Args:
        site_id (str): The ID of the SharePoint site.
        drive_id (str): The ID of the drive.
        parent_id (str): The ID of the parent folder.
        parent_path (str): The path of the parent folder.
        last_run (datetime): The timestamp of the last run.
        existing_files (dict): Existing files metadata.
        created_files (list): List to store created files IDs.
        updated_files (list): List to store updated files IDs.
        existing_folders (dict): Existing folders metadata.
        created_folders (list): List to store created folders IDs.
        updated_folders (list): List to store updated folders IDs.

    Returns:
        tuple: A tuple containing lists of current file IDs and folder IDs.
    """
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        logging.info("Refreshing access token...")
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    folder_items = client.sites[site_id].drives[drive_id].items[parent_id].children.get().top(5000).execute_query()    
    current_file_ids = []
    current_folder_ids = []

    for item in folder_items:
        item_path = parent_path + "/" + item.name
        if item.is_folder:
            folder_metadata = {
                'ID': item.id,
                'Name': item.name,
                'Path': item_path,
                'WebUrl': item.web_url,
            }

            if item.id in existing_folders:
                if last_run and item.last_modified_datetime > last_run:
                    updated_folders.append(item.id)
            else:
                created_folders.append(item.id)

            existing_folders[item.id] = folder_metadata
            current_folder_ids.append(item.id)

            # Traverse subfolder
            sub_file_ids, sub_folder_ids = traverse_folders_and_files(site_id, drive_id, item.id, item_path, last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders)
            current_file_ids.extend(sub_file_ids)
            current_folder_ids.extend(sub_folder_ids)
        elif item.is_file:
            file_metadata = {
                'ID': item.id,
                'Name': item.name,
                'Path': parent_path + "/" + item.name,
                'WebUrl': item.web_url,
                'CreatedDateTime': item.created_datetime,
            }

            if item.id in existing_files:
                if last_run and item.last_modified_datetime > last_run:
                    updated_files.append(item.id)
            else:
                created_files.append(item.id)

            existing_files[item.id] = file_metadata
            current_file_ids.append(item.id)

    return current_file_ids, current_folder_ids

def save_to_csv1(data, csv_filename, field_names):
    """
    Save a list of dictionaries to a CSV file with specified field names.

    Args:
        data (list): The data to save.
        csv_filename (str): The name of the CSV file.
        field_names (list): The field names for the CSV file.
    """
    if data:
        with open(csv_filename, newline='', mode='w', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=field_names)
            writer.writeheader()
            writer.writerows(data)
        logging.info(f'CSV file {csv_filename} created.')

def sharepoint_file_acquisition():
    """
    Main function to acquire files from SharePoint, process them, and update metadata.
    """
    global token, token_expires_at, client

    try:
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

        site_id = get_site_id(client, site_url)
        get_all_lists(client, site_id)
        get_all_drives(client, site_id)

        user_permission_list = '167bbde3-1341-4d29-9447-0996b92c26ef'
        deliverables_list = 'a76c34cd-0a87-4947-9881-54a32eb64b4e'

        logging.info("Fetching user permissions...")
        users_list_object = client.sites[site_id].lists[user_permission_list].items.expand(["fields($select=User,Teams,TeamsPermission,Roles)"]).get().top(5000).execute_query()
        users_list_items = [item.to_json()["fields"] for item in users_list_object]
        users_list_csv_filename = os.path.join(os.getcwd(), 'users_permission.csv')
        save_to_csv(users_list_items, users_list_csv_filename)

        logging.info("Fetching deliverables list...")
        deliverables_list_object = client.sites[site_id].lists[deliverables_list].items.expand(["fields"]).get().top(5000).execute_query()
        deliverables_item_data = []
        deliverables_field_names = set()

        for item in deliverables_list_object:
            fields = item.to_json()["fields"]
            if fields['ContentType'] == 'Document':
                deliverables_item_data.append(fields)
                deliverables_field_names.update(fields.keys())

        deliverables_field_names = list(deliverables_field_names)

        for fields in deliverables_item_data:
            for field in deliverables_field_names:
                if field not in fields:
                    fields[field] = None

        deliverables_list_csv_filename = os.path.join(os.getcwd(), 'deliverables_list.csv')
        field_names = deliverables_item_data[0].keys()
        save_to_csv1(deliverables_item_data, deliverables_list_csv_filename, field_names)

        folders_csv_filename = os.path.join(os.getcwd(), 'folders_metadata.csv')
        files_csv_filename = os.path.join(os.getcwd(), 'files_metadata.csv')

        last_run = get_last_run_timestamp()

        existing_files = load_existing_csv_data(files_csv_filename, 'ID')
        existing_folders = load_existing_csv_data(folders_csv_filename, 'ID')

        created_files = []
        created_folders = []
        updated_files = []
        updated_folders = []

        logging.info("Fetching folders and files from Deliverables...")
        drive_id = "b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO"
        logging.info(f"Processing drive: Deliverables (ID: {drive_id})")
        root_id = client.sites[site_id].drives[drive_id].root.get().execute_query().id
        current_file_ids, current_folder_ids = traverse_folders_and_files(site_id, drive_id, root_id, '', last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders)

        logging.info('All folders done.')

        existing_files_ids = set(existing_files.keys())
        existing_folders_ids = set(existing_folders.keys())
        current_file_ids_set = set(current_file_ids)
        current_folder_ids_set = set(current_folder_ids)

        deleted_file_ids = existing_files_ids - current_file_ids_set
        deleted_folder_ids = existing_folders_ids - current_folder_ids_set

        for file_id in deleted_file_ids:
            del existing_files[file_id]
        for folder_id in deleted_folder_ids:
            del existing_folders[folder_id]

        update_csv(existing_files, files_csv_filename)
        update_csv(existing_folders, folders_csv_filename)

        update_last_run_timestamp()

        files_metadata = load_existing_csv_data('files_metadata.csv', 'ID')
        deliverables_list_metadata = load_existing_csv_data('deliverables_list.csv', 'FileLeafRef')

        file_ids_to_delete = list(deleted_file_ids) + updated_files
        file_ids_to_process = updated_files + created_files

        if file_ids_to_delete:
            for file_id in file_ids_to_delete:
                delete_form_vectostore(file_id)

        for file_id in file_ids_to_process:
            stream_file_content(site_id, drive_id, file_id, files_metadata, deliverables_list_metadata)

    except Exception as e:
        logging.error(f'An error occurred: {e}')

if __name__ == "__main__":
    sharepoint_file_acquisition()
