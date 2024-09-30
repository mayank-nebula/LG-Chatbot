import os
import shutil
import logging
from typing import List
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from utils.pre_processing import preprocessing_file

# Constants
UPLOAD_DIR = os.path.join("uploads")

# Ensure the upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# Utility functions
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


async def process_file(file_path: str) -> bool:
    """
    Processes the uploaded file using the pre-processing function.
    """
    try:
        return await preprocessing_file(file_path)
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
        processing_status = await process_file(file_path)

        message = "File uploaded and processed successfully." if processing_status else "File uploaded, but an error occurred during processing."
        return {
            "filename": file.filename,
            "message": message,
            "status": processing_status,
        }

    except Exception as e:
        logging.error(f"Error occurred while processing file: {str(e)}")
        return custom_error_response(f"Failed to process file {file.filename}", 500)


async def upload_files(userEmailId: str, files: List[UploadFile]):
    """
    Uploads and processes multiple files for the given user.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        filenames, statuses = [], []

        for file in files:
            file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
            os.makedirs(file_folder, exist_ok=True)

            file_path = save_uploaded_file(file, file_folder)
            filenames.append(file.filename)

            processing_status = await process_file(file_path)
            statuses.append(processing_status)

        message = get_status_message(statuses)
        return {
            "filenames": filenames,
            "message": message,
        }

    except Exception as e:
        logging.error(f"Error uploading files for user {userEmailId}: {e}")
        return custom_error_response("Failed to upload files.", 500)


async def upload_folder(userEmailId: str, files: List[UploadFile]):
    """
    Uploads multiple files with folder structure and processes them.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        filenames, statuses = [], []

        for file in files:
            folder_structure = os.path.dirname(file.filename)
            full_folder_path = os.path.join(user_dir, folder_structure)
            os.makedirs(full_folder_path, exist_ok=True)

            file_path = save_uploaded_file(file, full_folder_path)
            filenames.append(file.filename)

            processing_status = await process_file(file_path)
            statuses.append(processing_status)

        message = get_status_message(statuses)
        return {
            "filenames": filenames,
            "message": message,
        }

    except Exception as e:
        logging.error(f"Error uploading folder for user {userEmailId}: {e}")
        return custom_error_response("Failed to upload folder.", 500)


async def delete_file(userEmailId: str, files: List[str]):
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

        for file in files:
            folder_path = os.path.join(user_upload_paths, file)

            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                shutil.rmtree(folder_path)
                logging.info(f"Deleted mail: {file}")
            else:
                logging.warning(f"Mail not found {file}")

        return {"message": "Mail deleted successfully"}
    except Exception as e:
        logging.error(f"Error occurred while deleting mail for user {userEmailId}: {str(e)}")
        return custom_error_response("Failed to delete mail. Please try again later", 500)


# Helper functions
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
