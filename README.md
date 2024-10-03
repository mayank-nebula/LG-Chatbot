ERROR:root:Error occurred while processing file: I/O operation on closed file.

@router.post("/upload-file")
async def upload_single_file(
    background_tasks: BackgroundTasks,
    token_data: TokenData = Depends(authenticate_jwt),
    file: UploadFile = File(...),
):
    """
    Route for uploading a single file.
    """
    userEmailId = token_data.email
    background_tasks.add_task(file_controller.upload_file, userEmailId, file)
    # return await file_controller.upload_file(userEmailId, file)
    return JSONResponse({"message": "File upload started."})


def process_file(file_path: str) -> bool:
    """
    Processes the uploaded file using the pre-processing function.
    """
    try:
        return mail_content_extraction(file_path)
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        return False


# Core functionalities
async def upload_file(userEmailId: str, file: UploadFile):
    """
    Uploads a single file for the given user and processes it.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        file_path = save_uploaded_file(file, file_folder)
        processing_status = process_file(file_path)

        # ingestion_status, ingestion_error = await ingest_files(file_path)

        # if not ingestion_status:
        #     raise ingestion_error

        message = (
            "File uploaded and processed successfully."
            if processing_status
            else "File uploaded, but an error occurred during processing."
        )
        return {
            "filename": file.filename,
            "message": message,
            "status": processing_status,
        }

    except Exception as e:
        logging.error(f"Error occurred while processing file: {str(e)}")
        return custom_error_response(f"Failed to process file {file.filename}", 500)


def mail_content_extraction(file_path: str):
    """
    Processes a file (.msg or .eml) and extracts attachments, if any.
    """
    output_dir = os.path.join(os.path.dirname(file_path), "attachments")

    try:
        if file_path.endswith(".msg"):
            logging.info(f"Processing .msg file: {file_path}")
            extract_msg_attachments(
                file_path,
                output_dir,
            )
        elif file_path.endswith(".eml"):
            logging.info(f"Processing .eml file: {file_path}")
            extract_eml_attachments(
                file_path,
                output_dir,
            )

        logging.info(f"Finished processing file: {file_path}")
        return True
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {str(e)}")
        return False

