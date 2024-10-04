import os
import shutil
import logging
from typing import List
from bson import ObjectId
from utils.db_utils import delete_files
from fastapi.responses import JSONResponse
from ingestion.ingest_files import ingest_files
from fastapi import BackgroundTasks, UploadFile
from motor.motor_asyncio import AsyncIOMotorCollection
from utils.chromadb_utils import initialize_chroma_client
from utils.progess_utils import create_progess, update_progess
from utils.mailContentExtraction_utils import mail_content_extraction

UPLOAD_DIR = os.path.join("uploads")
CHROMA_CLIENT = initialize_chroma_client()

collection_normal = CHROMA_CLIENT.get_or_create_collection(name="EmailAssistant")
collection_summary = CHROMA_CLIENT.get_or_create_collection(
    name="EmailAssistant_Summary"
)

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


def process_file(file_path: str) -> bool:
    """
    Processes the uploaded file using the pre-processing function.
    """
    try:
        return mail_content_extraction(file_path)
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        return False, e


def delete_from_collection(id):
    try:
        collection_normal.delete(where={"id": id})
        collection_summary.delete(where={"id": id})
        return True, None
    except Exception as e:
        logging.error(f"An error occurred while deleting from chromaDB: {e}")
        return False, e


# Core functionalities
async def get_file_status(
    userEmailId: str, filename: str, id: str, collection_file: AsyncIOMotorCollection
):
    try:
        file = await collection_file.find_one(
            {"userEmailId": userEmailId, "_id": ObjectId(id)}
        )

        if not file:
            logging.warning(f"File do not exist {filename}")
            return custom_error_response(f"File do not exist {filename}", 400)

        file_status = {
            "userEmailId": file["userEmailId"],
            "filename": file["filename"],
            "status": file["status"],
            "size": file["size"],
        }

        return {"file_status": file_status}

    except Exception as e:
        logging.error(f"An error occurred while getting status of {filename}")
        return custom_error_response(
            f"An error occurred while getting status of {filename}", 400
        )


async def process_file_async(
    userEmailId: str, file_path: str, filename: str, filesize: int
):
    try:
        processing_status, processing_status_error = process_file(file_path)
        if not processing_status:
            raise processing_status_error

        create_progress_id, create_progress_error = await create_progess(
            userEmailId, filename, "Upload Successful", filesize
        )
        if not create_progress_id:
            raise create_progress_error

        ingestion_status, ingestion_error = await ingest_files(
            file_path, create_progress_id
        )
        if not ingestion_status:
            raise ingestion_error

        update_progess_status, update_progess_error = await update_progess(
            userEmailId, filename, "Ingestion Successful", create_progress_id
        )
        if not update_progess_status:
            raise update_progess_error

    except Exception as e:
        delete_from_collection(filename)
        await update_progess(userEmailId, filename, "Processing Failed")
        logging.error(f"Error occurred while processing file: {str(e)}")


async def get_all_file_status(
    userEmailId: str, collection_file: AsyncIOMotorCollection
):
    try:
        user = collection_file.find({"userEmailId": userEmailId})

        if not user:
            logging.warning(f"User do not exist {userEmailId}")
            return custom_error_response(f"User do not exist {userEmailId}", 400)

        user_files = await user.to_list(length=None)

        files_list = [
            {
                "id": str(user_file["_id"]),
                "filename": user_file["filename"],
                "status": user_file["status"],
            }
            for user_file in user_files
        ]

        return {"files": files_list}

    except Exception as e:
        logging.error(
            f"An error occurred while getting status of file for {userEmailId}: {e}"
        )
        return custom_error_response(
            f"An error occurred while getting status of file for {userEmailId}", 400
        )


