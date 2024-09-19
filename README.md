main_folders = ['files_to_ingest', 'docstore_normal_rag', 'docstore_summary_rag', 'backup']

# Define subfolders for the backup folder
backup_subfolders = ['docstore_normal_rag', 'docstore_summary_rag']

def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"Created folder: {folder_path}")
    else:
        print(f"Folder already exists: {folder_path}")

# Create main folders
for folder in main_folders:
    create_folder(folder)

# Create subfolders in the backup folder
for subfolder in backup_subfolders:
    backup_subfolder_path = os.path.join('backup', subfolder)
    create_folder(backup_subfolder_path)
