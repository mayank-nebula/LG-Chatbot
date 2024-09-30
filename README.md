import os
import logging
from email import policy
from email.parser import BytesParser
import extract_msg

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def extract_eml_attachments(eml_file: str, output_dir: str = 'attachments'):
    """
    Extracts attachments from an .eml file and saves them to the specified output directory.

    Args:
        eml_file (str): Path to the .eml file.
        output_dir (str): Directory where attachments will be saved. Defaults to 'attachments'.
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
                attachment_path = os.path.join(output_dir, filename)
                with open(attachment_path, 'wb') as fp:
                    fp.write(part.get_payload(decode=True))
                logging.info(f"Attachment {filename} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to process {eml_file}: {str(e)}")


def extract_msg_attachments(msg_file: str, output_dir: str = 'attachments'):
    """
    Extracts attachments from a .msg file and saves them to the specified output directory.

    Args:
        msg_file (str): Path to the .msg file.
        output_dir (str): Directory where attachments will be saved. Defaults to 'attachments'.
    """
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Open the .msg file
        msg = extract_msg.Message(msg_file)

        # Extract attachments
        for attachment in msg.attachments:
            attachment_name = attachment.longFilename if attachment.longFilename else attachment.shortFilename
            if attachment_name:
                attachment_path = os.path.join(output_dir, attachment_name)
                with open(attachment_path, 'wb') as fp:
                    fp.write(attachment.data)
                logging.info(f"Attachment {attachment_name} saved at {attachment_path}")
    except Exception as e:
        logging.error(f"Failed to process {msg_file}: {str(e)}")


if __name__ == "__main__":
    # Example usage of the functions
    eml_file_path = 'File Processing Failures_ Causes_ Sample Files for Review.eml'
    msg_file_path = 'File Processing Failures_ Causes_ Sample Files for Review.msg'

    # Extract from .eml
    extract_eml_attachments(eml_file_path)

    # Extract from .msg
    extract_msg_attachments(msg_file_path)
