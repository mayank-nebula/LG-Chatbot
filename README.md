async def upload_files(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    failed_files = []

    for file in files:
        if not file.filename:
            failed_files.append("Unnamed file")
            continue

        try:
            current_time = datetime.utcnow()
            formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
            file_folder = os.path.join(
                user_dir, f"{os.path.splitext(file.filename)[0]}_{formatted_time}"
            )

            os.makedirs(file_folder, exist_ok=True)
            file_path = save_uploaded_file(file, file_folder)
            filesize = os.path.getsize(file_path)

            filenames.append({"filename": file.filename, "size": filesize})

            background_tasks.add_task(
                process_file_async,
                userEmailId,
                file_path,
                file.filename,
                filesize,
                file_folder,
                current_time,
            )
        except Exception as e:
            failed_files.append(f"{file.filename}: {str(e)}")

    if filenames:
        status = True
        if failed_files:
            message = f"Uploaded {len(filenames)} file(s), {len(failed_files)} file(s) failed."
        else:
            message = f"Successfully uploaded {len(filenames)} file(s)."
    else:
        status = False
        message = f"Upload Failed: {len(filenames)} file(s) failed to upload."

    return {
        "status": status,
        "message": message,
        "uploaded_files": filenames,
        "failed_files": failed_files,
    }


async def upload_folder(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    failed_files = []

    for file in files:
        if not Path(file.filename).name:
            failed_files.append("Unnamed file")
            continue
        try:
            # folder_name = Path(file.filename).parent
            folder_name = "test"
            current_time = datetime.utcnow()
            formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
            file_folder = os.path.join(
                user_dir,
                folder_name,
                f"{os.path.splitext(Path(file.filename).name)[0]}_{formatted_time}",
            )

            os.makedirs(file_folder, exist_ok=True)
            file_path = save_uploaded_file(file, file_folder, True)
            filesize = os.path.getsize(file_path)
            filenames.append({"filename": Path(file.filename).name, "size": filesize})

            background_tasks.add_task(
                process_file_async,
                userEmailId,
                file_path,
                Path(file.filename).name,
                filesize,
                file_folder,
                current_time,
                folder_name
            )
        except Exception as e:
            failed_files.append(f"{Path(file.filename).name}: {str(e)}")

    if filenames:
        status = True
        if failed_files:
            message = f"Uploaded {len(filenames)} file(s), {len(failed_files)} file(s) failed."
        else:
            message = f"Successfully uploaded {len(filenames)} file(s)."
    else:
        status = False
        message = f"Upload Failed: {len(filenames)} file(s) failed to upload."

    return {
        "status": status,
        "message": message,
        "uploaded_files": filenames,
        "failed_files": failed_files,
    }
