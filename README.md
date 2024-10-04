async def upload_file(
    userEmailId: str,
    file: UploadFile,
    background_tasks: BackgroundTasks,
):
    """
    Uploads a single file for the given user and processes it.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        file_path = save_uploaded_file(file, file_folder)

        filesize = os.path.getsize(file_path)

        background_tasks.add_task(
            process_file_async, userEmailId, file_path, file.filename, filesize
        )

        return {
            "filename": file.filename,
            "message": "File uploaded successfully. Processing started.",
            "status": True,
        }

    except Exception as e:
        logging.error(f"Error occurred while processing file: {str(e)}")
        return custom_error_response(f"Failed to process file {file.filename}", 500)
