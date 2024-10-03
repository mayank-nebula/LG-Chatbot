async def upload_files(userEmailId: str, files: List[UploadFile]):
    """
    Uploads and processes multiple files for the given user.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        filenames, statuses = [], []

        for file in files:
            try:
                file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
                os.makedirs(file_folder, exist_ok=True)

                file_path = save_uploaded_file(file, file_folder)
                filenames.append(file.filename)

                processing_status, processing_status_error = process_file(file_path)

                if not processing_status:
                    raise processing_status_error

                create_progress_status, create_progress_error = await create_progess(
                    userEmailId, file.filename, "Upload Successful"
                )

                if not create_progress_status:
                    raise create_progress_error

                ingestion_status, ingestion_error = await ingest_files(file_path)

                if not ingestion_status:
                    raise ingestion_error

                update_progess_status, update_progess_error = await update_progess(
                    userEmailId, file.filename, "Ingestion Successful"
                )

                if not update_progess_status:
                    raise update_progess_error

                statuses.append(processing_status)

            except Exception as e:
                delete_from_collection(file.filename)
                await update_progess(userEmailId, file.filename, "Processing Failed")
                logging.error(f"Error uploading files for user {userEmailId}: {e}")
                return custom_error_response("Failed to upload files.", 500)

        message = get_status_message(statuses)
        return {
            "filenames": filenames,
            "message": message,
        }

    except Exception as e:
        logging.error(f"Error uploading files for user {userEmailId}: {e}")
        return custom_error_response("Failed to upload files.", 500)
