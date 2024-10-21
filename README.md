async def save_uploaded_file(
    file: UploadFile,
    folder_path: str,
    folder: bool,
    userEmailId: str,
    current_time: datetime,
    folder_name: str = ".",
):
    try:
        if not folder:
            file_path = os.path.join(folder_path, file.filename)
        else:
            file_path = os.path.join(folder_path, Path(file.filename).name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        filesize = os.path.getsize(file_path)

        encrypt_file(file_path, "Hello")

        created_id = await create_progess(
            userEmailId,
            file.filename,
            "Upload Successful",
            filesize,
            current_time,
            folder_name,
        )
        return file_path, created_id, filesize
    except Exception as e:
        raise e
