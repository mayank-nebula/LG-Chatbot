import os
import logging
from langchain_community.document_loaders import OutlookMessageLoader


async def ingest_files(file_path: str):
    file_name = os.path.basename(file_path)
    try:

        loader = OutlookMessageLoader(file_path)
        data = loader.load()

        page_content = data[0].page_content
        metadata = data[0].metadata

        output_dir = os.path.join(os.path.dirname(file_path), "attachments")

        for file in output_dir:
            process_attached_file(file, metadata)

    except Exception as e:
        logging.error(f"Failed to ingest file {file_name}: {str(e)}")
