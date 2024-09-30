async def upload_file(userEmailId: str, file: UploadFile):
    """
    Handles the upload of a single file and processes it, saving the file and its attachments
    in an individual folder based on the file name (without extension).
    """
    user_dir = create_user_directory(userEmailId)

    file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
    os.makedirs(file_folder, exist_ok=True)

    file_path = os.path.join(file_folder, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    await process_file(file_path)

    return {
        "filename": file.filename,
        "message": "File uploaded and processed successfully",
    }
