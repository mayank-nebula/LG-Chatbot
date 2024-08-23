pattern = r'"__etag":.*?(?=,"FileLeafRef")'
    json_str = re.sub(pattern, '', json_str)
    
    # Remove any extra comma that might be left
    json_str = re.sub(r',\s*,', ',', json_str)
    
    return json_str
