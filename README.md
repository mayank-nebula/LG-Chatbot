def extract_fileleafref(json_str):
    # Pattern to match "FileLeafRef" and its value
    pattern = r'"FileLeafRef"\s*:\s*"([^"]*)"'
    
    # Search for the pattern in the string
    match = re.search(pattern, json_str)
    
    if match:
        # If found, return the value
        return match.group(1)
    else:
        # If not found, return None or an appropriate message
        return None
