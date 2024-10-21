file_controller - 

import os
import shutil
import asyncio
from typing import List
from pathlib import Path
from bson import ObjectId
from datetime import datetime
from logs.logger_config import get_logger
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import BackgroundTasks, UploadFile
from ingestion.ingest_files import ingest_files
from concurrent.futures import ThreadPoolExecutor
from controller.websocket_controller import manager
from motor.motor_asyncio import AsyncIOMotorCollection
from utils.mail_utils import mail_content_extraction
from utils.chromadb_utils import initialize_chroma_client
from utils.progress_utils import create_progess, update_progess
from utils.encryption_utils import decrypt_data, deterministic_decrypt, encrypt_file
from utils.db_utils import (
    delete_files,
    delete_from_structured_collection,
    extract_file_details,
    get_metadata_collection,
)

logger = get_logger(__name__)
UPLOAD_DIR = os.path.join("uploads")
CHROMA_CLIENT = initialize_chroma_client()
executor = ThreadPoolExecutor(max_workers=64)

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def custom_error_response(detail: dict, status_code: int = 400):
    return JSONResponse(status_code=status_code, content=detail)


def create_user_directory(userEmailId: str) -> str:
    user_dir = os.path.join(UPLOAD_DIR, userEmailId)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    return user_dir


def process_file(file_path: str) -> bool:
    try:
        return mail_content_extraction(file_path)
    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        raise e


def delete_from_collection(id: str, userEmailId: str):
    try:
        collection_normal = CHROMA_CLIENT.get_or_create_collection(
            name=f"EmailAssistant_{userEmailId.split('@')[0]}"
        )
        collection_summary = CHROMA_CLIENT.get_or_create_collection(
            name=f"EmailAssistant_Summary_{userEmailId.split('@')[0]}"
        )
        collection_normal.delete(where={"id": id})
        collection_summary.delete(where={"id": id})
    except Exception as e:
        logger.error(f"An error occurred while deleting from chromaDB: {str(e)}")
        raise e


def object_id_str(data):
    if isinstance(data, list):
        for item in data:
            item["_id"] = str(item["_id"])
    elif isinstance(data, dict):
        data["_id"] = str(data["_id"])
    return data


