import os
import shutil
import logging
import extract_msg
from email import policy
from pathlib import Path
from email.parser import BytesParser
from langchain_community.document_loaders import OutlookMessageLoader

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx"}


def extract_eml_attachments(
    eml_file: str, output_dir: str, page_content: str, metadata: dict
):
    try:
        os.makedirs(output_dir, exist_ok=True)

        with open(eml_file, "rb") as f:
            msg = BytesParser(policy=policy.default).parse(f)

        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                ext = Path(filename).suffix.lower()
                if ext in ALLOWED_EXTENSIONS:
                    attachment_path = os.path.join(output_dir, filename)
                    with open(attachment_path, "wb") as fp:
                        fp.write(part.get_payload(decode=True))
                    logging.info(f"Attachment {filename} saved at {attachment_path}")
                else:
                    logging.info(
                        f"Skipped attachment {filename} (unsupported file type)"
                    )
    except Exception as e:
        logging.error(f"Failed to process .eml file {eml_file}: {str(e)}")


def extract_msg_attachments(
    msg_file: str, output_dir: str, page_content: str, metadata: dict
):
    try:
        os.makedirs(output_dir, exist_ok=True)

        msg = extract_msg.Message(msg_file)

        for attachment in msg.attachments:
            filename = (
                attachment.longFilename
                if attachment.longFilename
                else attachment.shortFilename
            )
            print(filename)
            if filename:
                ext = Path(filename).suffix.lower()
                if ext in ALLOWED_EXTENSIONS:
                    attachment_path = os.path.join(output_dir, filename)
                    with open(attachment_path, "wb") as fp:
                        fp.write(attachment.data)
                    logging.info(f"Attachment {filename} saved at {attachment_path}")
                else:
                    logging.info(
                        f"Skipped attachment {filename} (unsupported file type)"
                    )
    except Exception as e:
        logging.error(f"Failed to process .msg file {msg_file}: {str(e)}")


async def process_file(file_path: Path):

    loader = OutlookMessageLoader(file_path)
    data = loader.load()

    page_content = data[0].page_content
    metadata = data[0].metadata

    output_dir = file_path.parent / "attachments"

    if file_path.suffix == ".msg":
        logging.info(f"Processing .msg file: {file_path}")
        extract_msg_attachments(str(file_path), str(output_dir), page_content, metadata)
    elif file_path.suffix == ".eml":
        logging.info(f"Processing .eml file: {file_path}")
        extract_eml_attachments(str(file_path), str(output_dir), page_content, metadata)
    else:
        logging.info(f"Skipping unsupported file type: {file_path}")

    logging.info(f"Finished processing file: {file_path}")
