def process_metadata(metadata):
    # Replace single quotes with double quotes
    metadata = re.sub(r"'", r'"', metadata)
    
    # Remove everything before "FileLeafRef" and extract its value
    pattern = r'.*?"FileLeafRef"\s*:\s*"([^"]*)"'
    match = re.search(pattern, metadata, re.DOTALL)
    
    if match:
        return match.group(1)
    else:
        return None
