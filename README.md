def clean_etag(match):
        etag_content = match.group(1)
        # Escape commas and backslashes within the _etag field content
        sanitized_etag = etag_content.replace(",", "\\,").replace("\\", "\\\\")
        return '"_etag": "' + sanitized_etag + '"'
    
    # Apply the cleaning to the _etag field
    json_str = re.sub(r'"_etag":\s*"""(.*?)"""', clean_etag, json_str)

    return json_str
