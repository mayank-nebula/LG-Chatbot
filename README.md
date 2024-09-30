import os
import shutil
from typing import List
from fastapi import UploadFile
from utils.pre_processing import process_file

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
    user_dir = create_user_directory(userEmailId)
    
    # Create a folder based on the file name (without extension)
    file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
    os.makedirs(file_folder, exist_ok=True)

    # Save the uploaded file inside the individual folder
    file_path = os.path.join(file_folder, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process the file (extract attachments, etc.)
    await process_file(file_path)

    return {
        "filename": file.filename,
        "message": "File uploaded and processed successfully",
    }


async def upload_files(userEmailId: str, files: List[UploadFile]):
    """
    Handles the upload of multiple files, processes each file, and saves them and their attachments
    in individual folders based on each file's name (without extension).
    """
    user_dir = create_user_directory(userEmailId)
    filenames = []
    
    for file in files:
        # Create a folder for each file based on its name (without extension)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        # Save the uploaded file inside its individual folder
        file_path = os.path.join(file_folder, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        filenames.append(file.filename)

        # Process the file (extract attachments, etc.)
        await process_file(file_path)

    return {
        "filenames": filenames,
        "message": "Files uploaded and processed successfully",
    }


async def upload_folder(user_email_id: str, files: List[UploadFile]):
    """
    Handles the upload of a folder structure with files, saving each file in its original
    folder structure and processing them.
    """
    user_dir = create_user_directory(user_email_id)
    
    for file in files:
        # Handle folder structure based on the provided file paths
        folder_structure = os.path.dirname(file.filename)
        full_path = os.path.join(user_dir, folder_structure)
        os.makedirs(full_path, exist_ok=True)

        # Save the file in its original folder structure
        file_path = os.path.join(full_path, os.path.basename(file.filename))
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the file (extract attachments, etc.)
        await process_file(file_path)

    return {"message": "Folder uploaded successfully with files processed"}
