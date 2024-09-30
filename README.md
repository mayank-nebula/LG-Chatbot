/home/Mayank.Sharma/anaconda3/envs/EmailAssistant/lib/python3.11/site-packages/pdfminer/psparser.py:220: RuntimeWarning: coroutine '_make_delegate_method.<locals>.method' was never awaited
  self.fp.seek(pos)
RuntimeWarning: Enable tracemalloc to get the object allocation traceback
/home/Mayank.Sharma/anaconda3/envs/EmailAssistant/lib/python3.11/site-packages/pdfminer/psparser.py:277: RuntimeWarning: coroutine '_make_delegate_method.<locals>.method' was never awaited
  self.fp.seek(0, 2)
RuntimeWarning: Enable tracemalloc to get the object allocation traceback
ERROR:root:An error occurred while analyzing PDF: '<' not supported between instances of 'int' and 'coroutine'
/home/Mayank.Sharma/EmailAssistant/utils/ingestion/ingestFiles_utils.py:55: RuntimeWarning: coroutine '_make_delegate_method.<locals>.method' was never awaited
  return False
RuntimeWarning: Enable tracemalloc to get the object allocation traceback
hello
ERROR:root:An error occurred while analyzing PDF: '<' not supported between instances of 'int' and 'coroutine'
hello


import os
import shutil
import logging
import aiofiles
import aiofiles.os
import pdfplumber

# from utils.ingestion.ppt_ingestion import pdf_ppt_ingestion_MV
from langchain_community.document_loaders import OutlookMessageLoader

CONVERSION_TIMEOUT = 180
OUTPUT_PATHS = ["output", "table", "figures"]


async def is_pdf(fpath, fname):
    """
    Determine if a PDF file is likely to be an original PDF or a converted PPT.

    :param fpath: Path to the folder containing the file
    :param fname: Name of the file
    :return: True if it is likely an original PDF, False otherwise
    """
    try:
        async with aiofiles.open(os.path.join(fpath, fname), "rb") as file:
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


async def handle_ingestion_failure(file, error, failed_files, pdf_path=None):
    """
    Handle failures in file ingestion and remove the output folders.

    :param file: Name of the file that failed ingestion
    :param error: Error message for the failure
    :param failed_files: List to track failed file metadata
    :param pdf_path: Optional path to the generated PDF file
    """
    logging.error(f"Ingestion failed for {file}: {error}")
    if pdf_path and os.path.exists(pdf_path):
        await aiofiles.os.remove(pdf_path)

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
            print("hi")
        else:
            print("hello")
        #     success, error = await pdf_ppt_ingestion_MV(file_path, file, metadata)
        #     if not success:
        #         await handle_ingestion_failure(file, error, failed_files)
        # else:
        #     success, error = await pdf_ppt_ingestion_MV(file_path, file, metadata)
        #     if not success:
        #         await handle_ingestion_failure(file, error, failed_files)
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
        await aiofiles.os.rename(original_file_path, lower_case_path)

    try:
        if lower_case_file.endswith(".pdf"):
            await process_pdf(lower_case_file, file_path, metadata, failed_files)
        # elif lower_case_file.endswith((".ppt", ".pptx")):
        #     await process_ppt_pptx(lower_case_file, file_path, metadata, failed_files)
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
        attachment_files = os.listdir(output_dir)

        for file in attachment_files:
            await process_attached_file(file, output_dir, metadata, failed_files)

    except Exception as e:
        logging.error(f"Failed to ingest file {file_name}: {str(e)}")
