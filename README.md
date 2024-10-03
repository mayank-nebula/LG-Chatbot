@router.post("/upload-file")
async def upload_single_file(
    file: UploadFile = File(...),
    token_data: TokenData = Depends(authenticate_jwt),
):
    """
    Route for uploading a single file.
    """
    userEmailId = token_data.email
    return await file_controller.upload_file(userEmailId, file)




import os
import shutil
import logging
from typing import List
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from ingestion.ingest_files import ingest_files
from utils.chromadb_utils import initialize_chroma_client
from utils.mailContentExtraction_utils import mail_content_extraction
from utils.progess_utils import create_progess, update_progess, delete_files

UPLOAD_DIR = os.path.join("uploads")
CHROMA_CLIENT = initialize_chroma_client()

collection_normal = CHROMA_CLIENT.get_or_create_collection(name="EmailAssistant")
collection_summary = CHROMA_CLIENT.get_or_create_collection(
    name="EmailAssistant_Summary"
)

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def custom_error_response(detail: str, status_code: int = 400):
    return JSONResponse(status_code=status_code, content={"detail": detail})


def create_user_directory(userEmailId: str) -> str:
    """
    Creates a directory for the user if it doesn't exist.
    """
    user_dir = os.path.join(UPLOAD_DIR, userEmailId)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    return user_dir


def save_uploaded_file(file: UploadFile, folder_path: str) -> str:
    """
    Saves the uploaded file to the specified folder.
    """
    file_path = os.path.join(folder_path, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path


def process_file(file_path: str) -> bool:
    """
    Processes the uploaded file using the pre-processing function.
    """
    try:
        return mail_content_extraction(file_path)
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        return False, e


def get_status_message(statuses: List[bool]) -> str:
    """
    Generates a status message based on the result of processing files.
    """
    if all(statuses):
        return "All files uploaded and processed successfully."
    elif any(statuses):
        return "Some files were uploaded and processed successfully."
    else:
        return "All files were uploaded, but an error occurred during processing."


def delete_from_collection(file):
    try:
        collection_normal.delete(where={"filename": file})
        collection_summary.delete(where={"filename": file})
        return True, None
    except Exception as e:
        logging.error(f"An error occurred while deleting from chromaDB: {e}")
        return False, e


# Core functionalities
async def upload_file(
    userEmailId: str,
    file: UploadFile,
):
    """
    Uploads a single file for the given user and processes it.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        file_path = save_uploaded_file(file, file_folder)

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

        message = (
            "File uploaded and processed successfully."
            if update_progess_status
            else "File uploaded, but an error occurred during processing."
        )
        return {
            "filename": file.filename,
            "message": message,
            "status": processing_status,
        }

    except Exception as e:
        delete_from_collection(file.filename)
        await update_progess(userEmailId, file.filename, "Processing Failed")
        logging.error(f"Error occurred while processing file: {str(e)}")
        return custom_error_response(f"Failed to process file {file.filename}", 500)
