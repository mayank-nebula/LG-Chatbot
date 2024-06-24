import os
import shutil
import time
import csv
import logging
import subprocess
from pdfplumber import open as open_pdf

from pdf_loader_MV import pdf_ingestion_MV
from ppt_loader_MV import ppt_ingestion_MV
from pdf_ppt_loader import pdf_ppt_ingestion_MV

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

CONVERSION_TIMEOUT = 10

def convert_doc_to_file(fpath, fname):
    try:
        if fname.endswith(".doc"):
            docx_fname = os.path.splitext(fname)[0] + ".docx"
            docx_file = os.path.join(fpath,docx_fname)
            subprocess.run(["unoconv", "-f", "docx", "-o", docx_file, os.path.join(fpath,fname)], timeout=CONVERSION_TIMEOUT)

            pdf_fname = os.path.splitext(fname)[0] + ".pdf"
            pdf_file = os.path.join(fpath,pdf_fname)
            subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_file, os.path.join(fpath,docx_fname)], timeout=CONVERSION_TIMEOUT)

            os.remove(docx_file)
            logging.info("PDF File Created")
            return True

        elif fname.endswith(".docx"):
            pdf_fname = os.path.splitext(fname)[0] + ".pdf"
            pdf_file = os.path.join(fpath,pdf_fname)
            subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_file, os.path.join(fpath,fname)], timeout=CONVERSION_TIMEOUT, check=True)

            logging.info("PDF File Created")
            return True
    
    except subprocess.TimeoutExpired:
        logging.error(f"Conversion of {fname} can't be done.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

    return False

def is_pdf(fpath, fname):
    try:
        with open_pdf(os.path.join(fpath,fname)) as pdf:
            page_layouts = set((page.width,page.height) for page in pdf.pages)
            if len(page_layouts) == 1:
                width,height = next(iter(page_layouts))
                aspect_ratio = width/height
                if aspect_ratio > 1:
                    logging.info('PPT converted to PDF')
                    return False
        logging.info('Original PDF')
        return True
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False


def ingest_files(files_metadata, deliverables_list_metadata):
    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(parent_folder, current_folder, "files_to_ingest")

    failed_files = []

    for file in os.listdir(files_to_ingest_folder):

        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        original_file_path = os.path.join(files_to_ingest_folder,file)
        lower_case_file = base_name + lower_ext
        lower_case_path = os.path.join(files_to_ingest_folder,lower_case_file)

        file_was_renamed = False

        if ext.isupper():
            os.rename(original_file_path, lower_case_path)
            file_was_renamed = True
        else:
            lower_case_file = file

        try:
            if lower_case_file.endswith(".pdf"):
                if is_pdf(files_to_ingest_folder,lower_case_file):
                    if not pdf_ingestion_MV(lower_case_file, files_metadata, deliverables_list_metadata):
                        raise Exception("PDF Ingestion Failed")
                else:
                    if not pdf_ppt_ingestion_MV(lower_case_file, files_metadata, deliverables_list_metadata):
                        raise Exception("PDF Ingestion Failed")
                logging.info(f"{lower_case_file} processed successfully")

            elif lower_case_file.endswith((".ppt", ".pptx")):
                if not ppt_ingestion_MV(lower_case_file, files_metadata, deliverables_list_metadata):
                    raise Exception("PPT Ingestion Failed")
                logging.info(f"{lower_case_file} processed successfully")

            elif lower_case_file.endswith((".doc", ".docx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_doc_to_file(files_to_ingest_folder,lower_case_file):
                    if pdf_ingestion_MV(pdf_name, files_metadata, deliverables_list_metadata):
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                        else:
                            raise Exception("PDF Ingestion failed after Conversion")
                else:
                    raise Exception("DOC/DOCX Conversion failed")

        except Exception as e:
            logging.error(f"Error Processing : {e}")
            failed_files.append(lower_case_file)

        if file_was_renamed:
            os.rename(lower_case_path, original_file_path)

    # Write failed files to CSV after processing all files
    failed_file_path = os.path.join(parent_folder, current_folder, 'failed_files.csv')
    with open(failed_file_path, 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(['Filename'])
        for failed_file in failed_files:
            csv_writer.writerow([failed_file])

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")
