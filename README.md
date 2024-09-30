import os
import logging
from pathlib import Path
from email import policy
from email.parser import BytesParser
import extract_msg

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def extract_eml_attachments(eml_file: str, output_dir: str):
    """
    Extracts attachments from an .eml file and saves them to a directory named after the .eml file.
    
    Args:
        eml_file (str): Path to the .eml file.
        output_dir (str): Directory where attachments will be saved.
    """
    try:
        # Create a folder with the same name as the file (without extension)
        file_name = Path(eml_file).stem  # e.g., 'example' from 'example.eml'
        attachments_dir = os.path.join(output_dir, "attachments", file_name)
        
        # Add logging to check path creation
        logging.info(f"Creating directory for attachments: {attachments_dir}")
        
        os.makedirs(attachments_dir, exist_ok=True)

        # Open and read the .eml file
        with open(eml_file, 'rb') as f:
            msg = BytesParser(policy=policy.default).parse(f)

        # Extract attachments
        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                attachment_path = os.path.join(attachments_dir, filename)
                
                # Add logging to check file write operation
                logging.info(f"Saving attachment to: {attachment_path}")
                
                with open(attachment_path, 'wb') as fp:
                    fp.write(part.get_payload(decode=True))
                logging.info(f"Attachment {filename} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to process .eml file {eml_file}: {str(e)}")


def extract_msg_attachments(msg_file: str, output_dir: str):
    """
    Extracts attachments from a .msg file and saves them to a directory named after the .msg file.
    
    Args:
        msg_file (str): Path to the .msg file.
        output_dir (str): Directory where attachments will be saved.
    """
    try:
        # Create a folder with the same name as the file (without extension)
        file_name = Path(msg_file).stem  # e.g., 'example' from 'example.msg'
        attachments_dir = os.path.join(output_dir, "attachments", file_name)
        
        # Add logging to check path creation
        logging.info(f"Creating directory for attachments: {attachments_dir}")
        
        os.makedirs(attachments_dir, exist_ok=True)

        # Open the .msg file
        msg = extract_msg.Message(msg_file)

        # Extract attachments
        for attachment in msg.attachments:
            filename = attachment.longFilename if attachment.longFilename else attachment.shortFilename
            if filename:
                attachment_path = os.path.join(attachments_dir, filename)
                
                # Add logging to check file write operation
                logging.info(f"Saving attachment to: {attachment_path}")
                
                with open(attachment_path, 'wb') as fp:
                    fp.write(attachment.data)
                logging.info(f"Attachment {filename} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to process .msg file {msg_file}: {str(e)}")


async def process_file(file_path: Path):
    """
    Process the file based on its type (eml or msg) and retrieve attachments.
    
    Args:
        file_path (Path): Path to the file to be processed.
    """
    output_dir = file_path.parent  # User directory

    if file_path.suffix == ".msg":
        logging.info(f"Processing .msg file: {file_path}")
        extract_msg_attachments(str(file_path), str(output_dir))
    elif file_path.suffix == ".eml":
        logging.info(f"Processing .eml file: {file_path}")
        extract_eml_attachments(str(file_path), str(output_dir))
    else:
        logging.info(f"Skipping unsupported file type: {file_path}")

    logging.info(f"Finished processing file: {file_path}")
