import shutil
from typing import List
from pathlib import Path
from fastapi import UploadFile
from utils.pre_processing import process_file


UPLOAD_DIR = Path("uploads")

if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir()


def create_user_directory(userEmailId: str) -> Path:
    """
    Creates a user directory based on their email ID if it doesn't exist.
    """
    user_dir = UPLOAD_DIR / userEmailId
    if not user_dir.exists():
        user_dir.mkdir(parents=True)
    return user_dir


async def upload_file(userEmailId: str, file: UploadFile):
    """
    Handles the upload of a single file and processes it, saving the file and its attachments
    in an individual folder based on the file name (without extension).
    """
    user_dir = create_user_directory(userEmailId)
    
    # Create a folder based on the file name (without extension)
    file_folder = user_dir / Path(file.filename).stem
    file_folder.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file inside the individual folder
    file_path = file_folder / file.filename
    with file_path.open("wb") as buffer:
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
        file_folder = user_dir / Path(file.filename).stem
        file_folder.mkdir(parents=True, exist_ok=True)

        # Save the uploaded file inside its individual folder
        file_path = file_folder / file.filename
        with file_path.open("wb") as buffer:
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
        folder_structure = Path(file.filename).parent
        full_path = user_dir / folder_structure
        full_path.mkdir(parents=True, exist_ok=True)

        # Save the file in its original folder structure
        file_path = full_path / Path(file.filename).name
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the file (extract attachments, etc.)
        await process_file(file_path)

    return {"message": "Folder uploaded successfully with files processed"}

