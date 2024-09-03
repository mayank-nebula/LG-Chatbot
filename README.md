def sharepoint_file_acquisition():
    global token, token_expires_at, client

    try:
        # Acquire a new access token and set up the Microsoft Graph API client.
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

        # Retrieve the site ID from the SharePoint site URL.
        site_id = get_site_id(client, site_url)

        # Fetch user permissions and deliverables list names from environment variables.
        user_permission_list = os.getenv("USER_PERMISSION_LIST")
        deliverables_list = os.getenv("DELIVERABLES_LIST")

        # Log the start of user permissions fetching process.
        logging.info("Fetching user permissions...")

        # Fetch user permissions list items from SharePoint.
        users_list_object = (
            client.sites[site_id]
            .lists[user_permission_list]
            .items.expand(
                ["fields($select=User,UserLookupId,Teams,TeamsPermission,Roles)"]
            )
            .get()
            .top(5000)
            .execute_query()
        )

        # Convert the fetched user permissions items to a JSON format and extract fields.
        users_list_items = [item.to_json()["fields"] for item in users_list_object]

        # Save the user permissions data to a CSV file.
        users_list_csv_filename = os.path.join(os.getcwd(), "users_permission.csv")
        save_to_csv(users_list_items, users_list_csv_filename)

        # Load the saved user permissions CSV file into a DataFrame.
        df = pd.read_csv("users_permission.csv")

        # Combine the 'Teams' and 'TeamsPermission' columns into a 'Permissions' column.
        df["Permissions"] = df["Teams"].astype(str) + df["TeamsPermission"].astype(str)

        # Group the DataFrame by 'User' and 'UserLookupId' and concatenate permissions.
        result = (
            df.groupby(["User", "UserLookupId"])["Permissions"]
            .apply(lambda x: ";".join(x))
            .reset_index()
        )

        # Rename the columns to 'Name', 'UserLookupId', and 'Permissions'.
        result.columns = ["Name", "UserLookupId", "Permissions"]

        # Save the grouped and processed permissions data back to the CSV file.
        result.to_csv("users_permission.csv", index=False)

        # Define additional folders where the CSV file will be saved.
        additional_folders = [express_folder, fast_folder]

        # Save the CSV file to the specified additional folders.
        for folder in additional_folders:
            final_path = os.path.join(folder, "users_permission.csv")
            result.to_csv(final_path, index=False)

        # Log the start of the deliverables list fetching process.
        logging.info("Fetching deliverables list...")

        # Fetch the deliverables list items from SharePoint.
        deliverables_list_object = (
            client.sites[site_id]
            .lists[deliverables_list]
            .items.expand(["fields"])
            .get()
            .top(5000)
            .execute_query()
        )

        # Initialize lists to store deliverables data and field names.
        deliverables_item_data = []
        deliverables_field_names = set()

        # Process each deliverable item and collect field names.
        for item in deliverables_list_object:
            fields = item.to_json()["fields"]
            if fields["ContentType"] == "Document":
                deliverables_item_data.append(fields)
                deliverables_field_names.update(fields.keys())

        # Convert the field names to a list.
        deliverables_field_names = list(deliverables_field_names)

        # Ensure all fields are present in each deliverable item, filling in missing fields with None.
        for fields in deliverables_item_data:
            for field in deliverables_field_names:
                if field not in fields:
                    fields[field] = None

        # Save the deliverables list data to a CSV file.
        deliverables_list_csv_filename = os.path.join(
            os.getcwd(), "deliverables_list.csv"
        )
        field_names = deliverables_item_data[0].keys()
        save_to_csv1(
            deliverables_item_data,
            deliverables_list_csv_filename,
            field_names,
            additional_folders=[express_folder, fast_folder],
        )

        # Define filenames for folders and files metadata CSVs.
        folders_csv_filename = os.path.join(os.getcwd(), "folders_metadata.csv")
        files_csv_filename = os.path.join(os.getcwd(), "files_metadata.csv")

        # Retrieve the last run timestamp.
        last_run = get_last_run_timestamp()

        # Load existing folders and files metadata from CSV files.
        existing_files = load_existing_csv_data(files_csv_filename, "ID")
        existing_folders = load_existing_csv_data(folders_csv_filename, "ID")

        # Initialize lists for tracking created and updated files and folders.
        created_files = []
        created_folders = []
        updated_files = []
        updated_folders = []

        # Log the start of folders and files fetching process.
        logging.info("Fetching folders and files from Deliverables...")

        # Get the drive ID from environment variables.
        drive_id = os.getenv("DRIVE_ID")

        # Log the processing of the drive.
        logging.info(f"Processing drive: Deliverables (ID: {drive_id})")

        # Get the root folder ID of the drive.
        root_id = client.sites[site_id].drives[drive_id].root.get().execute_query().id

        # Traverse through folders and files, updating the tracking lists.
        current_file_ids, current_folder_ids = traverse_folders_and_files(
            site_id,
            drive_id,
            root_id,
            "",
            last_run,
            existing_files,
            created_files,
            updated_files,
            existing_folders,
            created_folders,
            updated_folders,
        )

        # Log that all folders have been processed.
        logging.info("All folders done.")

        # Determine IDs of existing and current files and folders.
        existing_files_ids = set(existing_files.keys())
        existing_folders_ids = set(existing_folders.keys())
        current_file_ids_set = set(current_file_ids)
        current_folder_ids_set = set(current_folder_ids)

        # Identify deleted file and folder IDs.
        deleted_file_ids = existing_files_ids - current_file_ids_set
        deleted_folder_ids = existing_folders_ids - current_folder_ids_set

        # Remove deleted files and folders from the existing metadata.
        for file_id in deleted_file_ids:
            del existing_files[file_id]
        for folder_id in deleted_folder_ids:
            del existing_folders[folder_id]

        # Update the CSV files with the modified metadata.
        update_csv(existing_files, files_csv_filename)
        update_csv(existing_folders, folders_csv_filename)

        # Update the timestamp of the last run.
        update_last_run_timestamp()

        # Load the updated files and deliverables metadata from CSV files.
        files_metadata = load_existing_csv_data("files_metadata.csv", "ID")
        deliverables_list_metadata = load_existing_csv_data(
            "deliverables_list.csv", "FileLeafRef"
        )

        # Prepare lists of file IDs to delete or process.
        file_ids_to_delete = list(deleted_file_ids) + updated_files
        file_ids_to_process = updated_files + created_files

        # Delete documents from the vector store for the deleted or updated files.
        if file_ids_to_delete:
            delete_from_vectostore(file_ids_to_delete)

        # Stream file content and update the vector store for the processed files.
        for file_id in file_ids_to_process:
            stream_file_content(
                site_id, drive_id, file_id, files_metadata, deliverables_list_metadata
            )

        # Update and save the normal RAG docstore, with backups.
        update_and_save_docstore(
            "docstores_normal_rag",
            os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl"),
            os.path.join(os.getcwd(), "backup", "normal"),
        )

        # Update and save the summary RAG docstore, with backups.
        update_and_save_docstore(
            "docstores_summary_rag",
            os.path.join(
                parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
            ),
            os.path.join(os.getcwd(), "backup", "summary"),
        )

        # Log that the ingestion process is complete.
        logging.info("Ingestion Complete")
    
    # Catch and log any errors that occur during the process.
    except Exception as e:
        logging.error(f"An error occurred: {e}")

# Execute the SharePoint file acquisition process when the script is run directly.
if __name__ == "__main__":
    sharepoint_file_acquisition()
