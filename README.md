import os
import shutil
from typing import List
from fastapi import UploadFile
from utils.pre_processing import preprocessing_file

UPLOAD_DIR = os.path.join("uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def create_user_directory(userEmailId: str) -> str:
    user_dir = os.path.join(UPLOAD_DIR, userEmailId)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    return user_dir


async def upload_file(userEmailId: str, file: UploadFile):
    try:
        user_dir = create_user_directory(userEmailId)

        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        file_path = os.path.join(file_folder, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

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


async def upload_files(userEmailId: str, files: List[UploadFile]):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    statuses = []

    for file in files:
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        file_path = os.path.join(file_folder, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        filenames.append(file.filename)

        try:
            preprocessing_result = await preprocessing_file(file_path)
            statuses.append(preprocessing_result)
        except Exception as e:
            print(f"Error processing file {file.filename}: {e}")
            statuses.append(False)

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


async def upload_folder(userEmailId: str, files: List[UploadFile]):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    statuses = []

    for file in files:
        folder_structure = os.path.dirname(file.filename)
        full_folder_path = os.path.join(user_dir, folder_structure)
        os.makedirs(full_folder_path, exist_ok=True)

        file_path = os.path.join(full_folder_path, os.path.basename(file.filename))
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        filenames.append(file.filename)

        try:
            preprocessing_result = await preprocessing_file(file_path)
            statuses.append(preprocessing_result)
        except Exception as e:
            print(f"Error processing file {file.filename}: {e}")
            statuses.append(False)

    if all(statuses):
        message = "All files and folders uploaded and processed successfully."
    elif any(statuses):
        message = "Some files and folders were uploaded and processed successfully."
    else:
        message = "All files and folders were uploaded, but an error occurred during processing."

    return {
        "filenames": filenames,
        "message": message,
        "status": statuses,
    }
