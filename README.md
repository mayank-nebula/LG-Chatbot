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
extract_msg_attachments('sample.msg')
