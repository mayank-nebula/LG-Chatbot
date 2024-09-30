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







import os
import logging
from pathlib import Path
from email import policy
from email.parser import BytesParser
import extract_msg

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def extract_eml_attachments(eml_file: str, output_dir: str):
    """
    Extracts attachments from an .eml file and saves them to the specified output directory.

    Args:
        eml_file (str): Path to the .eml file.
        output_dir (str): Directory where attachments will be saved.
    """
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Open and read the .eml file
        with open(eml_file, 'rb') as f:
            msg = BytesParser(policy=policy.default).parse(f)

        # Extract attachments
        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                attachment_path = os.path.join(output_dir, filename)
                with open(attachment_path, 'wb') as fp:
                    fp.write(part.get_payload(decode=True))
                logging.info(f"Attachment {filename} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to process .eml file {eml_file}: {str(e)}")


def extract_msg_attachments(msg_file: str, output_dir: str):
    """
    Extracts attachments from a .msg file and saves them to the specified output directory.

    Args:
        msg_file (str): Path to the .msg file.
        output_dir (str): Directory where attachments will be saved.
    """
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Open the .msg file
        msg = extract_msg.Message(msg_file)

        # Extract attachments
        for attachment in msg.attachments:
            filename = attachment.longFilename if attachment.longFilename else attachment.shortFilename
            if filename:
                attachment_path = os.path.join(output_dir, filename)
                with open(attachment_path, 'wb') as fp:
                    fp.write(attachment.data)
                logging.info(f"Attachment {filename} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to process .msg file {msg_file}: {str(e)}")


async def process_file(file_path: Path):
    """
    Process the file based on its type (eml or msg) and retrieve attachments.

    Args:
        file_path (Path): Path to the file to be processed.
    """
    output_dir = file_path.parent / "attachments"  # Create an attachments directory within the user's folder

    if file_path.suffix == ".msg":
        logging.info(f"Processing .msg file: {file_path}")
        extract_msg_attachments(str(file_path), str(output_dir))
    elif file_path.suffix == ".eml":
        logging.info(f"Processing .eml file: {file_path}")
        extract_eml_attachments(str(file_path), str(output_dir))
    else:
        logging.info(f"Skipping unsupported file type: {file_path}")

    logging.info(f"Finished processing file: {file_path}")
