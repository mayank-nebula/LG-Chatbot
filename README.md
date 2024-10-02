router.py
@router.post("/upload-file")
async def upload_single_file(
    file: UploadFile = File(...), token_data: TokenData = Depends(authenticate_jwt)
):
    """
    Route for uploading a single file.
    """
    userEmailId = token_data.email
    return await file_controller.upload_file(userEmailId, file)

controller.py
# Core functionalities
async def upload_file(userEmailId: str, file: UploadFile):
    """
    Uploads a single file for the given user and processes it.
    """
    try:
        user_dir = create_user_directory(userEmailId)
        file_folder = os.path.join(user_dir, os.path.splitext(file.filename)[0])
        os.makedirs(file_folder, exist_ok=True)

        file_path = save_uploaded_file(file, file_folder)
        processing_status = await process_file(file_path)

        ingestion_status, ingestion_error = await ingest_files(file_path)

        if not ingestion_status:
            raise ingestion_error

        message = (
            "File uploaded and processed successfully."
            if processing_status
            else "File uploaded, but an error occurred during processing."
        )
        return {
            "filename": file.filename,
            "message": message,
            "status": processing_status,
        }

    except Exception as e:
        logging.error(f"Error occurred while processing file: {str(e)}")
        return custom_error_response(f"Failed to process file {file.filename}", 500)


ingest_files.py
import re
import os
import csv
import json
import shutil
import logging
import subprocess
import pdfplumber
import extract_msg
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from ingestion.ppt_ingestion import ppt_ingestion
from ingestion.pdf_ingestion import pdf_ingestion
from langchain_core.prompts import ChatPromptTemplate
from ingestion.email_ingestion import email_ingestion
from langchain_community.document_loaders import UnstructuredEmailLoader

load_dotenv()

OUTPUT_PATHS = ["output"]
CONVERSION_TIMEOUT = 180
METADATA_CSV_FILE = "csv/metadata.csv"
PROMPTS_JSON_FILE = "json/prompts.json"

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)


def convert_metadata_to_chroma_format(metadata: dict):
    try:
        for key, value in metadata.items():
            if isinstance(value, list):
                metadata[key] = json.dumps(value)
            elif value is None:
                metadata[key] = "null"

        file_exists = os.path.exists(METADATA_CSV_FILE)

        with open(METADATA_CSV_FILE, mode="a", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=metadata.keys())

            if not file_exists:
                writer.writeheader()

            writer.writerow(metadata)

        return metadata, None
    except Exception as e:
        logging.error(f"Failed to create metadata: {e}")
        return None, e


def load_prompts():
    """
    Load prompts from a JSON file.
    """
    with open(PROMPTS_JSON_FILE, "r") as file:
        return json.load(file)


def extract_email_details(email_field: str):
    """
    Extract names and emails from a given string.

    Args:
    email_field (str): A string containing name and email information,
                       separated by semicolons.

    Returns:
    tuple: Two lists - names and emails.
    """
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


async def extract_metadata(
    file_path: str,
    metadata_extraction_prompt: str,
):
    """
    Extract structured and agentic metadata from an email.
    """
    try:
        metadata_extract_msg = extract_msg.Message(file_path)
        metadata_json = json.loads(metadata_extract_msg.getJson())

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

        for field in ["to", "from", "cc", "bcc"]:
            if metadata_json.get(field):
                result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                    extract_email_details(metadata_json[field])
                )

        result["subject"] = metadata_extract_msg.subject
        result["date"] = str(metadata_extract_msg.date)
        result["classified"] = metadata_extract_msg.classified
        result["filename"] = os.path.basename(metadata_extract_msg.filename)

        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt
        agentic_metadata = chain.invoke(metadata_extract_msg.body)

        agentic_metadata_json = json.loads(agentic_metadata.content)
        result.update(agentic_metadata_json)

        return result, None

    except Exception as e:
        logging.error(f"Error extracting metadata from {file_path}: {e}")
        return False, (e)


async def is_pdf(file_path: str, file: str):
    """
    Determine if a file is a PDF or a converted PPT based on page layouts.
    """
    try:
        with pdfplumber.open(file_path, file) as pdf:
            page_layouts = set((page.width, page.height) for page in pdf.pages)
            aspect_ratios = [width / height for width, height in page_layouts]

            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = len(aspect_ratios) - landscape_pages

            if len(set(page_layouts)) == 1 and aspect_ratios[0] > 1:
                logging.info(f"{file_path} is likely a PPT converted to PDF.")
                return False
            elif portrait_pages == len(aspect_ratios):
                logging.info(f"{file_path} is likely an original PDF.")
                return True
            elif landscape_pages == len(aspect_ratios):
                logging.info(f"{file_path} is likely a PPT converted to PDF.")
                return False
            else:
                landscape_ratio = landscape_pages / portrait_pages
                if landscape_ratio > 0.7:
                    logging.info(f"{file_path} is likely a PPT converted to PDF.")
                    return False
                else:
                    logging.info(f"{file_path} is likely an original PDF.")
                    return True

    except Exception as e:
        logging.error(f"Error analyzing PDF: {e}")
        return False


