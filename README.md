async def upload_files(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    try:
        user_dir = create_user_directory(userEmailId)
        filenames = []
        existing_files = []

        for file in files:
            if not file.filename:
                raise Exception("No File Uploaded.")
            current_time = datetime.utcnow()
            formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
            file_folder = os.path.join(
                user_dir, f"{os.path.splitext(file.filename)[0]}_{formatted_time}"
            )

            os.makedirs(file_folder, exist_ok=True)
            file_path = save_uploaded_file(file, file_folder)
            filenames.append(file.filename)

            filesize = os.path.getsize(file_path)

            background_tasks.add_task(
                process_file_async,
                userEmailId,
                file_path,
                file.filename,
                filesize,
                file_folder,
                current_time,
            )

        if filenames:
            return {
                "status": True,
                "message": f"All {len(filenames)} files uploaded successfully.",
                "uploaded_files": filenames,
            }
        else:
            return {
                "status": False,
                "message": "No files were uploaded. All files already exist.",
            }
