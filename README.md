pattern = r"([\w\s]*)\s*<([^>]*)>"
    
    # Find all matches
    matches = re.findall(pattern, email_field)
    
    # Extract names and emails, handling cases where either might be empty
    names = [match[0].strip() if match[0].strip() else None for match in matches]
    emails = [match[1].strip() if match[1].strip() else None for match in matches]
    
    # If no matches found, check if the input is just an email or just a name
    if not matches:
        if '@' in email_field and not email_field.startswith('<'):
            emails = [email_field.strip()]
            names = [None]
        else:
            names = [email_field.strip()]
            emails = [None]
