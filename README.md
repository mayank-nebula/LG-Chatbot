def remove_section_before_fileleafref(json_str):
    pattern = r'^\{.*?(?="FileLeafRef")'
    json_str = re.sub(r"'", r'"', json_str)
    json_str = re.sub(pattern, "{", json_str, flags=re.DOTALL)

    return json_str


def extract_fileleafref(json_str):
    pattern = r'"FileLeafRef"\s*:\s*"([^"]*)"'

    match = re.search(pattern, json_str)

    if match:
        return match.group(1)
    else:
        return None

metadata_sanitized = remove_section_before_fileleafref(metadata)
full_name_file = extract_fileleafref(metadata_sanitized)
title, ext = os.path.splitext(full_name_file)
