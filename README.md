import shutil
from typing import List
from pathlib import Path
from fastapi import UploadFile
import logging

# Import processing logic from pre-processing.py
from pre_processing import process_file

UPLOAD_DIR = Path("uploads")

# Ensure the base uploads directory exists
if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir()

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def create_user_directory(user_email_id: str) -> Path:
    """
    Create a directory for the user based on their email ID.
    """
    user_dir = UPLOAD_DIR / user_email_id
    if not user_dir.exists():
        user_dir.mkdir(parents=True)
    return user_dir


async def upload_file(user_email_id: str, file: UploadFile):
    """
    Upload a single file for a user and then process it.
    """
    user_dir = create_user_directory(user_email_id)
    file_path = user_dir / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Call the process function after the file is uploaded
    await process_file(file_path)

    return {"filename": file.filename, "message": "File uploaded and processed successfully"}


async def upload_files(user_email_id: str, files: List[UploadFile]):
    """
    Upload multiple files for a user and process them one by one.
    """
    user_dir = create_user_directory(user_email_id)
    filenames = []
    for file in files:
        file_path = user_dir / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        filenames.append(file.filename)
        
        # Process each file after uploading it
        await process_file(file_path)

    return {"filenames": filenames, "message": "Files uploaded and processed successfully"}


async def upload_folder(user_email_id: str, files: List[UploadFile]):
    """
    Upload a folder and maintain the folder structure. Process each file one by one after uploading.
    """
    user_dir = create_user_directory(user_email_id)
    for file in files:
        folder_structure = Path(file.filename).parent
        full_path = user_dir / folder_structure
        full_path.mkdir(parents=True, exist_ok=True)
        file_path = full_path / Path(file.filename).name
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process each file after uploading it
        await process_file(file_path)

    return {"message": "Folder uploaded successfully with files processed"}
