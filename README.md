import os
import csv
import json
from datetime import datetime, timedelta

import msal
from dotenv import load_dotenv
from office365.graph_client import GraphClient

from ingest import ingest_files
from delete import delete_form_vectostore

# Load environment variables from .env file
load_dotenv()

# Retrieve environment variables
tenant_id = os.getenv('TENANT_ID')
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')

# SharePoint site URL
site_url = 'https://gatesventures.sharepoint.com/sites/scientia'

TIMESTAMP_FILE = 'last_run_timestamp.json'

def acquire_token_func():
    """
    Acquire token via MSAL
    """
    authority_url = f'https://login.microsoftonline.com/{tenant_id}'
    app = msal.ConfidentialClientApplication(
        authority=authority_url,
        client_id=client_id,
        client_credential=client_secret
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if 'access_token' in token_response:
        print("Access token acquired.")
        token_expires_at = datetime.now() + timedelta(seconds=token_response['expires_in'])
        return token_response, token_expires_at
    else:
        raise Exception("Failed to acquire token", token_response.get('error'), token_response.get('error_description'))


# Acquire token once and create Graph client
token, token_expires_at = acquire_token_func()
client = GraphClient(lambda: token)

def get_site_id(site_url):
    site = client.sites.get_by_url(site_url).execute_query()
    return site.id

def get_all_lists(site_id):
    lists = client.sites[site_id].lists.get().execute_query()
    lists_metadata = []
    for list in lists:
        list_metadata = {
            'ID': list.id,
            'Name': list.name,
            'WebUrl': list.web_url
        }
        lists_metadata.append(list_metadata)
    return lists_metadata

def get_all_drives(site_id):
    drives = client.sites[site_id].drives.get().execute_query()
    drives_metadata = []
    for drive in drives:
        drive_metadata = {
            'ID': drive.id,
            'Name': drive.name,
            'WebUrl': drive.web_url
        }
        drives_metadata.append(drive_metadata)
    return drives_metadata

def get_last_run_timestamp():
    if os.path.exists(TIMESTAMP_FILE):
        with open(TIMESTAMP_FILE, 'r') as file:
            return datetime.fromisoformat(json.load(file)['last_run'])
    else:
        return None

def update_last_run_timestamp():
    with open(TIMESTAMP_FILE, 'w') as file:
        json.dump({'last_run' : datetime.now().isoformat()}, file)

def load_existing_csv_data(csv_filename, colName):
    if not os.path.isfile(csv_filename):
        return {}
    with open(csv_filename, mode='r', encoding='utf-8') as in_file:
        reader = csv.DictReader(in_file)
        return {row[colName]: row for row in reader}

def save_to_csv(data, csv_filename):
    with open (csv_filename, newline='', mode='w', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=data[0].keys())
        writer.writeheader()
        for item in data:
            writer.writerow(item)
        print(f'CSV file {csv_filename} created')

def save_to_csv1(data,csv_filename,field_names):
    with open (csv_filename, newline='', mode='w', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=field_names)
        writer.writeheader()
        writer.writerows(data)
    
def update_csv(existing_data, csv_filename):
    if not existing_data:
        print(f'No data to update for {csv_filename}')
        return
    
    keys = list(next(iter(existing_data.values())).keys())
    with open(csv_filename, mode='w', newline='', encoding='utf-8') as output_file:
        dics_writer = csv.DictWriter(output_file, fieldnames=keys)
        dics_writer.writeheader()
        dics_writer.writerows(existing_data.values())
        print(f'CSV file {csv_filename} updated')

def stream_file_content(site_id, drive_id, file_id, files_metadata, deliverables_list_metadata):
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    if file_id not in files_metadata:
        print('File not found ')
        return 

    target_folder = 'files_to_ingest'
    file_name  = files_metadata[file_id]['Name']

    response = client.sites[site_id].drives[drive_id].items[file_id].get_content().execute_query()

    with open(os.path.join(target_folder,file_name), 'wb') as file:
        file.write(response.value)
    print(f'{file_name} saved')

    ingest_files(files_metadata[file_id], deliverables_list_metadata[file_name])

    os.remove(os.path.join(target_folder,file_name))
    print(f'{file_name} removed')


def traverse_folders_and_files(site_id, drive_id, parent_id, parent_path, folders_csv_filename, files_csv_filename, last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders):
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    folder_items = client.sites[site_id].drives[drive_id].items[parent_id].children.get().top(40).execute_query()    
    current_file_ids = []
    current_folder_ids = []
    for item in folder_items:
        item_path = parent_path + "/" + item.name
        if item.is_folder:
            # It's a folder
            folder_metadata = {
                'ID': item.id,
                'Name': item.name,
                'Path': item_path,
                'WebUrl': item.web_url,
                # 'properties': item.properties
            }

            if item.id in existing_folders:
                if last_run and item.last_modified_datetime > last_run:
                    updated_folders.append(item.id)
                    print(f"Folder updated: {item_path}")
            else:
                created_folders.append(item.id)
                # print(f"Folder found: {item_path}")

            existing_folders[item.id] = folder_metadata
            current_folder_ids.append(item.id)

            # Traverse subfolder
            sub_file_ids, sub_folder_ids = traverse_folders_and_files(site_id, drive_id, item.id, item_path, folders_csv_filename, files_csv_filename, last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders)
            current_file_ids.extend(sub_file_ids)
            current_folder_ids.extend(sub_folder_ids)
        elif item.is_file:
            # It's a file
            permissions = client.sites[site_id].drives[drive_id].items[item.id].permissions.get().execute_query()
            my_permission_set = set()
            for permission in permissions:
                permission_name = permission.to_json()['grantedToV2']['siteGroup']['displayName']
                my_permission_set.add(permission_name)

            file_metadata = {
                'ID': item.id,
                'Name': item.name,
                'Path': parent_path + "/" + item.name,
                'WebUrl': item.web_url,
                'CreatedDateTime': item.created_datetime,
                'Permission': my_permission_set
                # 'Description': getattr(item, 'description', ''),
                # 'EntityTypeName': getattr(item, 'entity_type_name', ''),
                # "properties": item.properties
            }
            if item.id in existing_files:
                if last_run and item.last_modified_datetime > last_run:
                    updated_files.append(item.id)
                    print(f"File updated: {item_path}")
            else:
                created_files.append(item.id)
                print(f"File found: {item_path}")

            existing_files[item.id] = file_metadata
            current_file_ids.append(item.id)

    return current_file_ids, current_folder_ids

def sharepoint_file_acquisition():
    try:
        print("Fetching site ID...")
        site_id = get_site_id(site_url)
        print(f"Site ID: {site_id}")

        print("Fetching all lists...")
        all_lists = get_all_lists(site_id)
        print(f"Found {len(all_lists)} lists.")

        print("Fetching all document libraries...")
        all_drives = get_all_drives(site_id)
        print(f"Found {len(all_drives)} document libraries.")

        user_permission_list = '167bbde3-1341-4d29-9447-0996b92c26ef'
        deliverables_list = 'a76c34cd-0a87-4947-9881-54a32eb64b4e'

        users_list_object = client.sites[site_id].lists[user_permission_list].items.expand(["fields($select=User,Teams,TeamsPermission,Roles)"]).get().top(5000).execute_query()
        users_list_items = [item.to_json()["fields"] for item in users_list_object]
        users_list_csv_filename = os.path.join(os.getcwd(), 'users_permission.csv')
        save_to_csv(users_list_items,users_list_csv_filename)

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
        save_to_csv1(deliverables_item_data,deliverables_list_csv_filename,field_names)

        folders_csv_filename = os.path.join(os.getcwd(), 'folders_metadata.csv')
        files_csv_filename = os.path.join(os.getcwd(), 'files_metadata.csv')

        last_run = get_last_run_timestamp()

        existing_files = load_existing_csv_data(files_csv_filename, 'ID')
        existing_folders = load_existing_csv_data(folders_csv_filename, 'ID')

        created_files = []
        created_folders = []
        updated_files = []
        updated_folders = []

        print("Fetching folders and files from Deliverables...")
        drive_id = "b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO"
        print(f"Processing drive: Deliverables (ID: {drive_id})")
        root_id = client.sites[site_id].drives[drive_id].root.get().execute_query().id
        current_file_ids, current_folder_ids = traverse_folders_and_files(site_id, drive_id, root_id, '', files_csv_filename, files_csv_filename, last_run, existing_files, created_files, updated_files, existing_folders, created_folders, updated_folders)

        existing_files_ids = set(existing_files.keys())
        existing_folders_ids = set(existing_folders.keys())
        current_file_ids_set = set(current_file_ids)
        current_folder_ids_set = set(current_folder_ids)

        deleted_file_ids = existing_files_ids - current_file_ids_set
        deleted_folder_ids = existing_folders_ids- current_folder_ids_set

        for file_id in deleted_file_ids:
            del existing_files[file_id]
        for folder_id in deleted_folder_ids:
            del existing_folders[folder_id]

        update_csv(existing_files, files_csv_filename)
        update_csv(existing_folders, folders_csv_filename)

        update_last_run_timestamp()

        files_metadata = load_existing_csv_data('files_metadata.csv', 'ID')
        deliverables_list_metadata = load_existing_csv_data('deliverables_list.csv','FileLeafRef')

        # file_ids_to_delete = list(deleted_file_ids) + updated_files
        # file_ids_to_process = updated_files + created_files

        # if file_ids_to_delete:
        #     for file_id in file_ids_to_delete:
        #         delete_form_vectostore(file_id)

        # for file_id in file_ids_to_process:
        #     stream_file_content(site_id,drive_id,file_id,files_metadata,deliverables_list_metadata)


    except Exception as e:
        print(f'An error occurred: {e}')

if __name__ == "__main__":
    sharepoint_file_acquisition()