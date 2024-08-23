def sanitize_json_string(json_str):
    # Replace single quotes with double quotes for general JSON compatibility
    json_str = re.sub(r"'", r'"', json_str)

    # Ensure that keys are properly quoted
    json_str = re.sub(r'(\w+):', r'"\1":', json_str)

    # Handle special characters in the _etag field
    # Specifically match the _etag field and replace its content
    json_str = re.sub(
        r'"_etag":\s*"""(.*?)"""', 
        lambda m: f'"_etag": "{m.group(1).replace(",", "\\,").replace("\\", "\\\\")}"',
        json_str
    )

    return json_str
