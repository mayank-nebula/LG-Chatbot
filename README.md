import re
import json
import extract_msg

def extract_email_details(email_field):
    """Helper function to extract names and emails from a field."""
    pattern = r"([\w\s]+)\s*<([^>]+)>"
    matches = re.findall(pattern, email_field)
    names = [match[0].strip() for match in matches]
    emails = [match[1].strip() for match in matches]
    return names, emails

def extract_metadata(metadata: dict, file_path: str):
    # Load the message and convert to JSON
    metadata_extract_msg = extract_msg.Message(file_path)
    metadata_json = json.loads(metadata_extract_msg.getJson())

    # Initialize result dictionary to store all metadata
    result = {
        "sent_to_name": [],
        "sent_to_email": [],
        "sent_from_name": [],
        "sent_from_email": [],
        "sent_cc_name": [],
        "sent_cc_email": [],
        "sent_bcc_name": [],
        "sent_bcc_email": []
    }

    # Extract 'to' field
    if metadata_json.get("to"):
        result["sent_to_name"], result["sent_to_email"] = extract_email_details(metadata_json["to"])

    # Extract 'from' field
    if metadata_json.get("from"):
        result["sent_from_name"], result["sent_from_email"] = extract_email_details(metadata_json["from"])

    # Extract 'cc' field
    if metadata_json.get("cc"):
        result["sent_cc_name"], result["sent_cc_email"] = extract_email_details(metadata_json["cc"])

    # Extract 'bcc' field
    if metadata_json.get("bcc"):
        result["sent_bcc_name"], result["sent_bcc_email"] = extract_email_details(metadata_json["bcc"])

    return result