async def save_uploaded_file(
    file: UploadFile,
    folder_path: str,
    folder: bool,
    userEmailId: str,
    current_time: datetime,
    folder_name: str = ".",
):
    try:
        if not folder:
            file_path = os.path.join(folder_path, file.filename)
        else:
            file_path = os.path.join(folder_path, Path(file.filename).name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        filesize = os.path.getsize(file_path)

        encrypt_file(file_path, "Hello")

        created_id = await create_progess(
            userEmailId,
            file.filename,
            "Upload Successful",
            filesize,
            current_time,
            folder_name,
        )
        return file_path, created_id, filesize
    except Exception as e:
        raise e


async def process_file_async(
    userEmailId: str,
    file_path: str,
    filename: str,
    folder_path: str,
    create_progress_id: str,
):
    try:
        process_file(file_path)
        await update_progess(
            userEmailId,
            "Attachment(s) Extracted Successful",
            create_progress_id,
        )
        await manager.send_message(
            {
                "filename": filename,
                "process": "Attachment(s) Extracted Successful",
                "reason": "Attachment(s) Extracted Successful",
            },
            userEmailId,
        )

        await ingest_files(file_path, create_progress_id, userEmailId)
        await update_progess(userEmailId, "Ingestion Successful", create_progress_id)
        await manager.send_message(
            {
                "filename": filename,
                "process": "Ingestion Successful",
                "reason": "Ingestion Successful",
            },
            userEmailId,
        )

    except Exception as e:
        shutil.rmtree(folder_path)
        delete_from_collection(create_progress_id)
        await delete_from_structured_collection([create_progress_id], userEmailId)
        await update_progess(userEmailId, "Processing Failed", create_progress_id)
        await manager.send_message(
            {
                "filename": filename,
                "process": "Processing Failed",
                "reason": "Processing Failed",
            },
            userEmailId,
        )
        logger.error(
            f"Error occurred while processing file for {userEmailId}: {str(e)}"
        )


async def get_file_status(
    userEmailId: str, filename: str, id: str, collection_file: AsyncIOMotorCollection
):
    try:
        file = await collection_file.find_one(
            {"userEmailId": userEmailId, "_id": ObjectId(id)}
        )

        if not file:
            logger.error(f"File {filename} not found for {userEmailId}")
            return custom_error_response(
                {
                    "message": "Fetching file status failed",
                    "reason": "File not found",
                },
                404,
            )

        file_status = {
            "userEmailId": file["userEmailId"],
            "filename": deterministic_decrypt(file["filename"], "Hello"),
            "status": decrypt_data(file["status"], "Hello"),
            "size": file["size"],
            "createdAt": str(file["createdAt"]),
        }

        return JSONResponse(content={"file_status": file_status}, status_code=200)

    except Exception as e:
        logger.error(
            f"An error occurred while fetching status of {filename} for {userEmailId}"
        )
        return custom_error_response(
            {"message": "Fetching file status failed", "reason": str(e)}, 500
        )


async def get_all_file_status(
    userEmailId: str, collection_file: AsyncIOMotorCollection
):
    try:
        user = collection_file.find({"userEmailId": userEmailId})

        if not user:
            logger.error(f"User not found {userEmailId}")
            return custom_error_response(
                {
                    "message": "Fetching file(s) status failed",
                    "reason": "User not found",
                },
                404,
            )

        user_files = await user.to_list(length=None)

        files_list = [
            {
                "id": str(user_file["_id"]),
                "filename": deterministic_decrypt(user_file["filename"], "Hello"),
                "status": decrypt_data(user_file["status"], "Hello"),
                "folder": decrypt_data(user_file["folder"], "Hello"),
                "createdAt": str(user_file["createdAt"]),
            }
            for user_file in user_files
        ]

        return JSONResponse({"files": files_list}, status_code=200)

    except Exception as e:
        logger.error(
            f"An error occurred while fetching status of file(s) for {userEmailId}: {e}"
        )
        return custom_error_response(
            {"message": "Fetching file(s) status failed", "reason": str(e)}, 500
        )


async def get_documents(userEmailId: str):
    try:
        collection_metadata = get_metadata_collection(userEmailId)
        documents = await collection_metadata.find(
            {"userEmailId": userEmailId}
        ).to_list()

        documents = object_id_str(documents)
        json_documents = jsonable_encoder(documents)

        return JSONResponse(
            content={"emails": json_documents if json_documents else []},
            status_code=200,
        )
    except Exception as e:
        logger.error(
            f"An error occurred while fetching document(s) for {userEmailId}: {e}"
        )
        return custom_error_response(
            {"message": "Fetching document(s) info failed", "reason": str(e)}, 500
        )


# async def handle_file_upload(file: UploadFile, userEmailId: str, user_dir: str):
#     filenames = []
#     failed_files = []
#     created_id = None

#     current_time = datetime.utcnow()
#     formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
#     file_folder = os.path.join(
#         user_dir, f"{os.path.splitext(file.filename)[0]}_{formatted_time}"
#     )

#     os.makedirs(file_folder, exist_ok=True)

#     try:
#         file_path, created_id, filesize = await save_uploaded_file(
#             file, file_folder, False, userEmailId, current_time
#         )
#         filenames.append({"filename": file.filename, "size": filesize})

#         await manager.send_message(
#             {
#                 "filename": file.filename,
#                 "process": "Upload Successful",
#                 "reason": "Upload Successful",
#             },
#             userEmailId,
#         )

#         loop = asyncio.get_event_loop()
#         loop.run_in_executor(
#             executor,
#             process_file_async,
#             userEmailId,
#             file_path,
#             file.filename,
#             file_folder,
#             created_id,
#         )

#     except Exception as e:
#         if created_id:
#             await update_progess(userEmailId, "Processing Failed", created_id)
#         else:
#             await create_progess(
#                 userEmailId,
#                 file.filename,
#                 "Processing Failed",
#                 0,
#                 current_time,
#                 ".",
#             )
#         await manager.send_message(
#             {
#                 "filename": file.filename,
#                 "process": "Processing Failed",
#                 "reason": str(e),
#             },
#             userEmailId,
#         )
#         shutil.rmtree(file_folder)
#         failed_files.append(f"{file.filename}: {str(e)}")

#     return filenames, failed_files


# async def upload_files(
#     userEmailId: str,
#     files: List[UploadFile],
# ):
#     user_dir = create_user_directory(userEmailId)
#     tasks = [handle_file_upload(file, userEmailId, user_dir) for file in files]

#     results = await asyncio.gather(*tasks)
#     filenames = [r[0] for r in results if r[0]]
#     failed_files = [r[1] for r in results if r[1]]

#     if filenames:
#         status = True
#         if failed_files:
#             message = f"Uploaded {len(filenames)} file(s), {len(failed_files)} file(s) failed."
#         else:
#             message = f"Successfully uploaded {len(filenames)} file(s)."
#     else:
#         status = False
#         message = f"Upload Failed: {len(filenames)} file(s) failed to upload."

#     return JSONResponse(
#         {
#             "status": status,
#             "message": message,
#             "uploaded_files": filenames,
#             "failed_files": failed_files,
#         },
#         status_code=200,
#     )


async def upload_files(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    failed_files = []

    for file in files:
        if not file.filename:
            failed_files.append("Unnamed file")
            continue

        try:
            created_id = None
            current_time = datetime.utcnow()
            formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
            file_folder = os.path.join(
                user_dir, f"{os.path.splitext(file.filename)[0]}_{formatted_time}"
            )

            os.makedirs(file_folder, exist_ok=True)
            file_path, created_id, filesize = await save_uploaded_file(
                file, file_folder, False, userEmailId, current_time
            )
            filenames.append({"filename": file.filename, "size": filesize})

            await manager.send_message(
                {
                    "filename": file.filename,
                    "process": "Upload Successful",
                    "reason": "Upload Successful",
                },
                userEmailId,
            )

            background_tasks.add_task(
                process_file_async,
                userEmailId,
                file_path,
                file.filename,
                file_folder,
                created_id,
            )
        except Exception as e:
            if created_id:
                await update_progess(userEmailId, "Processing Failed", created_id)
            else:
                await create_progess(
                    userEmailId,
                    file.filename,
                    "Processing Failed",
                    0,
                    current_time,
                    ".",
                )
            await manager.send_message(
                {
                    "filename": file.filename,
                    "process": "Processing Failed",
                    "reason": str(e),
                },
                userEmailId,
            )
            shutil.rmtree(file_folder)
            failed_files.append(f"{file.filename}: {str(e)}")

    if filenames:
        status = True
        if failed_files:
            message = f"Uploaded {len(filenames)} file(s), {len(failed_files)} file(s) failed."
        else:
            message = f"Successfully uploaded {len(filenames)} file(s)."
    else:
        status = False
        message = f"Upload Failed: {len(filenames)} file(s) failed to upload."

    return JSONResponse(
        {
            "status": status,
            "message": message,
            "uploaded_files": filenames,
            "failed_files": failed_files,
        },
        status_code=200,
    )


async def upload_folder(
    userEmailId: str, files: List[UploadFile], background_tasks: BackgroundTasks
):
    user_dir = create_user_directory(userEmailId)
    filenames = []
    failed_files = []

    for file in files:
        if not Path(file.filename).name:
            failed_files.append("Unnamed file")
            continue
        try:
            created_id = None
            folder_name = Path(file.filename).parent
            current_time = datetime.utcnow()
            formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
            file_folder = os.path.join(
                user_dir,
                folder_name,
                f"{os.path.splitext(Path(file.filename).name)[0]}_{formatted_time}",
            )

            os.makedirs(file_folder, exist_ok=True)
            file_path, created_id, filesize = await save_uploaded_file(
                file, file_folder, True, userEmailId, current_time, str(folder_name)
            )
            filenames.append({"filename": Path(file.filename).name, "size": filesize})

            await manager.send_message(
                {
                    "filename": str(Path(file.filename).name),
                    "process": "Upload Successful",
                    "reason": "Upload Successful",
                },
                userEmailId,
            )

            background_tasks.add_task(
                process_file_async,
                userEmailId,
                file_path,
                str(Path(file.filename).name),
                file_folder,
                created_id,
            )
        except Exception as e:
            if created_id:
                await update_progess(
                    userEmailId,
                    "Processing Failed",
                    created_id,
                )
            else:
                await create_progess(
                    userEmailId,
                    str(Path(file.filename).name),
                    "Processing Failed",
                    0,
                    current_time,
                    str(folder_name),
                )
            await manager.send_message(
                {
                    "filename": str(Path(file.filename).name),
                    "process": "Processing Failed",
                    "reason": str(e),
                },
                userEmailId,
            )
            shutil.rmtree(file_folder)
            failed_files.append(f"{Path(file.filename).name}: {str(e)}")

    if filenames:
        status = True
        if failed_files:
            message = f"Uploaded {len(filenames)} file(s), {len(failed_files)} file(s) failed."
        else:
            message = f"Successfully uploaded {len(filenames)} file(s)."
    else:
        status = False
        message = f"Upload Failed: {len(filenames)} file(s) failed to upload."

    return JSONResponse(
        content={
            "status": status,
            "message": message,
            "uploaded_files": filenames,
            "failed_files": failed_files,
        },
        status_code=200,
    )


async def delete_file(userEmailId: str, ids: List[str]):
    try:
        user_upload_paths = os.path.join(UPLOAD_DIR, userEmailId)

        if not os.path.exists(user_upload_paths):
            logger.error(f"User directory for user {userEmailId} not found")
            return custom_error_response(
                {
                    "message": "Deleting user file(s) failed",
                    "reason": "User directory not found",
                },
                404,
            )
        combined_results = await extract_file_details(ids, userEmailId)

        await delete_files(ids, userEmailId)

        await delete_from_structured_collection(ids, userEmailId)

        for file, id in zip(combined_results, ids):
            delete_from_collection(id, userEmailId)

            folder_path = os.path.join(user_upload_paths, file)

            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                shutil.rmtree(folder_path)
            else:
                logger.error(f"Mail not found {file}")

        return JSONResponse(
            content={"message": "Mail deleted successfully"}, status_code=200
        )
    except Exception as e:
        logger.error(
            f"Error occurred while deleting mail for user {userEmailId}: {str(e)}"
        )
        return custom_error_response(
            {"message": "Deleting file(s) failed", "reason": str(e)}, 500
        )
 


ingest files -

import io
import re
import os
import json
import shutil
import tempfile
import subprocess
import pdfplumber
import mailparser
import extract_msg
from dotenv import load_dotenv
from logs.logger_config import get_logger
from langchain_openai import AzureChatOpenAI
from utils.db_utils import insert_metadata
from ingestion.ppt_ingestion import ppt_ingestion
from ingestion.pdf_ingestion import pdf_ingestion
from langchain_core.prompts import ChatPromptTemplate
from ingestion.email_ingestion import email_ingestion
from utils.encryption_utils import decrypt_file_in_memory

load_dotenv()
OUTPUT_PATHS = ["output"]
CONVERSION_TIMEOUT = 180
PROMPTS_JSON_FILE = "json/prompts.json"
logger = get_logger(__name__)


llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)


def convert_metadata_to_chroma_format(metadata: dict):
    try:
        new_metadata = {}
        for key, value in metadata.items():
            if isinstance(value, list) or isinstance(value, dict):
                new_metadata[key] = json.dumps(value)
            elif value is None:
                new_metadata[key] = "null"
            else:
                new_metadata[key] = value

        return new_metadata
    except Exception as e:
        logger.error(f"Failed to create metadata: {str(e)}")
        raise e


def load_prompts():
    with open(PROMPTS_JSON_FILE, "r") as file:
        return json.load(file)


def extract_email_details_msg(email_field: str):
    entries = email_field.split(";")

    names = []
    emails = []

    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue

        pattern = r"([^<>@\t]+)?[\t ]*<?([^<>\s@]+@[^<>\s@]+)>?"
        match = re.search(pattern, entry)

        if match:
            name, email = match.groups()
            if name and name.strip():
                names.append(name.strip())
            if email:
                emails.append(email.strip())
        else:
            names.append(entry.strip())

    return names, emails


def extract_email_details_eml(parsed_mail: mailparser, details: list):
    details_map = {
        "to": parsed_mail.to,
        "from": parsed_mail.from_,
        "bcc": parsed_mail.bcc,
        "cc": parsed_mail.cc,
    }

    field_data = details_map.get(details, [])

    if field_data:
        names = [name for name, _ in field_data]
        emails = [email for _, email in field_data]
    else:
        names, emails = [], []

    return names, emails


def extract_metadata(
    file_path: str,
    metadata_extraction_prompt: str,
):
    try:
        result = {
            "sent_to_name": [],
            "sent_to_email": [],
            "sent_from_name": [],
            "sent_from_email": [],
            "sent_cc_name": [],
            "sent_cc_email": [],
            "sent_bcc_name": [],
            "sent_bcc_email": [],
        }

        if os.path.splitext(file_path)[1] == ".msg":
            decrypted_msg = decrypt_file_in_memory(file_path, "Hello")
            metadata_extract_msg = extract_msg.Message(decrypted_msg)
            metadata_json = json.loads(metadata_extract_msg.getJson())

            for field in ["to", "from", "cc", "bcc"]:
                if metadata_json.get(field):
                    result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                        extract_email_details_msg(metadata_json[field])
                    )

            result.update(
                {
                    "subject": metadata_extract_msg.subject,
                    "date": str(metadata_extract_msg.date),
                    "filename": os.path.basename(file_path),
                }
            )
        else:
            decrypted_msg = decrypt_file_in_memory(file_path, "Hello")
            parsed_mail = mailparser.parse_from_file(decrypted_msg)
            for field in ["to", "from", "cc", "bcc"]:
                result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                    extract_email_details_eml(parsed_mail, field)
                )

            result.update(
                {
                    "subject": parsed_mail.subject,
                    "date": str(parsed_mail.date),
                    "filename": os.path.basename(file_path),
                }
            )

        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt

        if os.path.splitext(file_path)[1] == ".msg":
            agentic_metadata = chain.invoke(metadata_extract_msg.body)
        else:
            agentic_metadata = chain.invoke(parsed_mail.text_plain[0])

        agentic_metadata_json = json.loads(agentic_metadata.content)
        result.update(agentic_metadata_json)

        return result
    except Exception as e:
        logger.error(f"Error extracting metadata from {file_path}: {str(e)}")
        raise e


