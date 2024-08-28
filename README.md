def append_to_dict(dict, key, value, metadata):
    if key not in dict:
        dict[key] = {"page_content": "", "metadata": metadata}
    dict[key]["page_content"] = value
