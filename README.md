def extract_metadata(metadata: dict, file_path: str):
    metadata_extract_msg = extract_msg.Message(file_path)
    metadata_json = json.loads(metadata_extract_msg.getJson())

    pattern = r"([\w\s]+)\s*<([^>]+)>"

    if metadata_json["to"]:
        matches_to = re.findall(pattern, metadata_json["to"])
        sent_to_name = [match[0].strip() for match in matches_to]
        sent_to_email = [match[1].strip() for match in matches_to]

    if metadata_json["from"]:
        matches_from = re.findall(pattern, metadata_json["to"])
        sent_from_name = [match[0].strip() for match in matches_from]
        sent_from_email = [match[1].strip() for match in matches_from]

    if metadata_json["cc"]:
        matches_cc = re.findall(pattern, metadata_json["to"])
        sent_cc_name = [match[0].strip() for match in matches_cc]
        sent_cc_email = [match[1].strip() for match in matches_cc]

    if metadata_json["bcc"]:
        matches_bcc = re.findall(pattern, metadata_json["to"])
        sent_bcc_name = [match[0].strip() for match in matches_bcc]
        sent_bcc_email = [match[1].strip() for match in matches_bcc]
