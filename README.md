async def create_progess(
    userEmailId: str,
    filename: str,
    status: str,
    filesize: int,
    current_time: datetime,
    folder: str,
):
    try:
        collection_file = get_file_collection(userEmailId)

        file = await collection_file.find_one(
            {
                "userEmailId": userEmailId,
                "filename": encrypt_data(filename, "Hello"),
                "size": filesize,
            }
        )

        if file and decrypt_data(file["status"], "Hello") == "Processing Failed":
            return await update_progess(userEmailId, status, str(file["_id"]))
        elif file and decrypt_data(file["status"], "Hello") != "Processing Failed":
            raise Exception("File already exists.")

        new_file = File(
            userEmailId=userEmailId,
            filename=encrypt_data(filename, "Hello"),
            status=encrypt_data(status, "Hello"),
            size=filesize,
            folder=encrypt_data(folder if folder else ".", "Hello"),
            createdAt=current_time,
            updatedAt=current_time,
        )

        result = await collection_file.insert_one(new_file.dict())
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"An error occurred while creating progress: {str(e)}")
        raise e