def is_pdf(file_path: str, file: str):
    try:
        decrypted_file = decrypt_file_in_memory(os.path.join(file_path, file), "Hello")
        pdf_stream = io.BytesIO(decrypted_file)

        with pdfplumber.open(pdf_stream) as pdf:
            page_layouts = set((page.width, page.height) for page in pdf.pages)
            aspect_ratios = [width / height for width, height in page_layouts]

            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = len(aspect_ratios) - landscape_pages

            if len(set(page_layouts)) == 1 and aspect_ratios[0] > 1:
                logger.info(f"{file} is likely a PPT converted to PDF.")
                return False, None
            elif portrait_pages == len(aspect_ratios):
                logger.info(f"{file} is likely an original PDF.")
                return True, decrypted_file
            elif landscape_pages == len(aspect_ratios):
                logger.info(f"{file} is likely a PPT converted to PDF.")
                return False, None
            else:
                landscape_ratio = landscape_pages / portrait_pages
                if landscape_ratio > 0.7:
                    logger.info(f"{file} is likely a PPT converted to PDF.")
                    return False, None
                else:
                    logger.info(f"{file} is likely an original PDF.")
                    return True, decrypted_file

    except Exception as e:
        logger.error(f"Error analyzing PDF: {str(e)}")
        return False, None


