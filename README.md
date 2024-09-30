import os
import logging
from pathlib import Path
from email import policy
from email.parser import BytesParser
import extract_msg

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Supported file types
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.ppt', '.pptx'}

def extract_eml_attachments(eml_file: str, output_dir: str):
    """
    Extracts attachments from an .eml file and saves them to the specified output directory.
    Only extracts files with specific extensions (.pdf, .doc, .docx, .ppt, .pptx).

    Args:
        eml_file (str): Path to the .eml file.
        output_dir (str): Directory where attachments will be saved.
    """
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Open and read the .eml file
        with open(eml_file, 'rb') as f:
            msg = BytesParser(policy=policy.default).parse(f)

        # Extract attachments
        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                # Extract extension and check if it's in allowed extensions
                ext = Path(filename).suffix.lower()
                if ext in ALLOWED_EXTENSIONS:
                    attachment_path = os.path.join(output_dir, filename)
                    with open(attachment_path, 'wb') as fp:
                        fp.write(part.get_payload(decode=True))
                    logging.info(f"Attachment {filename} saved at {attachment_path}")
                else:
                    logging.info(f"Skipped attachment {filename} (unsupported file type)")
    except Exception as e:
        logging.error(f"Failed to process .eml file {eml_file}: {str(e)}")


def extract_msg_attachments(msg_file: str, output_dir: str):
    """
    Extracts attachments from a .msg file and saves them to the specified output directory.
    Only extracts files with specific extensions (.pdf, .doc, .docx, .ppt, .pptx).

    Args:
        msg_file (str): Path to the .msg file.
        output_dir (str): Directory where attachments will be saved.
    """
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Open the .msg file
        msg = extract_msg.Message(msg_file)

        # Extract attachments
        for attachment in msg.attachments:
            filename = attachment.longFilename if attachment.longFilename else attachment.shortFilename
            if filename:
                # Extract extension and check if it's in allowed extensions
                ext = Path(filename).suffix.lower()
                if ext in ALLOWED_EXTENSIONS:
                    attachment_path = os.path.join(output_dir, filename)
                    with open(attachment_path, 'wb') as fp:
                        fp.write(attachment.data)
                    logging.info(f"Attachment {filename} saved at {attachment_path}")
                else:
                    logging.info(f"Skipped attachment {filename} (unsupported file type)")
    except Exception as e:
        logging.error(f"Failed to process .msg file {msg_file}: {str(e)}")


async def process_file(file_path: Path):
    """
    Process the file based on its type (eml or msg) and retrieve attachments.

    Args:
        file_path (Path): Path to the file to be processed.
    """
    output_dir = file_path.parent / "attachments"  # Create an attachments directory within the user's folder

    if file_path.suffix == ".msg":
        logging.info(f"Processing .msg file: {file_path}")
        extract_msg_attachments(str(file_path), str(output_dir))
    elif file_path.suffix == ".eml":
        logging.info(f"Processing .eml file: {file_path}")
        extract_eml_attachments(str(file_path), str(output_dir))
    else:
        logging.info(f"Skipping unsupported file type: {file_path}")

    logging.info(f"Finished processing file: {file_path}")