async def upload_file(
    userEmailId: str,
    file: UploadFile,
    background_tasks: BackgroundTasks,
):
    """
    Uploads a single file for the given user and processes it.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])

        if os.path.exists(file_folder):
            return {
                "filename": file.filename,
                "message": "File already exists. Please rename the file and try again.",
                "status": False,
            }

        os.makedirs(file_folder, exist_ok=True)

        file_path = save_uploaded_file(file, file_folder)

        filesize = os.path.getsize(file_path)

        background_tasks.add_task(
            process_file_async, userEmailId, file_path, file.filename, filesize
        )

        return {
            "filename": file.filename,
            "message": "File uploaded successfully. Processing started.",
            "status": True,
        }

    except Exception as e:
        logging.error(f"Error occurred while processing file: {str(e)}")
        return custom_error_response(f"Failed to process file {file.filename}", 500)


async def upload_files(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    """
    Uploads and processes multiple files for the given user.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        filenames = []
        existing_files = []

        for file in files:
            file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])

            if os.path.exists(file_folder):
                existing_files.append(file.filename)
                continue

            os.makedirs(file_folder, exist_ok=True)
            file_path = save_uploaded_file(file, file_folder)
            filenames.append(file.filename)

            filesize = os.path.getsize(file_path)

            background_tasks.add_task(
                process_file_async, userEmailId, file_path, file.filename, filesize
            )

        if existing_files:
            return {
                "status": False,
                "message": "Some files already exist. Please rename them and try again.",
                "existing_files": existing_files,
                "uploaded_files": filenames,
            }
        if filenames:
            return {
                "status": True,
                "message": f"All {len(filenames)} files uploaded successfully.",
                "uploaded_files": filenames,
            }
        else:
            return {
                "status": False,
                "message": "No files were uploaded. All files already exist.",
            }

    except Exception as e:
        logging.error(f"Error uploading files for user {userEmailId}: {e}")
        return custom_error_response("Failed to upload files.", 500)


async def upload_folder(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    """
    Uploads multiple files with folder structure and processes them.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        filenames = []
        existing_files = []

        for file in files:
            file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])

            if os.path.exists(file_folder):
                existing_files.append(file.filename)
                continue

            os.makedirs(file_folder, exist_ok=True)
            file_path = save_uploaded_file(file, file_folder)
            filenames.append(file.filename)

            filesize = os.path.getsize(file_path)

            background_tasks.add_task(
                process_file_async, userEmailId, file_path, file.filename, filesize
            )

        if existing_files:
            return {
                "status": False,
                "message": "Some files already exist. Please rename them and try again.",
                "existing_files": existing_files,
                "uploaded_files": filenames,
            }
        if filenames:
            return {
                "status": True,
                "message": f"All {len(filenames)} files uploaded successfully.",
                "uploaded_files": filenames,
            }
        else:
            return {
                "status": False,
                "message": "No files were uploaded. All files already exist.",
            }

    except Exception as e:
        logging.error(f"Error uploading folder for user {userEmailId}: {e}")
        return custom_error_response("Failed to upload folder.", 500)


async def delete_file(userEmailId: str, files: List[str], ids: List[str]):
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

        delete_file_status, delete_file_error = await delete_files(ids)

        if not delete_file_status:
            raise delete_file_error

        for file, id in zip(files, ids):
            delete_from_chroma, delete_from_chroma_error = delete_from_collection(id)
            if not delete_from_chroma:
                raise delete_from_chroma_error

            folder_path = os.path.join(user_upload_paths, os.path.splitext(file)[0])

            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                shutil.rmtree(folder_path)
                logging.info(f"Deleted mail: {file}")
            else:
                logging.warning(f"Mail not found {file}")

        return {"message": "Mail deleted successfully"}
    except Exception as e:
        logging.error(
            f"Error occurred while deleting mail for user {userEmailId}: {str(e)}"
        )
        return custom_error_response(
            "Failed to delete mail. Please try again later", 500
        )


# async def upload_file(
#     userEmailId: str,
#     file: UploadFile,
# ):
#     """
#     Uploads a single file for the given user and processes it.
#     """
#     try:
#         user_dir = create_user_directory(userEmailId)
#         file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
#         os.makedirs(file_folder, exist_ok=True)

#         file_path = save_uploaded_file(file, file_folder)

#         processing_status, processing_status_error = process_file(file_path)

#         if not processing_status:
#             raise processing_status_error

#         create_progress_status, create_progress_error = await create_progess(
#             userEmailId, file.filename, "Upload Successful"
#         )

#         if not create_progress_status:
#             raise create_progress_error

#         ingestion_status, ingestion_error = await ingest_files(file_path)

#         if not ingestion_status:
#             raise ingestion_error

#         update_progess_status, update_progess_error = await update_progess(
#             userEmailId, file.filename, "Ingestion Successful"
#         )

#         if not update_progess_status:
#             raise update_progess_error

#         message = (
#             "File uploaded and processed successfully."
#             if update_progess_status
#             else "File uploaded, but an error occurred during processing."
#         )
#         return {
#             "filename": file.filename,
#             "message": message,
#             "status": processing_status,
#         }

#     except Exception as e:
#         delete_from_collection(file.filename)
#         await update_progess(userEmailId, file.filename, "Processing Failed")
#         logging.error(f"Error occurred while processing file: {str(e)}")
#         return custom_error_response(f"Failed to process file {file.filename}", 500)
