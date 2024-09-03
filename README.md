import os
import csv
import glob
import shutil
import logging
import subprocess

from pdfplumber import open as open_pdf
from pdf_doc_docx_ingestion import pdf_ingestion_MV
from ppt_pptx_ingestion import pdf_ppt_ingestion_MV

# Configure logging for the script, which will log both to a file and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Define output directories for different types of processed files.
output_path = os.path.join(os.getcwd(), "output")
output_path_table = os.path.join(os.getcwd(), "table")
output_path_figure = os.path.join(os.getcwd(), "figures")

# List of folders to be used for storing processed outputs.
folders = [output_path, output_path_table, output_path_figure]

# Set a timeout for file conversion processes (e.g., converting documents to PDF).
CONVERSION_TIMEOUT = 60

def convert_file_to_pdf(fpath, fname):
    """
    Converts a given file to PDF using LibreOffice in headless mode.

    Parameters:
    fpath (str): The path where the file is located.
    fname (str): The name of the file to be converted.

    Returns:
    bool: True if the conversion is successful and the PDF file is created, False otherwise.
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
            logging.info("PDF File Created")
            return True
        else:
            logging.error("PDF file was not created.")
            return False

    except subprocess.TimeoutExpired:
        logging.error(f"Conversion of {fname} timed out.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

    return False

def is_pdf(fpath, fname):
    """
    Determines if a PDF file is likely an original PDF or a converted PPT.

    Parameters:
    fpath (str): The path where the PDF file is located.
    fname (str): The name of the PDF file.

    Returns:
    bool: True if the file is likely an original PDF, False if it is likely a converted PPT.
    """
    try:
        with open_pdf(os.path.join(fpath, fname)) as pdf:
            # Gather the layout dimensions of each page in the PDF.
            page_layouts = set((page.width, page.height) for page in pdf.pages)

            # Calculate aspect ratios for each page layout.
            aspect_ratios = [width / height for width, height in page_layouts]

            # Determine the number of pages with landscape and portrait layouts.
            total_pages = len(aspect_ratios)
            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = total_pages - landscape_pages

            # Logic to determine if the PDF is an original or converted from PPT.
            if len(set(page_layouts)) == 1:
                if aspect_ratios[0] > 1:
                    logging.info("PPT converted to PDF")
                    return False
                else:
                    logging.info("Likely Original PDF")
                    return True

            if landscape_pages == total_pages:
                logging.info("PPT Converted to PDF")
                return False
            elif portrait_pages == total_pages:
                logging.info("Likely Original PDF")
            else:
                # Handle mixed layouts, estimating the origin of the document.
                landscape_ratio = landscape_pages / portrait_pages
                if landscape_ratio > 0.7:
                    logging.info("PPT Converted to PDF")
                    return False
                elif landscape_ratio < 0.3:
                    logging.info("Likely Original PDF")
                    return True
                else:
                    logging.info("Mixed Layout (undetermined origin)")
                    return False

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False

def remove_all_files(files_to_ingest_folder):
    """
    Removes all files from the specified folder.

    Parameters:
    files_to_ingest_folder (str): The folder path from which to remove all files.
    """
    files = glob.glob(os.path.join(files_to_ingest_folder, "*"))
    for file in files:
        try:
            if os.path.exists(file):
                os.remove(file)
        except Exception as e:
            print(f"Error removing file {file}: {e}")

def ingest_files(file, files_metadata, deliverables_list_metadata):
    """
    Handles the ingestion process for a given file, including format checking and conversion if necessary.

    Parameters:
    file (str): The name of the file to ingest.
    files_metadata (dict): Metadata associated with the file.
    deliverables_list_metadata (dict): Additional metadata related to deliverables.

    Raises:
    Exception: If file ingestion fails at any step.
    """
    # Determine current and parent folder paths.
    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(parent_folder, current_folder, "files_to_ingest")

    failed_files = []

    if os.path.exists(os.path.join(files_to_ingest_folder, file)):

        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        original_file_path = os.path.join(files_to_ingest_folder, file)
        lower_case_file = base_name + lower_ext
        lower_case_path = os.path.join(files_to_ingest_folder, lower_case_file)

        file_was_renamed = False

        # Rename the file to lowercase if the extension was uppercase.
        if ext.isupper():
            os.rename(original_file_path, lower_case_path)
            file_was_renamed = True
        else:
            lower_case_file = file

        try:
            # Process PDF files.
            if lower_case_file.endswith(".pdf"):
                if is_pdf(files_to_ingest_folder, lower_case_file):
                    if not pdf_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    ):
                        # Cleanup if ingestion fails.
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception("PDF Ingestion Failed")
                else:
                    if not pdf_ppt_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    ):
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception("PDF Ingestion Failed")
                logging.info(f"{lower_case_file} processed successfully")

            # Process PPT/PPTX files.
            elif lower_case_file.endswith((".ppt", ".pptx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    if pdf_ppt_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    ):
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception("PPT Ingestion failed after Conversion")
                else:
                    raise Exception("PPT/PPTX Conversion failed")

            # Process DOC/DOCX files.
            elif lower_case_file.endswith((".doc", ".docx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    if pdf_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    ):
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception("PDF Ingestion failed after Conversion")
                else:
                    raise Exception("DOC/DOCX Conversion failed")

        except Exception as e:
            logging.error(f"Error Processing : {e}")
            remove_all_files(files_to_ingest_folder)
            failed_files.append(files_metadata)

        # Restore the original file name if it was renamed.
        if file_was_renamed:
            os.rename(lower_case_path, original_file_path)

    # Log failed files to a CSV file.
    failed_file_path = os.path.join(parent_folder, current_folder, "failed_files.csv")
    with open(failed_file_path, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(failed_file_path).st_size == 0:
            csv_writer.writerow(["ID", "Name", "Path", "WebUrl", "CreatedDateTime"])
        for failed_file in failed_files:
            csv_writer.writerow([failed_file])

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")
