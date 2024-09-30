import os
import logging
import extract_msg
from email import policy
from email.parser import BytesParser

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx"}


def extract_eml_attachments(eml_file: str, output_dir: str):
    try:
        os.makedirs(output_dir, exist_ok=True)

        with open(eml_file, "rb") as f:
            msg = BytesParser(policy=policy.default).parse(f)

        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                ext = os.path.splitext(filename)[1].lower()
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


def extract_msg_attachments(msg_file: str, output_dir: str):
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
                ext = os.path.splitext(filename)[1].lower()
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


async def process_file(file_path: str):
    """
    Processes a file (.msg or .eml) and extracts attachments, if any.
    """

    output_dir = os.path.join(os.path.dirname(file_path), "attachments")

    if file_path.endswith(".msg"):
        logging.info(f"Processing .msg file: {file_path}")
        extract_msg_attachments(
            file_path,
            output_dir,
        )
    elif file_path.endswith(".eml"):
        logging.info(f"Processing .eml file: {file_path}")
        extract_eml_attachments(
            file_path,
            output_dir,
        )
    else:
        logging.info(f"Skipping unsupported file type: {file_path}")
        

    logging.info(f"Finished processing file: {file_path}")
