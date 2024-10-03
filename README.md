import os
import logging
import extract_msg
from email import policy
from email.parser import BytesParser

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx"}


async def extract_eml_attachments(eml_file: str, output_dir: str):
    try:
        os.makedirs(output_dir, exist_ok=True)

        with open(eml_file, "rb") as f:
            msg = BytesParser(policy=policy.default).parse(f)

        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                ext = os.path.splitext(filename)[1].lower()
                if ext in ALLOWED_EXTENSIONS:
                    attachment_path = os.path.join(output_dir, filename)
                    with open(attachment_path, "wb") as fp:
                        fp.write(part.get_payload(decode=True))
                    logging.info(f"Attachment {filename} saved at {attachment_path}")
                else:
                    logging.info(
                        f"Skipped attachment {filename} (unsupported file type)"
                    )
    except Exception as e:
        raise e


async def extract_msg_attachments(msg_file: str, output_dir: str):
    try:
        os.makedirs(output_dir, exist_ok=True)

        msg = extract_msg.Message(msg_file)

        for attachment in msg.attachments:
            filename = (
                attachment.longFilename
                if attachment.longFilename
                else attachment.shortFilename
            )
            if filename:
                ext = os.path.splitext(filename)[1].lower()
                if ext in ALLOWED_EXTENSIONS:
                    attachment_path = os.path.join(output_dir, filename)
                    with open(attachment_path, "wb") as fp:
                        fp.write(attachment.data)
                    logging.info(f"Attachment {filename} saved at {attachment_path}")
                else:
                    logging.info(
                        f"Skipped attachment {filename} (unsupported file type)"
                    )
    except Exception as e:
        raise e


async def mail_content_extraction(file_path: str):
    """
    Processes a file (.msg or .eml) and extracts attachments, if any.
    """
    output_dir = os.path.join(os.path.dirname(file_path), "attachments")

    try:
        if file_path.endswith(".msg"):
            logging.info(f"Processing .msg file: {file_path}")
            await extract_msg_attachments(
                file_path,
                output_dir,
            )
        elif file_path.endswith(".eml"):
            logging.info(f"Processing .eml file: {file_path}")
            await extract_eml_attachments(
                file_path,
                output_dir,
            )
        logging.info(f"Finished processing file: {file_path}")
        return True
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {str(e)}")
        return False



import os
import shutil
import logging
from typing import List
from fastapi import UploadFile
from fastapi.responses import JSONResponse

# from ingestion.ingest_files import ingest_files
from utils.mailContentExtraction_utils import mail_content_extraction

UPLOAD_DIR = os.path.join("uploads")

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


async def process_file(file_path: str) -> bool:
    """
    Processes the uploaded file using the pre-processing function.
    """
    try:
        return await mail_content_extraction(file_path)
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        return False


# Core functionalities
async def upload_file(file_path: str, file_name: str):
    """
    Uploads a single file for the given user and processes it.
    """
    try:
        processing_status = await process_file(file_path)

        # ingestion_status, ingestion_error = await ingest_files(file_path)

        # if not ingestion_status:
        #     raise ingestion_error

        logging.info(f"File {os.path.basename(file_path)} ingested succesfully.")

    except Exception as e:
        logging.error(f"Error occurred while processing file: {str(e)}")



import os
from typing import List
from controller import file_controller
from fastapi.responses import JSONResponse
from auth.utils.jwt_utils import TokenData, authenticate_jwt
from fastapi import APIRouter, UploadFile, BackgroundTasks, File, Depends, Body

router = APIRouter()


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
    user_dir = file_controller.create_user_directory(userEmailId)
    file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
    os.makedirs(file_folder, exist_ok=True)

    file_path = file_controller.save_uploaded_file(file, file_folder)

    background_tasks.add_task(file_controller.upload_file, file_path)
    # return await file_controller.upload_file(userEmailId, file)
    return JSONResponse({"message": "File upload started."})

