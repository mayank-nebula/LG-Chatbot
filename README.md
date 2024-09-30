import shutil
from typing import List
from pathlib import Path
from fastapi import UploadFile
from utils.pre_processing import process_file


UPLOAD_DIR = Path("uploads")

if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir()


def create_user_directory(userEmailId: str) -> Path:
    user_dir = UPLOAD_DIR / userEmailId
    if not user_dir.exists():
        user_dir.mkdir(parents=True)
    return user_dir


async def upload_file(userEmailId: str, file: UploadFile):
    user_dir = create_user_directory(userEmailId)
    file_path = user_dir / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    await process_file(file_path)

    return {
        "filename": file.filename,
        "message": "File uploaded and processed successfully",
    }


async def upload_files(userEmailId: str, files: List[UploadFile]):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    for file in files:
        file_path = user_dir / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        filenames.append(file.filename)

        await process_file(file_path)

    return {
        "filenames": filenames,
        "message": "Files uploaded and processed successfully",
    }


async def upload_folder(user_email_id: str, files: List[UploadFile]):
    user_dir = create_user_directory(user_email_id)
    for file in files:
        folder_structure = Path(file.filename).parent
        full_path = user_dir / folder_structure
        full_path.mkdir(parents=True, exist_ok=True)
        file_path = full_path / Path(file.filename).name
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        await process_file(file_path)

    return {"message": "Folder uploaded successfully with files processed"}
