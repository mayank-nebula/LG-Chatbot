json_str = re.sub(r',?\s*"_etag":\s*""".*?"""', '', json_str)
    
    # Remove any trailing comma before closing brace that might be left after removal
    json_str = re.sub(r',\s*}', '}', json_str)
