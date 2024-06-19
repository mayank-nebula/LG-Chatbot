import json
import os
from datetime import datetime, timedelta
import csv
from dotenv import load_dotenv
from office365.graph_client import GraphClient
import msal

# Environment variables
tenant_id = "e38fdd56-dd64-4d67-b048-e7c0ae321d11"
client_id = 'fd864c82-a498-4db7-97b5-5e0ce24ec700'
client_secret = 'Baq8Q~AFG2.heqGAl~hIOfEdij23nP4DAg0TpaTl'

# SharePoint site URL
site_url = 'https://gatesventures.sharepoint.com/sites/scientia'

TIMESTAMP_FILE = 'last_run_timestamp.json'

def acquire_token_func():
    """Acquire token via MSAL"""
    authority_url = f'https://login.microsoftonline.com/{tenant_id}'
    app = msal.ConfidentialClientApplication(
        authority=authority_url,
        client_id=client_id,
        client_credential=client_secret,
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if 'access_token' in token_response:
        token_expires_at = datetime.now() + timedelta(seconds=token_response['expires_in'])
        return token_response, token_expires_at
    else:
        raise Exception("Failed to acquire token", token_response.get('error'), token_response.get('error_description'))

# Acquire token and create Graph client
token, token_expires_at = acquire_token_func()
client = GraphClient(lambda: token)

def get_site_id(site_url):
    site = client.sites.get_by_url(site_url).execute_query()
    return site.id

def get_all_drives(site_id):
    drives = client.sites[site_id].drives.get().execute_query()
    return [{'ID': drive.id, 'Name': drive.name, 'WebUrl': drive.web_url} for drive in drives]

def get_all_lists(site_id):
    lists = client.sites[site_id].lists.get().execute_query()
    return [{'ID': lst.id, 'Name': lst.name, 'WebUrl': lst.web_url} for lst in lists]

def get_last_run_timestamp():
    if os.path.exists(TIMESTAMP_FILE):
        with open(TIMESTAMP_FILE, 'r') as file:
            return datetime.fromisoformat(json.load(file)['last_run'])
    else:
        return None

def update_last_run_timestamp():
    with open(TIMESTAMP_FILE, 'w') as file:
        json.dump({'last_run': datetime.now().isoformat()}, file)

def load_existing_csv_data(csv_filename):
    if not os.path.isfile(csv_filename):
        return {}
    with open(csv_filename, mode='r', encoding='utf-8') as in_file:
        reader = csv.DictReader(in_file)
        return {row['ID']: row for row in reader}

def update_csv(existing_data, csv_filename):
    if not existing_data:
        return
    keys = list(next(iter(existing_data.values())).keys())
    with open(csv_filename, 'w', newline='', encoding='utf-8') as output_file:
        writer = csv.DictWriter(output_file, fieldnames=keys)
        writer.writeheader()
        writer.writerows(existing_data.values())

def stream_file_content(site_id, drive_id, file_id, files_metadata):
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    if file_id not in files_metadata:
        return

    target_folder = 'files_to_ingest'
    os.makedirs(target_folder, exist_ok=True)
    file_name = files_metadata[file_id]['Name']
    response = client.sites[site_id].drives[drive_id].items[file_id].get_content().execute_query()

    with open(os.path.join(target_folder, file_name), 'wb') as file:
        file.write(response.value)

def traverse_folders_and_files(site_id, drive_id, parent_id, parent_path, last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders):
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=59):
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
                'properties': item.properties
            }
            if item.id in existing_folders:
                if last_run and item.last_modified_datetime > last_run:
                    updated_folders.append(item.id)
            else:
                created_folders.append(item.id)

            existing_folders[item.id] = folder_metadata
            current_folder_ids.append(item.id)

            sub_file_ids, sub_folder_ids = traverse_folders_and_files(
                site_id, drive_id, item.id, item_path, last_run, existing_files,
                created_files, updated_files, existing_folders, created_folders, updated_folders
            )
            current_file_ids.extend(sub_file_ids)
            current_folder_ids.extend(sub_folder_ids)
        elif item.is_file:
            file_metadata = {
                'ID': item.id,
                'Name': item.name,
                'Path': parent_path + "/" + item.name,
                'WebUrl': item.web_url,
                'CreatedDateTime': item.created_datetime,
                'properties': item.properties
            }
            if item.id in existing_files:
                if last_run and item.last_modified_datetime > last_run:
                    updated_files.append(item.id)
            else:
                created_files.append(item.id)

            existing_files[item.id] = file_metadata
            current_file_ids.append(item.id)

    return current_file_ids, current_folder_ids

def main():
    site_id = get_site_id(site_url)
    drive_id = "b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO"
    root_id = client.sites[site_id].drives[drive_id].root.get().execute_query().id

    folders_csv_filename = 'folders_metadata.csv'
    files_csv_filename = 'files_metadata.csv'
    last_run = get_last_run_timestamp()

    existing_files = load_existing_csv_data(files_csv_filename)
    existing_folders = load_existing_csv_data(folders_csv_filename)

    created_files = []
    created_folders = []
    updated_files = []
    updated_folders = []

    current_file_ids, current_folder_ids = traverse_folders_and_files(
        site_id, drive_id, root_id, '', last_run, existing_files, created_files,
        updated_files, existing_folders, created_folders, updated_folders
    )

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

    files_metadata = load_existing_csv_data(files_csv_filename)
    for file_id in created_files:
        stream_file_content(site_id, drive_id, file_id, files_metadata)

    os.remove(files_csv_filename)
    os.remove(folders_csv_filename)
    os.remove(TIMESTAMP_FILE)

if __name__ == "__main__":
    main()
