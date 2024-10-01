import re
import os
import json
import shutil
import logging
import pdfplumber
import extract_msg
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from ingestion.ppt_ingestion import ppt_ingestion
from ingestion.pdf_ingestion import pdf_ingestion
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import UnstructuredEmailLoader

# CONVERSION_TIMEOUT = 180

load_dotenv()

OUTPUT_PATHS = ["output"]

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)


def load_prompts():
    with open("../prompts.json", "r") as file:
        return json.load(file)


def extract_email_details(email_field):
    pattern = r"([\w\s]+)\s*<([^>]+)>"
    matches = re.findall(pattern, email_field)
    names = [match[0].strip() for match in matches]
    emails = [match[1].strip() for match in matches]
    return names, emails


async def extract_metadata(
    metadata: dict, file_path: str, metadata_extraction_prompt: str, email_body: str
):
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

    if metadata_json.get("to"):
        result["sent_to_name"], result["sent_to_email"] = extract_email_details(
            metadata_json["to"]
        )

    if metadata_json.get("from"):
        result["sent_from_name"], result["sent_from_email"] = extract_email_details(
            metadata_json["from"]
        )

    if metadata_json.get("cc"):
        result["sent_cc_name"], result["sent_cc_email"] = extract_email_details(
            metadata_json["cc"]
        )

    if metadata_json.get("bcc"):
        result["sent_bcc_name"], result["sent_bcc_email"] = extract_email_details(
            metadata_json["bcc"]
        )

    metadata.update(result)

    prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
    chain = {"content": lambda x: x} | prompt | llm_gpt

    agentic_metadata = await chain.invoke(email_body)
    agentic_metadata_json = json.loads(agentic_metadata)

    metadata.update(agentic_metadata_json)

    return metadata


async def is_pdf(fpath: str, fname: str):
    """
    Determine if a PDF file is likely to be an original PDF or a converted PPT.

    :param fpath: Path to the folder containing the file
    :param fname: Name of the file
    :return: True if it is likely an original PDF, False otherwise
    """
    try:
        with open(os.path.join(fpath, fname), "rb") as file:
            with pdfplumber.open(file) as pdf:
                page_layouts = set((page.width, page.height) for page in pdf.pages)
                aspect_ratios = [width / height for width, height in page_layouts]

                total_pages = len(aspect_ratios)
                landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
                portrait_pages = total_pages - landscape_pages

                if len(set(page_layouts)) == 1 and aspect_ratios[0] > 1:
                    logging.info(f"{fname} is likely a PPT converted to PDF.")
                    return False
                elif portrait_pages == total_pages:
                    logging.info(f"{fname} is likely an original PDF.")
                    return True
                elif landscape_pages == total_pages:
                    logging.info(f"{fname} is likely a PPT converted to PDF.")
                    return False
                else:
                    landscape_ratio = landscape_pages / portrait_pages
                    if landscape_ratio > 0.7:
                        logging.info(f"{fname} is likely a PPT converted to PDF.")
                        return False
                    elif landscape_ratio < 0.3:
                        logging.info(f"{fname} is likely an original PDF.")
                        return True
                    else:
                        logging.info(f"{fname} has a mixed layout.")
                        return False
    except Exception as e:
        logging.error(f"An error occurred while analyzing PDF: {e}")
        return False


async def handle_ingestion_failure(
    file: str, error: str, failed_files: list, pdf_path: str = None
):
    """
    Handle failures in file ingestion and remove the output folders.

    :param file: Name of the file that failed ingestion
    :param error: Error message for the failure
    :param failed_files: List to track failed file metadata
    :param pdf_path: Optional path to the generated PDF file
    """
    logging.error(f"Ingestion failed for {file}: {error}")

    if pdf_path and os.path.exists(pdf_path):
        os.remove(pdf_path)

    for folder in OUTPUT_PATHS:
        shutil.rmtree(folder, ignore_errors=True)

    failed_files.append(
        {
            "Name": file,
            "IngestionError": error,
        }
    )


async def process_pdf(file: str, file_path: str, metadata: dict, failed_files: list):
    """
    Handle PDF ingestion.

    :param pdf_file: Name of the PDF file
    :param files_metadata: Metadata of the PDF file
    :param failed_files: List to track failed file metadata
    """
    try:
        if await is_pdf(file_path, file):
            success, error = await pdf_ingestion(file_path, file, metadata)
            if not success:
                await handle_ingestion_failure(file, error, failed_files)
        else:
            success, error = await ppt_ingestion(file_path, file, metadata)
            if not success:
                await handle_ingestion_failure(file, error, failed_files)
    except Exception as e:
        failed_files.append({"Name": file, "IngestionError": str(e)})


async def process_attached_file(
    file: str, file_path: str, metadata: dict, failed_files: list
):
    base_name, ext = os.path.splitext(file)
    lower_ext = ext.lower()
    lower_case_file = base_name + lower_ext
    original_file_path = os.path.join(file_path, file)
    lower_case_path = os.path.join(file_path, lower_case_file)

    if ext.isupper():
        try:
            await os.rename(original_file_path, lower_case_path)
        except OSError as e:
            logging.error(f"Error renaming file {file}: {e}")
            failed_files.append({"Name": file, "IngestionError": str(e)})
            return

    try:
        if lower_case_file.endswith(".pdf"):
            await process_pdf(lower_case_file, file_path, metadata, failed_files)
    except Exception as e:
        logging.error(f"Error processing {file}: {e}")
        failed_files.append({"Name": file, "IngestionError": str(e)})


async def ingest_files(file_path: str):
    file_name = os.path.basename(file_path)
    failed_files = []
    try:
        prompts = load_prompts()

        loader = UnstructuredEmailLoader(file_path, mode="elements")
        data = loader.load()

        metadata = data[0].metadata

        final_metadata = (
            await extract_metadata(metadata, file_path, prompts["metadata_extraction"])
            if os.path.splitext(file_name)[1] == ".msg"
            else metadata
        )

        output_dir = os.path.join(os.path.dirname(file_path), "attachments")

        if not os.path.exists(output_dir):
            logging.error(f"Output directory {output_dir} does not exist.")
            return False

        attachment_files = os.listdir(output_dir)

        for file in attachment_files:
            await process_attached_file(file, output_dir, final_metadata, failed_files)

            if failed_files:
                logging.error(f"Failed to ingest file {file}")
                return False

        logging.info(f"File {file_name} processed successfully")
        return True

    except Exception as e:
        logging.error(f"Failed to ingest file {file_name}: {str(e)}")
        return False