def convert_file_to_pdf(fpath: str, fname: str, ext: str):
    try:
        decrypted_file = decrypt_file_in_memory(os.path.join(fpath, fname), "Hello")
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)

        with open(temp_file.name, "wb") as f:
            f.write(decrypted_file)
        pdf_fname = os.path.splitext(fname)[0] + ".pdf"
        pdf_file = os.path.join(fpath, pdf_fname)

        subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                fpath,
                temp_file.name,
            ],
            timeout=120,
        )

        basename = os.path.basename(os.path.splitext(temp_file.name)[0])
        shutil.move(os.path.join(fpath, basename + ".pdf"), pdf_file)
        temp_file.close()

        if os.path.exists(pdf_file):
            logger.info(f"PDF file created: {pdf_file}")
            return True
        else:
            logger.error("PDF file was not created.")
            return False
    except subprocess.TimeoutExpired:
        logger.error(f"Conversion of {fname} timed out.")
        return False
    except Exception as e:
        logger.error(f"An error occurred during conversion: {str(e)}")
        return False


def process_doc(
    file: str,
    file_path: str,
    metadata: dict,
    failed_files: list,
    id: str,
    userEmailId: str,
):
    pdf_name = os.path.splitext(file)[0] + ".pdf"
    try:
        if convert_file_to_pdf(file_path, file, os.path.splitext(file)[1]):
            success, error = pdf_ingestion(
                file_path, pdf_name, metadata, id, userEmailId, None
            )
            if success:
                os.remove(os.path.join(file_path, pdf_name))
                logger.info(f"{file} processed succesfully.")
            else:
                raise error
        else:
            raise Exception(f"Failed to convert {file} to PDF")
    except Exception as e:
        failed_files.append(file)
        raise e


