import os
import logging
import extract_msg
from email import policy
from email.parser import BytesParser

# Set up logging with more details
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def create_output_dir(output_dir: str):
    """
    Ensures the output directory exists.
    """
    try:
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Output directory created or already exists: {output_dir}")
    except Exception as e:
        logging.error(f"Failed to create output directory {output_dir}: {str(e)}")
        raise


def extract_eml_attachments(eml_file: str, output_dir: str):
    """
    Extracts attachments from an .eml file.
    """
    try:
        # Read the .eml file
        with open(eml_file, 'rb') as f:
            msg = BytesParser(policy=policy.default).parse(f)

        # Extract attachments
        for part in msg.iter_attachments():
            filename = part.get_filename()
            if filename:
                save_attachment(output_dir, filename, part.get_payload(decode=True))
    except Exception as e:
        logging.error(f"Error processing .eml file {eml_file}: {str(e)}")


def extract_msg_attachments(msg_file: str, output_dir: str):
    """
    Extracts attachments from a .msg file.
    """
    try:
        # Open the .msg file
        msg = extract_msg.Message(msg_file)

        # Extract attachments
        for attachment in msg.attachments:
            filename = attachment.longFilename if attachment.longFilename else attachment.shortFilename
            if filename:
                save_attachment(output_dir, filename, attachment.data)
    except Exception as e:
        logging.error(f"Error processing .msg file {msg_file}: {str(e)}")


def save_attachment(output_dir: str, filename: str, content: bytes):
    """
    Saves the attachment to the output directory.
    
    Args:
        output_dir (str): Directory where the attachment should be saved.
        filename (str): Name of the attachment file.
        content (bytes): The content of the attachment.
    """
    try:
        attachment_path = os.path.join(output_dir, filename)
        with open(attachment_path, 'wb') as fp:
            fp.write(content)
        logging.info(f"Attachment {filename} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to save attachment {filename}: {str(e)}")


def process_file(file_path: str, output_dir: str = 'attachments'):
    """
    Determines file type and processes the file accordingly.

    Args:
        file_path (str): Path to the email file (.eml or .msg).
        output_dir (str): Directory to save attachments. Defaults to 'attachments'.
    """
    try:
        # Ensure output directory exists
        create_output_dir(output_dir)
        
        # Determine file extension and extract attachments
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        if ext == '.eml':
            extract_eml_attachments(file_path, output_dir)
        elif ext == '.msg':
            extract_msg_attachments(file_path, output_dir)
        else:
            logging.warning(f"Unsupported file type {ext}. Only .eml and .msg files are supported.")
    except Exception as e:
        logging.error(f"Failed to process file {file_path}: {str(e)}")


if __name__ == "__main__":
    # Example usage of the unified process_file function
    file_path = 'File Processing Failures_ Causes_ Sample Files for Review.msg'
    process_file(file_path)
