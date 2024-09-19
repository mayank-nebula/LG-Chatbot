def delete_files_in_folder(folder_path):
    """
    Delete all files in the specified folder, but keep the folder itself.

    Args:
    folder_path (str): Path to the folder whose contents should be deleted

    """
    # Check if the folder exists
    if not os.path.exists(folder_path):
        print(f"The folder {folder_path} does not exist.")
        return False

    # Iterate over all items in the folder
    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)

        if os.path.isfile(item_path):
            os.unlink(item_path)
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)

    print(f"All contents of {folder_path} have been deleted.")