def process_ppt(
    file: str,
    file_path: str,
    metadata: dict,
    failed_files: list,
    id: str,
    userEmailId: str,
):
    pdf_name = os.path.splitext(file)[0] + ".pdf"
    try:
        if convert_file_to_pdf(file_path, file, os.path.splitext(file)[1]):
            success, error = ppt_ingestion(
                file_path, pdf_name, metadata, id, userEmailId, None
            )
            if success:
                os.remove(os.path.join(file_path, pdf_name))
                logger.info(f"{file} processed succesfully.")
            else:
                raise error
        else:
            raise Exception(f"Failed to convert {file} to PDF")
    except Exception as e:
        failed_files.append(file)
        raise e


def process_pdf(
    file: str,
    file_path: str,
    metadata: dict,
    failed_files: list,
    id: str,
    userEmailId: str,
):
    try:
        result, decrypted_file = is_pdf(file_path, file)
        if result:
            success, error = pdf_ingestion(
                file_path, file, metadata, id, userEmailId, decrypted_file
            )
        else:
            success, error = ppt_ingestion(
                file_path, file, metadata, id, userEmailId, decrypted_file
            )

        if not success:
            raise error

    except Exception as e:
        failed_files.append(file)
        raise e


def process_attachment(
    file: str,
    file_path: str,
    metadata: dict,
    failed_files: list,
    id: str,
    userEmailId: str,
):
    try:
        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        lower_case_file = base_name + lower_ext
        original_file_path = os.path.join(file_path, file)
        lower_case_path = os.path.join(file_path, lower_case_file)

        if ext.isupper():
            os.rename(original_file_path, lower_case_path)

        if lower_case_file.endswith(".pdf"):
            process_pdf(
                lower_case_file, file_path, metadata, failed_files, id, userEmailId
            )
        elif lower_case_file.endswith((".ppt", ".pptx")):
            process_ppt(
                lower_case_file, file_path, metadata, failed_files, id, userEmailId
            )
        elif lower_case_file.endswith((".doc", ".docx")):
            process_doc(
                lower_case_file, file_path, metadata, failed_files, id, userEmailId
            )

    except Exception as e:
        logger.error(f"Error ingesting file {file}: {str(e)}")
        raise e


async def ingest_files(file_path: str, created_id: str, userEmailId: str):
    try:
        file_name = os.path.basename(file_path)
        failed_files = []
        prompts = load_prompts()

        metadata_success = extract_metadata(file_path, prompts["metadata_extraction"])

        chroma_format_metadata = convert_metadata_to_chroma_format(metadata_success)

        email_ingestion(file_path, chroma_format_metadata, created_id, userEmailId)

        await insert_metadata(metadata_success, created_id, userEmailId)

        output_dir = os.path.join(os.path.dirname(file_path), "attachments")
        if not os.path.exists(output_dir):
            logger.error(f"Output directory {output_dir} does not exist.")
            raise Exception(f"Output directory {output_dir} does not exist.")

        attachment_files = os.listdir(output_dir)
        for file in attachment_files:
            process_attachment(
                file,
                output_dir,
                chroma_format_metadata,
                failed_files,
                created_id,
                userEmailId,
            )
            if failed_files:
                logger.error(f"Failed to ingest file {file}")
                raise Exception(f"Failed to ingest file {file}")

        logger.info(f"File {file_name} processed successfully.")
    except Exception as e:
        logger.error(f"Failed to ingest file {file_name}: {str(e)}")
        raise e
