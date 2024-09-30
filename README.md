from langchain_community.document_loaders import OutlookMessageLoader

loader = OutlookMessageLoader("File Processing Failures_ Causes_ Sample Files for Review.msg")

data = loader.load()

# import os
# import email
from email import policy
from email.parser import BytesParser

def extract_eml_attachments(eml_file):
    # Open and read the .eml file
    with open(eml_file, 'rb') as f:
        msg = BytesParser(policy=policy.default).parse(f)
    
    # Loop through email parts and find attachments
    for part in msg.iter_attachments():
        filename = part.get_filename()
        if filename:
            # Save the attachment
            with open(filename, 'wb') as fp:
                fp.write(part.get_payload(decode=True))
            print(f'Attachment {filename} saved')

# Example usage
extract_eml_attachments('File Processing Failures_ Causes_ Sample Files for Review.msg')

import extract_msg
import os

def extract_msg_attachments(msg_file):
    # Open the .msg file
    msg = extract_msg.Message(msg_file)
    
    # Extract attachments
    for attachment in msg.attachments:
        attachment_name = attachment.longFilename if attachment.longFilename else attachment.shortFilename
        if attachment_name:
            # Save the attachment
            with open(attachment_name, 'wb') as fp:
                fp.write(attachment.data)
            print(f'Attachment {attachment_name} saved')

# Example usage
extract_msg_attachments('File Processing Failures_ Causes_ Sample Files for Review.msg')

