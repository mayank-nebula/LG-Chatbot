def extract_metadata(
    file_path: str,
    metadata_extraction_prompt: str,
):
    """
    Extract structured and agentic metadata from an email.
    """
    try:
        metadata_extract_msg = extract_msg.Message(file_path)
        metadata_json = json.loads(metadata_extract_msg.getJson())

        result = {
            "sent_to_name": [],
            "sent_to_email": [],
            "sent_from_name": [],
            "sent_from_email": [],
            "sent_cc_name": [],
            "sent_cc_email": [],
            "sent_bcc_name": [],
            "sent_bcc_email": [],
        }

        for field in ["to", "from", "cc", "bcc"]:
            if metadata_json.get(field):
                result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                    extract_email_details(metadata_json[field])
                )

        result["subject"] = metadata_extract_msg.subject
        result["date"] = str(metadata_extract_msg.date)
        result["classified"] = metadata_extract_msg.classified
        result["filename"] = os.path.basename(metadata_extract_msg.filename)

        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt
        agentic_metadata = chain.invoke(metadata_extract_msg.body)

        agentic_metadata_json = json.loads(agentic_metadata.content)
        result.update(agentic_metadata_json)

        return result, None

    except Exception as e:
        logging.error(f"Error extracting metadata from {file_path}: {e}")
        return False, (e)
