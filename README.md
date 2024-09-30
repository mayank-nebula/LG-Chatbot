import os
import shutil
import logging
import pdfplumber
from langchain_community.document_loaders import OutlookMessageLoader


CONVERSION_TIMEOUT = 180
OUTPUT_PATHS = ["output", "table", "figures"]


def is_pdf(fpath, fname):
    """
    Determine if a PDF file is likely to be an original PDF or a converted PPT.

    :param fpath: Path to the folder containing the file
    :param fname: Name of the file
    :return: True if it is likely an original PDF, False otherwise
    """
    try:
        with pdfplumber.open(fpath) as pdf:
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


def handle_ingestion_failure(file, error, failed_files, pdf_path=None):
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

    # Append detailed failure metadata
    failed_files.append(
        {
            "ID": file.get("ID", "Unknown"),
            "Name": file.get("Name", file),
            "Path": file.get("Path", ""),
            "WebUrl": file.get("WebUrl", ""),
            "CreatedDateTime": file.get("CreatedDateTime", ""),
            "IngestionError": error,
        }
    )


async def process_pdf(pdf_file, pdf_file_path, files_metadata, failed_files):
    """
    Handle PDF ingestion.

    :param pdf_file: Name of the PDF file
    :param files_metadata: Metadata of the PDF file
    :param failed_files: List to track failed file metadata
    """
    try:
        if is_pdf(pdf_file_path, pdf_file):
            success, error = pdf_ingestion_MV(pdf_file, pdf_file_path, files_metadata)
            if not success:
                handle_ingestion_failure(pdf_file, error, failed_files)
        else:
            success, error = pdf_ppt_ingestion_MV(
                pdf_file, pdf_file_path, files_metadata
            )
            if not success:
                handle_ingestion_failure(pdf_file, error, failed_files)
    except Exception as e:
        failed_files.append({**files_metadata, "IngestionError": str(e)})


async def process_attached_file(
    file: str, file_path: str, metadata: dict, failed_files: list
):
    base_name, ext = os.path.splitext(file)
    lower_ext = ext.lower()
    lower_case_file = base_name + lower_ext
    original_file_path = os.path.join(file_path, file)
    lower_case_path = os.path.join(file_path, lower_case_file)

    if ext.isupper():
        os.rename(original_file_path, lower_case_path)

    try:
        if lower_case_file.endswith(".pdf"):
            await process_pdf(lower_case_file, lower_case_path, metadata, failed_files)
        # elif lower_case_file.endswith((".ppt", ".pptx")):
        #     await process_ppt_pptx(lower_case_file, metadata, failed_files)
        # elif lower_case_file.endswith((".doc", ".docx")):
        #     await process_doc_docx(lower_case_file, metadata, failed_files)
    except Exception as e:
        logging.error(f"Error processing {file}: {e}")
        failed_files.append({"Name": file, "IngestionError": str(e)})


async def ingest_files(file_path: str):
    file_name = os.path.basename(file_path)
    failed_files = []
    try:

        loader = OutlookMessageLoader(file_path)
        data = loader.load()

        page_content = data[0].page_content
        metadata = data[0].metadata

        output_dir = os.path.join(os.path.dirname(file_path), "attachments")

        for file in output_dir:
            await process_attached_file(
                file, os.path.join(output_dir, file), metadata, failed_files
            )

    except Exception as e:
        logging.error(f"Failed to ingest file {file_name}: {str(e)}")
