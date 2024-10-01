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

load_dotenv()

# Constants for paths
OUTPUT_PATHS = ["output"]
CONVERSION_TIMEOUT = 180

# Initialize LLM
llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)


def load_prompts():
    """
    Load prompts from a JSON file.
    """
    with open("../prompts.json", "r") as file:
        return json.load(file)


def extract_email_details(email_field):
    """
    Extract names and emails from a given string.
    """
    pattern = r"([\w\s]+)\s*<([^>]+)>"
    matches = re.findall(pattern, email_field)
    names = [match[0].strip() for match in matches]
    emails = [match[1].strip() for match in matches]
    return names, emails


async def extract_metadata(metadata, file_path, metadata_extraction_prompt, email_body):
    """
    Extract structured and agentic metadata from an email.
    """
    try:
        metadata_extract_msg = extract_msg.Message(file_path)
        metadata_json = json.loads(metadata_extract_msg.getJson())

        # Initialize fields for the metadata
        result = {
            "sent_to_name": [], "sent_to_email": [],
            "sent_from_name": [], "sent_from_email": [],
            "sent_cc_name": [], "sent_cc_email": [],
            "sent_bcc_name": [], "sent_bcc_email": [],
        }

        # Extract 'to', 'from', 'cc', and 'bcc' fields
        for field in ["to", "from", "cc", "bcc"]:
            if metadata_json.get(field):
                result[f"sent_{field}_name"], result[f"sent_{field}_email"] = extract_email_details(
                    metadata_json[field]
                )

        # Update the base metadata with the extracted data
        metadata.update(result)

        # LLM-based agentic metadata extraction
        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt
        agentic_metadata = await chain.invoke(email_body)

        # Merge LLM-generated metadata with the existing metadata
        agentic_metadata_json = json.loads(agentic_metadata)
        metadata.update(agentic_metadata_json)

    except Exception as e:
        logging.error(f"Error extracting metadata from {file_path}: {e}")
        return None

    return metadata


async def is_pdf(file_path):
    """
    Determine if a file is a PDF or a converted PPT based on page layouts.
    """
    try:
        with pdfplumber.open(file_path) as pdf:
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


async def handle_ingestion_failure(file, error, failed_files, pdf_path=None):
    """
    Handle failure during file ingestion.
    """
    logging.error(f"Ingestion failed for {file}: {error}")
    
    # Cleanup failed output directories
    for folder in OUTPUT_PATHS:
        shutil.rmtree(folder, ignore_errors=True)
    
    # If a temporary PDF was created, remove it
    if pdf_path and os.path.exists(pdf_path):
        os.remove(pdf_path)

    # Record the failure
    failed_files.append({"Name": file, "IngestionError": error})


async def process_file_by_type(file, file_path, metadata, failed_files):
    """
    Process file based on its type (PDF, PPT).
    """
    try:
        if await is_pdf(file_path):
            success, error = await pdf_ingestion(file_path, file, metadata)
        else:
            success, error = await ppt_ingestion(file_path, file, metadata)

        if not success:
            await handle_ingestion_failure(file, error, failed_files)

    except Exception as e:
        await handle_ingestion_failure(file, str(e), failed_files)


async def process_attachment(file, file_path, metadata, failed_files):
    """
    Process an attached file and determine how to handle it based on its type.
    """
    try:
        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        lower_case_file = base_name + lower_ext
        original_file_path = os.path.join(file_path, file)
        lower_case_path = os.path.join(file_path, lower_case_file)

        # Rename file to lowercase if needed
        if ext.isupper():
            await os.rename(original_file_path, lower_case_path)

        # Process PDF files
        if lower_case_file.endswith(".pdf"):
            await process_file_by_type(lower_case_file, file_path, metadata, failed_files)

    except OSError as e:
        logging.error(f"Error renaming file {file}: {e}")
        failed_files.append({"Name": file, "IngestionError": str(e)})


async def ingest_files(file_path):
    """
    Ingest email files and process their attachments.
    """
    file_name = os.path.basename(file_path)
    failed_files = []
    
    try:
        # Load prompts
        prompts = load_prompts()

        # Load email data
        loader = UnstructuredEmailLoader(file_path, mode="elements")
        data = loader.load()
        metadata = data[0].metadata

        # Extract additional metadata if it's an MSG file
        if file_name.endswith(".msg"):
            metadata = await extract_metadata(
                metadata, file_path, prompts["metadata_extraction"], data[0].page_content
            )

        # Check and create output directories
        output_dir = os.path.join(os.path.dirname(file_path), "attachments")
        if not os.path.exists(output_dir):
            logging.error(f"Output directory {output_dir} does not exist.")
            return False

        # Process attachments
        attachment_files = os.listdir(output_dir)
        for file in attachment_files:
            await process_attachment(file, output_dir, metadata, failed_files)
            if failed_files:
                logging.error(f"Failed to ingest file {file}")
                return False

        logging.info(f"File {file_name} processed successfully.")
        return True

    except Exception as e:
        logging.error(f"Failed to ingest file {file_name}: {e}")
        return False
