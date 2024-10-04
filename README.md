async def delete_file(userEmailId: str, files: List[str], ids: List[str]):
    """
    Deletes the specified files for the given user.
    """
    try:
        user_upload_paths = os.path.join(UPLOAD_DIR, userEmailId)

        if not os.path.exists(user_upload_paths):
            logging.warning(f"Uploaded mail for user {userEmailId} not found")
            return custom_error_response(
                status_code=404, detail="User uploaded mail not found."
            )

        delete_file_status, delete_file_error = await delete_files(ids)

        if not delete_file_status:
            raise delete_file_error

        for file, id in zip(files, ids):
            delete_from_chroma, delete_from_chroma_error = delete_from_collection(id)
            if not delete_from_chroma:
                raise delete_from_chroma_error

            folder_path = os.path.join(user_upload_paths, os.path.splitext(file)[0])

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