async def handle_ingestion_failure(
    file: str, error: str, failed_files: list, pdf_path: str = None
):
    """
    Handle failure during file ingestion.
    """
    logging.error(f"Ingestion failed for {file}: {error}")

    for folder in OUTPUT_PATHS:
        shutil.rmtree(folder, ignore_errors=True)

    if pdf_path and os.path.exists(pdf_path):
        os.remove(pdf_path)

    failed_files.append({"Name": file, "IngestionError": error})


async def convert_file_to_pdf(fpath, fname):
    """
    Convert a file to PDF using LibreOffice's headless mode.

    :param fpath: Path to the folder containing the file
    :param fname: Name of the file to convert
    :return: True if conversion was successful, False otherwise
    """
    try:
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
                os.path.join(fpath, fname),
            ],
            timeout=CONVERSION_TIMEOUT,
        )
        if os.path.exists(pdf_file):
            logging.info(f"PDF file created: {pdf_file}")
            return True
        else:
            logging.error("PDF file was not created.")
            return False
    except subprocess.TimeoutExpired:
        logging.error(f"Conversion of {fname} timed out.")
    except Exception as e:
        logging.error(f"An error occurred during conversion: {e}")
    return False


async def process_doc(file: str, file_path: str, metadata: dict, failed_files: list):
    """
    Process file based on PPT or PPTX type
    """
    pdf_name = os.path.splitext(file)[0] + ".pdf"
    try:
        if await convert_file_to_pdf(file_path, file):
            success, error = pdf_ingestion(file_path, pdf_name, metadata)
            if success:
                os.remove(os.path.join(file_path, pdf_name))
                logging.info(f"{file} processed succesfully.")
            else:
                await handle_ingestion_failure(
                    file, error, failed_files, os.path.join(file_path, pdf_name)
                )
        else:
            raise Exception(f"Failed to convert {file} to PDF")
    except Exception as e:
        await handle_ingestion_failure(file, str(e), failed_files)


async def process_ppt(file: str, file_path: str, metadata: dict, failed_files: list):
    """
    Process file based on PPT or PPTX type
    """
    pdf_name = os.path.splitext(file)[0] + ".pdf"
    try:
        if await convert_file_to_pdf(file_path, file):
            success, error = ppt_ingestion(file_path, pdf_name, metadata)
            if success:
                os.remove(os.path.join(file_path, pdf_name))
                logging.info(f"{file} processed succesfully.")
            else:
                await handle_ingestion_failure(
                    file, error, failed_files, os.path.join(file_path, pdf_name)
                )
        else:
            raise Exception(f"Failed to convert {file} to PDF")
    except Exception as e:
        await handle_ingestion_failure(file, str(e), failed_files)


async def process_pdf(file: str, file_path: str, metadata: dict, failed_files: list):
    """
    Process file based on PDF type
    """
    try:
        if await is_pdf(file_path, file):
            success, error = await pdf_ingestion(file_path, file, metadata)
        else:
            success, error = await ppt_ingestion(file_path, file, metadata)

        if not success:
            await handle_ingestion_failure(file, error, failed_files)

    except Exception as e:
        await handle_ingestion_failure(file, str(e), failed_files)


async def process_attachment(
    file: str, file_path: str, metadata: dict, failed_files: list
):
    """
    Process an attached file and determine how to handle it based on its type.
    """
    try:
        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        lower_case_file = base_name + lower_ext
        original_file_path = os.path.join(file_path, file)
        lower_case_path = os.path.join(file_path, lower_case_file)

        if ext.isupper():
            await os.rename(original_file_path, lower_case_path)

        if lower_case_file.endswith(".pdf"):
            await process_pdf(lower_case_file, file_path, metadata, failed_files)
        elif lower_case_file.endswith((".ppt", ".pptx")):
            await process_ppt(lower_case_file, file_path, metadata, failed_files)
        elif lower_case_file.endswith((".doc", ".docx")):
            await process_doc(lower_case_file, file_path, metadata, failed_files)

    except Exception as e:
        logging.error(f"Error renaming file {file}: {e}")
        failed_files.append({"Name": file, "IngestionError": str(e)})


