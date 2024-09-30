import os
import email
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
extract_eml_attachments('sample.eml')
