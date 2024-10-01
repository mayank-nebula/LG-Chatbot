pattern = r'([^<>]+)?<([^<>]+)>'
    matches = re.findall(pattern, email_field)
    
    names = []
    emails = []
    
    if matches:
        for name, email in matches:
            names.append(name.strip() if name.strip() else None)
            emails.append(email.strip() if email.strip() else None)
    else:
        # If no matches, check if it's just an email or just a name
        if '@' in email_field and '<' not in email_field:
            names.append(None)
            emails.append(email_field.strip())
        else:
            names.append(email_field.strip())
            emails.append(None)
    
    return names, emails
