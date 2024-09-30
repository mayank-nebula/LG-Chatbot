import os
import shutil
from typing import List
from fastapi import UploadFile
from utils.pre_processing import preprocessing_file

UPLOAD_DIR = os.path.join("uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def create_user_directory(userEmailId: str) -> str:
    """
    Creates a user directory based on their email ID if it doesn't exist.
    Returns the path to the user directory.
    """
    user_dir = os.path.join(UPLOAD_DIR, userEmailId)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    return user_dir


async def upload_file(userEmailId: str, file: UploadFile):
    """
    Handles the upload of a single file and processes it, saving the file and its attachments
    in an individual folder based on the file name (without extension).
    """
    try:
        user_dir = create_user_directory(userEmailId)

        # Create folder based on file name (without extension)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        # Save file to the folder
        file_path = os.path.join(file_folder, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the file
        preprocessing_result = await preprocessing_file(file_path)

        if preprocessing_result:
            message = "File uploaded and processed successfully."
        else:
            message = "File uploaded, but an error occurred during processing."

        return {
            "filename": file.filename,
            "message": message,
            "status": preprocessing_result,
        }

    except Exception as e:
        return {
            "filename": file.filename,
            "message": f"Error occurred while processing file: {str(e)}",
            "status": False,
        }


async def upload_files(userEmailId: str, files: List<UploadFile]):
    """
    Handles the upload of multiple files, processes each file, and saves them and their attachments
    in individual folders based on each file's name (without extension).
    """
    user_dir = create_user_directory(userEmailId)
    filenames = []
    statuses = []

    for file in files:
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        # Save the file in its respective folder
        file_path = os.path.join(file_folder, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        filenames.append(file.filename)

        # Process the file
        try:
            preprocessing_result = await preprocessing_file(file_path)
            statuses.append(preprocessing_result)
        except Exception as e:
            # Log or print the error for debugging purposes
            print(f"Error processing file {file.filename}: {e}")
            statuses.append(False)

    # Determine the overall message based on file processing results
    if all(statuses):
        message = "All files uploaded and processed successfully."
    elif any(statuses):
        message = "Some files were uploaded and processed successfully."
    else:
        message = "All files were uploaded, but an error occurred during processing."

    return {
        "filenames": filenames,
        "message": message,
        "status": statuses,
    }
