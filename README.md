def rotate_backups(backup_dir, main_store_path):
    base_name = os.path.basename(main_store_path).replace(".pkl", "")
    
    # List all existing backups
    backups = sorted(
        [f for f in os.listdir(backup_dir) if f.startswith(base_name)],
        reverse=True
    )
    
    # Remove the oldest backup if more than 3
    if len(backups) >= 3:
        os.remove(os.path.join(backup_dir, backups[-1]))
    
    # Shift the remaining backups by renaming them
    for i in range(len(backups), 0, -1):
        os.rename(
            os.path.join(backup_dir, f"{base_name}_backup_{i}.pkl"),
            os.path.join(backup_dir, f"{base_name}_backup_{i+1}.pkl")
        )
    
    # Create a new backup with a timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copyfile(
        main_store_path,
        os.path.join(backup_dir, f"{base_name}_backup_1_{timestamp}.pkl")
    )
