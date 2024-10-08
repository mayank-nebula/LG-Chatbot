async def extract_file_details(ids: list):
    try:
        collection_file = get_file_collection()
        object_ids = [ObjectId(_id) for _id in ids]

        pipeline = [
            {"$match": {"_id": {"$in": object_ids}}},
            {"$project": {"_id": 0, "filename": 1, "createdAt": 1, "folder": 1}},
        ]
        result = await collection_file.aggregate(pipeline).to_list(length=None)

        combined_results = []
        for file in result:
            if file["folder"] != "No":
                folder = file["folder"]

            filename_woext = os.path.splitext(file["filename"])[0]
            if isinstance(file["createdAt"], datetime):
                timestamp_str = file["createdAt"].strftime("%Y-%m-%d-%H-%M-%S")
            else:
                timestamp_str = str(file["createdAt"])

            combined_string = f"{filename_woext}_{timestamp_str}"
            combined_results.append(combined_string)

        return combined_results, None
    except Exception as e:
        logging.error(f"An error occurred while extracting file details: {str(e)}")
        return None, e




async def delete_file(userEmailId: str, ids: List[str]):
    try:
        user_upload_paths = os.path.join(UPLOAD_DIR, userEmailId)

        if not os.path.exists(user_upload_paths):
            logging.warning(f"User directory for user {userEmailId} not found")
            return custom_error_response(
                status_code=404, detail="User directory not found."
            )

        combined_results, combined_results_error = await extract_file_details(ids)
        if not combined_results:
            raise combined_results_error

        delete_file_status, delete_file_error = await delete_files(ids)
        if not delete_file_status:
            raise delete_file_error

        delete_structured_status, delete_structured_error = (
            await delete_from_structured_collection(ids)
        )
        if not delete_structured_status:
            raise delete_structured_error

        for file, id in zip(combined_results, ids):
            delete_from_chroma, delete_from_chroma_error = delete_from_collection(id)
            if not delete_from_chroma:
                raise delete_from_chroma_error

            folder_path = os.path.join(user_upload_paths, file)

            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                shutil.rmtree(folder_path)
                logging.info(f"Deleted mail: {file}")
            else:
                logging.warning(f"Mail not found {file}")

        return {"message": "Mail deleted successfully"}
    except Exception as e:
        logging.error(
            f"Error occurred while deleting mail for user {userEmailId}: {str(e)}"
        )
        return custom_error_response(
            "Failed to delete mail. Please try again later", 500
        )



