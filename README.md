import os
import csv
import shutil
import logging
import subprocess

from pdfplumber import open as open_pdf

from pdf_doc_docx_ingestion import pdf_ingestion_MV
from ppt_pptx_ingestion import pdf_ppt_ingestion_MV

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

output_path = os.path.join(os.getcwd(), "output")
output_path_table = os.path.join(os.getcwd(), "table")
output_path_figure = os.path.join(os.getcwd(), "figures")

folders = [output_path, output_path_table, output_path_figure]

CONVERSION_TIMEOUT = 180

def convert_file_to_pdf(fpath, fname):
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
    try:
        with open_pdf(os.path.join(fpath, fname)) as pdf:
            page_layouts = set((page.width, page.height) for page in pdf.pages)

            aspect_ratios = [width / height for width, height in page_layouts]

            total_pages = len(aspect_ratios)
            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = total_pages - landscape_pages

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
                return True
            else:
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

def delete_files_in_folder(folder_path):
    """
    Delete all files in the specified folder, but keep the folder itself.

    Args:
    folder_path (str): Path to the folder whose contents should be deleted

    """
    # Check if the folder exists
    if not os.path.exists(folder_path):
        print(f"The folder {folder_path} does not exist.")
        return False

    # Iterate over all items in the folder
    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)

        if os.path.isfile(item_path):
            os.unlink(item_path)
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)

    print(f"All contents of {folder_path} have been deleted.")


def ingest_files(file, files_metadata, deliverables_list_metadata):

    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(
        parent_folder, current_folder, "files_to_ingest"
    )
    failed_files = []

    if os.path.exists(os.path.join(files_to_ingest_folder, file)):

        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        original_file_path = os.path.join(files_to_ingest_folder, file)
        lower_case_file = base_name + lower_ext
        lower_case_path = os.path.join(files_to_ingest_folder, lower_case_file)

        file_was_renamed = False

        if ext.isupper():
            os.rename(original_file_path, lower_case_path)
            file_was_renamed = True
        else:
            lower_case_file = file

        try:
            success = False
            ingestion_error = None  # Initialize ingestion_error

            if lower_case_file.endswith(".pdf"):
                if is_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(
                            ingestion_error
                        )  # Raise the returned error message
                else:
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                logging.info(f"{lower_case_file} processed successfully")

            elif lower_case_file.endswith((".ppt", ".pptx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        os.remove(pdf_path)
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("PPT/PPTX Conversion failed")

            elif lower_case_file.endswith((".doc", ".docx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        os.remove(pdf_path)
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("DOC/DOCX Conversion failed")

        except Exception as e:
            logging.error(f"Error Processing : {e}")
            failed_files.append(
                {**files_metadata, "IngestionError": ingestion_error or str(e)}
            )
            delete_files_in_folder(files_to_ingest_folder)

        if file_was_renamed:
            os.rename(lower_case_path, original_file_path)

    failed_file_path = os.path.join(parent_folder, current_folder, "failed_files_1.csv")
    with open(failed_file_path, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(failed_file_path).st_size == 0:
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

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")

