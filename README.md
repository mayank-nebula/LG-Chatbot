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
    """
    pattern = r"([\w\s]+)\s*<([^>]+)>"
    matches = re.findall(pattern, email_field)
    names = [match[0].strip() for match in matches]
    emails = [match[1].strip() for match in matches]
    return names, emails


async def extract_metadata(
    metadata: dict, file_path: str, metadata_extraction_prompt: str
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

        metadata.update(result)

        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt
        agentic_metadata = chain.invoke(metadata_extract_msg.body)

        agentic_metadata_json = json.loads(agentic_metadata.content)
        metadata.update(agentic_metadata_json)

        return metadata, None

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
                handle_ingestion_failure(
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
                handle_ingestion_failure(
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
    file_name = os.path.basename(file_path)
    failed_files = []

    try:
        prompts = load_prompts()

        loader = UnstructuredEmailLoader(file_path, mode="elements")
        data = loader.load()
        metadata = data[0].metadata

        if file_name.endswith(".msg"):
            metadata_success, metadata_error = await extract_metadata(
                metadata,
                file_path,
                prompts["metadata_extraction"],
            )
            if not metadata_success:
                raise metadata_error

        chroma_format_metadata, chroma_format_metadata_error = (
            convert_metadata_to_chroma_format(metadata)
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
