def remove_section_before_fileleafref(json_str):
    # Remove everything from the start of the object up to "FileLeafRef"
    pattern = r'^\{.*?(?="FileLeafRef")'
    json_str = re.sub(pattern, '{', json_str, flags=re.DOTALL)
    
    # Ensure the resulting string is valid JSON
    try:
        json_obj = json.loads(json_str)
        return json.dumps(json_obj, ensure_ascii=False)
    except json.JSONDecodeError:
        return json_str 
