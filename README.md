def extract_email_details(email_field: str):
    """
    Extract names and emails from a given string.
    
    Args:
    email_field (str): A string containing name and email information,
                       separated by semicolons.
    
    Returns:
    tuple: Two lists - names and emails.
    """
    # Split the input string by semicolons
    entries = email_field.split(';')
    
    names = []
    emails = []
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Pattern to match name and email, allowing for tab or space separation
        # and optional angle brackets
        pattern = r'([^<>@\t]+)?[\t ]*<?([^<>\s@]+@[^<>\s@]+)>?'
        match = re.search(pattern, entry)
        
        if match:
            name, email = match.groups()
            names.append(name.strip() if name and name.strip() else None)
            emails.append(email.strip())
        else:
            # If no match, assume it's just a name
            names.append(entry.strip())
            emails.append(None)
    
    return names, emails
