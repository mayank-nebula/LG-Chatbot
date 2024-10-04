def extract_email_details_msg(parsed_mail: Union[mailparser.MailParser, dict], details: str) -> Tuple[List[str], List[str]]:
    """Extract names and emails based on the provided field ('to', 'from', 'cc', 'bcc')."""
    details_map = {
        "to": parsed_mail.to,
        "from": parsed_mail.from_,
        "bcc": parsed_mail.bcc,
        "cc": parsed_mail.cc
    }

    field_data = details_map.get(details, [])
    
    if field_data:  # Ensure field_data is not empty
        names = [name for name, email in field_data]
        emails = [email for name, email in field_data]
    else:
        names, emails = [], []
    
    return names, emails
