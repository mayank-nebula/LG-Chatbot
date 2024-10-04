def extract_email_details_msg(email_field: str):
    """
    Extract names and emails from a given string.

    Args:
    email_field (str): A string containing name and email information,
                       separated by semicolons.

    Returns:
    tuple: Two lists - names and emails.
    """
    entries = email_field.split(";")

    names = []
    emails = []

    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue

        pattern = r"([^<>@\t]+)?[\t ]*<?([^<>\s@]+@[^<>\s@]+)>?"
        match = re.search(pattern, entry)

        if match:
            name, email = match.groups()
            if name and name.strip():
                names.append(name.strip())
            if email:
                emails.append(email.strip())
        else:
            names.append(entry.strip())

    return names, emails


def extract_email_details_eml(parsed_mail, details):
    """Extract names and emails based on the provided field ('to', 'from', 'cc', 'bcc')."""
    details_map = {
        "to": parsed_mail.to,
        "from": parsed_mail.from_,
        "bcc": parsed_mail.bcc,
        "cc": parsed_mail.cc,
    }

    field_data = details_map.get(details, [])

    if field_data:
        names = [name for name, _ in field_data]
        emails = [email for _, email in field_data]
    else:
        names, emails = [], []

    return names, emails


def extract_metadata(
    file_path: str,
    metadata_extraction_prompt: str,
):
    """
    Extract structured and agentic metadata from an email.
    """
    try:
        result = {
            "sent_to_name": [],
            "sent_to_email": [],
            "sent_from_name": [],
            "sent_from_email": [],
            "sent_cc_name": [],
            "sent_cc_email": [],
            "sent_bcc_name": [],
            "sent_bcc_email": [],
        }

        if os.path.splitext(file_path)[1] == ".msg":
            metadata_extract_msg = extract_msg.Message(file_path)
            metadata_json = json.loads(metadata_extract_msg.getJson())

            for field in ["to", "from", "cc", "bcc"]:
                if metadata_json.get(field):
                    result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                        extract_email_details_msg(metadata_json[field])
                    )

            result.update(
                {
                    "subject": metadata_extract_msg.subject,
                    "date": str(metadata_extract_msg.date),
                    "filename": os.path.basename(metadata_extract_msg.filename),
                }
            )
        else:
            parsed_mail = mailparser.parse_from_file(file_path)
            for field in ["to", "from", "cc", "bcc"]:
                result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                    extract_email_details_eml(parsed_mail, field)
                )

            result.update(
                {
                    "subject": parsed_mail.subject,
                    "date": str(parsed_mail.date),
                    "filename": os.path.basename(file_path),
                }
            )

        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt
        agentic_metadata = chain.invoke(metadata_extract_msg.body)

        agentic_metadata_json = json.loads(agentic_metadata.content)
        result.update(agentic_metadata_json)

        return result, None

    except Exception as e:
        logging.error(f"Error extracting metadata from {file_path}: {e}")
        return False, (e)