async def ingest_files(file_path: str):
    """
    Ingest email files and process their attachments.
    """
    try:
        file_name = os.path.basename(file_path)
        failed_files = []
        prompts = load_prompts()

        if file_name.endswith(".msg"):
            metadata_success, metadata_error = await extract_metadata(
                file_path,
                prompts["metadata_extraction"],
            )
            if not metadata_success:
                raise metadata_error

        chroma_format_metadata, chroma_format_metadata_error = (
            convert_metadata_to_chroma_format(metadata_success)
        )

        if not chroma_format_metadata:
            raise chroma_format_metadata_error

        ingest_email_body_success, ingest_email_body_error = await email_ingestion(
            file_path, chroma_format_metadata
        )

        if not ingest_email_body_success:
            raise ingest_email_body_error

        output_dir = os.path.join(os.path.dirname(file_path), "attachments")
        if not os.path.exists(output_dir):
            logging.error(f"Output directory {output_dir} does not exist.")
            return False, f"Output directory {output_dir} does not exist."

        attachment_files = os.listdir(output_dir)
        for file in attachment_files:
            await process_attachment(
                file, output_dir, chroma_format_metadata, failed_files
            )
            if failed_files:
                logging.error(f"Failed to ingest file {file}")
                return False, f"Failed to ingest file {file}"

        logging.info(f"File {file_name} processed successfully.")
        return True, None
    except Exception as e:
        logging.error(f"Failed to ingest file {file_name}: {str(e)}")
        return False, (e)

ppt_ingestion.py
import os
import base64
import shutil
import chromadb
import concurrent.futures
from dotenv import load_dotenv
from langchain_chroma import Chroma
from chromadb.config import Settings
from pdf2image import convert_from_path
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from ingestion.create_summary import create_summary
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings


settings = Settings(anonymized_telemetry=False)

load_dotenv()

output_path = os.path.join(os.getcwd(), "output")

CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)

llm = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)


class GeneratingError(Exception):
    pass


def create_output_directory():
    """Creates the output directory if it doesn't exist."""
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    """Converts a PDF file into images for each page and saves them to the output directory."""
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))
    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")


def encode_image(image_path):
    """Encodes an image to a base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    """Summarizes the content of an image using a GPT model."""
    msg = llm.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"},
                    },
                ]
            )
        ]
    )
    return msg.content


def generate_img_summaries(path):
    """
    Generates summaries for images in a directory and returns them along with their base64 encodings.
    """
    image_summaries = {}
    img_base64_list = {}
    prompt = "Given the image of a pdf page extract all the information of the page which includes images, tables and text. Provide me a detailed summary of the enitre page."

    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=120)
                except concurrent.futures.TimeoutError:
                    return False

            image_summaries[img_name] = f"Summary : {summary}"

    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


def create_retriever(
    fname,
    vectorstore,
    vectorstore_summary,
    image_summaries,
    file_metadata,
    batch_size=75,
):
    file_metadata["Title"] = fname
    combined_summaries = image_summaries if image_summaries else {}

    doc_keys = list(combined_summaries.keys())
    total_docs = len(doc_keys)

    all_document_summaries = []

    for start_idx in range(0, total_docs, batch_size):
        end_idx = min(start_idx + batch_size, total_docs)
        batch_keys = doc_keys[start_idx:end_idx]
        batch_summaries = {key: combined_summaries[key] for key in batch_keys}

        summary = create_summary(batch_summaries)

        if summary:
            all_document_summaries.append(summary)
        else:
            raise GeneratingError("Summary Generation Failed")

    final_summary = (
        " ".join(all_document_summaries)
        if len(all_document_summaries) > 1
        else all_document_summaries[0]
    )

    def add_documents(vectorstore, doc_summaries):
        for start_idx in range(0, total_docs, batch_size):
            end_idx = min(start_idx + batch_size, total_docs)
            batch_keys = doc_keys[start_idx:end_idx]
            batch_summaries = {key: doc_summaries[key] for key in batch_keys}

            summary_docs = [
                Document(
                    page_content=s,
                    metadata=file_metadata,
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            vectorstore.add_documents(summary_docs)

    add_documents(vectorstore, combined_summaries)

    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the file {fname} attached in email {file_metadata['filename']} - {final_summary}",
            metadata=file_metadata,
        )
    ]
    vectorstore_summary.add_documents(summary_docs_summaryRetriever)


def pdf_ingestion(fpath, fname, file_metadata):
    """Ingests PDFs or PPTs by converting them to images and summarizing content."""
    try:
        pdf_to_images(fpath, fname)

        result = generate_img_summaries(output_path)

        if result is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree(output_path)

        embeddings = AzureOpenAIEmbeddings(
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING"],
        )

        vectorstore = Chroma(
            collection_name="EmailAssistant",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        vectorstore_summary = Chroma(
            collection_name="EmailAssistant_Summary",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        create_retriever(
            fname, vectorstore, vectorstore_summary, image_summaries, file_metadata
        )
        return True, None

    except Exception as e:
        shutil.rmtree(output_path, ignore_errors=True)
        return False, str(e)


