def rotate_backups(backup_dir, main_store_path):
    base_name = os.path.basename(main_store_path).replace(".pkl", "")
    
    # Get all backup files that match the base name
    backups = sorted(
        [f for f in os.listdir(backup_dir) if f.startswith(base_name) and "_backup_" in f],
        reverse=True
    )
    
    # Delete the oldest backup if there are already 3 or more
    if len(backups) >= 3:
        os.remove(os.path.join(backup_dir, backups[-1]))
        backups.pop(-1)  # Remove the deleted backup from the list
    
    # Rename the existing backups
    for i in range(len(backups), 0, -1):
        old_name = os.path.join(backup_dir, backups[i-1])
        new_name = os.path.join(backup_dir, f"{base_name}_backup_{i+1}.pkl")
        os.rename(old_name, new_name)
    
    # Create a new backup with the base name
    new_backup_name = f"{base_name}_backup_1.pkl"
    shutil.copyfile(main_store_path, os.path.join(backup_dir, new_backup_name))
