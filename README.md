import os
import csv
import shutil
import logging
import subprocess

import pdfplumber

from pdf_doc_docx_ingestion import pdf_ingestion_MV
from ppt_pptx_ingestion import pdf_ppt_ingestion_MV

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Constants
LIBREOFFICE_PATH = r"C:\Program Files\LibreOffice\program\soffice.exe"
CONVERSION_TIMEOUT = 180
OUTPUT_PATHS = ["output", "table", "figures"]
FILES_TO_INGEST_FOLDER = os.path.join(os.getcwd(), "files_to_ingest")
FAILED_FILES_CSV = os.path.join(os.getcwd(), "failed_files_1.csv")


# Ensure output folders exist
for folder in OUTPUT_PATHS:
    os.makedirs(folder, exist_ok=True)


def convert_file_to_pdf(fpath, fname):
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
                LIBREOFFICE_PATH,
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


def is_pdf(fpath, fname):
    """
    Determine if a PDF file is likely to be an original PDF or a converted PPT.

    :param fpath: Path to the folder containing the file
    :param fname: Name of the file
    :return: True if it is likely an original PDF, False otherwise
    """
    try:
        with pdfplumber.open(os.path.join(fpath, fname)) as pdf:
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


def delete_files_in_folder(folder_path):
    """
    Delete all files in the specified folder, keeping the folder itself.

    :param folder_path: Path to the folder whose contents should be deleted
    """
    if os.path.exists(folder_path):
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            if os.path.isfile(item_path):
                os.unlink(item_path)
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)
        logging.info(f"All contents of {folder_path} have been deleted.")
    else:
        logging.warning(f"The folder {folder_path} does not exist.")


def write_failed_files_to_csv(failed_files):
    """
    Write failed files and their errors to a CSV file.

    :param failed_files: List of dictionaries containing file metadata and errors
    """
    with open(FAILED_FILES_CSV, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(FAILED_FILES_CSV).st_size == 0:
            csv_writer.writerow(
                ["ID", "Name", "Path", "WebUrl", "CreatedDateTime", "IngestionError"]
            )
        for failed_file in failed_files:
            csv_writer.writerow(
                [
                    failed_file.get("ID", ""),
                    failed_file.get("Name", ""),
                    failed_file.get("Path", ""),
                    failed_file.get("WebUrl", ""),
                    failed_file.get("CreatedDateTime", ""),
                    failed_file.get("IngestionError", ""),
                ]
            )
    logging.info(f"Failed files written to {FAILED_FILES_CSV}")


def process_file(file, files_metadata, failed_files):
    """
    Process a single file for ingestion.

    :param file: The file name
    :param files_metadata: The metadata for the file
    :param failed_files: List to track failed file metadata
    """
    base_name, ext = os.path.splitext(file)
    lower_ext = ext.lower()
    lower_case_file = base_name + lower_ext
    original_file_path = os.path.join(FILES_TO_INGEST_FOLDER, file)
    lower_case_path = os.path.join(FILES_TO_INGEST_FOLDER, lower_case_file)

    if ext.isupper():
        os.rename(original_file_path, lower_case_path)

    try:
        if lower_case_file.endswith(".pdf"):
            process_pdf(lower_case_file, files_metadata, failed_files)
        elif lower_case_file.endswith((".ppt", ".pptx")):
            process_ppt_pptx(lower_case_file, files_metadata, failed_files)
        elif lower_case_file.endswith((".doc", ".docx")):
            process_doc_docx(lower_case_file, files_metadata, failed_files)
    except Exception as e:
        logging.error(f"Error processing {file}: {e}")
        failed_files.append(
            {
                "ID": files_metadata.get("ID", "Unknown"),
                "Name": files_metadata.get("Name", file),
                "Path": files_metadata.get("Path", ""),
                "WebUrl": files_metadata.get("WebUrl", ""),
                "CreatedDateTime": files_metadata.get("CreatedDateTime", ""),
                "IngestionError": str(e),
            }
        )


def process_pdf(pdf_file, files_metadata, failed_files):
    """
    Handle PDF ingestion.

    :param pdf_file: Name of the PDF file
    :param files_metadata: Metadata of the PDF file
    :param failed_files: List to track failed file metadata
    """
    try:
        if is_pdf(FILES_TO_INGEST_FOLDER, pdf_file):
            success, error = pdf_ingestion_MV(pdf_file, files_metadata)
            if not success:
                handle_ingestion_failure(pdf_file, error, failed_files)
        else:
            success, error = pdf_ppt_ingestion_MV(pdf_file, files_metadata)
            if not success:
                handle_ingestion_failure(pdf_file, error, failed_files)
    except Exception as e:
        failed_files.append({**files_metadata, "IngestionError": str(e)})


def process_ppt_pptx(ppt_file, files_metadata, failed_files):
    """
    Handle PPT/PPTX ingestion by converting to PDF first.

    :param ppt_file: Name of the PPT/PPTX file
    :param files_metadata: Metadata of the PPT/PPTX file
    :param failed_files: List to track failed file metadata
    """
    pdf_name = os.path.splitext(ppt_file)[0] + ".pdf"
    try:
        if convert_file_to_pdf(FILES_TO_INGEST_FOLDER, ppt_file):
            success, error = pdf_ppt_ingestion_MV(pdf_name, files_metadata)
            if success:
                os.remove(os.path.join(FILES_TO_INGEST_FOLDER, pdf_name))
                logging.info(f"{ppt_file} processed successfully")
            else:
                handle_ingestion_failure(
                    ppt_file,
                    error,
                    failed_files,
                    os.remove(os.path.join(FILES_TO_INGEST_FOLDER, pdf_name)),
                )
        else:
            raise Exception(f"Failed to convert {ppt_file} to PDF.")
    except Exception as e:
        failed_files.append({**files_metadata, "IngestionError": str(e)})


def process_doc_docx(doc_file, files_metadata, failed_files):
    """
    Handle DOC/DOCX ingestion by converting to PDF first.

    :param doc_file: Name of the DOC/DOCX file
    :param files_metadata: Metadata of the DOC/DOCX file
    :param failed_files: List to track failed file metadata
    """
    pdf_name = os.path.splitext(doc_file)[0] + ".pdf"
    try:
        if convert_file_to_pdf(FILES_TO_INGEST_FOLDER, doc_file):
            success, error = pdf_ingestion_MV(pdf_name, files_metadata)
            if success:
                os.remove(os.path.join(FILES_TO_INGEST_FOLDER, pdf_name))
                logging.info(f"{doc_file} processed successfully")
            else:
                handle_ingestion_failure(
                    doc_file,
                    error,
                    failed_files,
                    os.remove(os.path.join(FILES_TO_INGEST_FOLDER, pdf_name)),
                )
        else:
            raise Exception(f"Failed to convert {doc_file} to PDF.")
    except Exception as e:
        failed_files.append({**files_metadata, "IngestionError": str(e)})


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


# Main entry point for file ingestion
def ingest_files(file, files_metadata):
    """
    Ingest multiple files based on their type and metadata.

    :param file: File name
    :param files_metadata: Metadata of the file
    """
    failed_files = []
    process_file(file, files_metadata, failed_files)
    if failed_files:
        write_failed_files_to_csv(failed_files)
