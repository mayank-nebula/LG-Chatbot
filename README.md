from typing import List
from controller import file_controller
from auth.utils.jwt_utils import TokenData
from utils.security_utils import authenticate_jwt
from fastapi import APIRouter, UploadFile, File, Depends

router = APIRouter()


@router.post("/upload-file")
async def upload_single_file(
    file: UploadFile = File(...), token_data: TokenData = Depends(authenticate_jwt)
):
    """
    Route for uploading a single file.
    """
    user_email_id = token_data.email
    return await file_controller.upload_file(user_email_id, file)


@router.post("/upload-files")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    token_data: TokenData = Depends(authenticate_jwt),
):
    """
    Route for uploading multiple files.
    """
    user_email_id = token_data.email
    return await file_controller.upload_files(user_email_id, files)


@router.post("/upload-folder")
async def upload_folder(
    files: List[UploadFile] = File(...),
    token_data: TokenData = Depends(authenticate_jwt),
):
    """
    Route for uploading a folder with its structure.
    """
    user_email_id = token_data.email
    return await file_controller.upload_folder(user_email_id, files)





import shutil
from typing import List
from pathlib import Path
from fastapi import UploadFile

UPLOAD_DIR = Path("uploads")

# Ensure the base uploads directory exists
if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir()


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
    Upload a single file for a user.
    """
    user_dir = create_user_directory(user_email_id)
    file_path = user_dir / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "message": "File uploaded successfully"}


async def upload_files(user_email_id: str, files: List[UploadFile]):
    """
    Upload multiple files for a user.
    """
    user_dir = create_user_directory(user_email_id)
    filenames = []
    for file in files:
        file_path = user_dir / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        filenames.append(file.filename)
    return {"filenames": filenames, "message": "Files uploaded successfully"}


async def upload_folder(user_email_id: str, files: List[UploadFile]):
    """
    Upload a folder and maintain the folder structure.
    """
    user_dir = create_user_directory(user_email_id)
    for file in files:
        folder_structure = Path(file.filename).parent
        full_path = user_dir / folder_structure
        full_path.mkdir(parents=True, exist_ok=True)
        file_path = full_path / Path(file.filename).name
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    return {"message": "Folder uploaded successfully with files"}
