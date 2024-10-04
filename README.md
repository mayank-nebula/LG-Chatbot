def extract_email_details_msg(parsed_mail: mailparser, details: str):
    if details == "to":
        names = [name for name, email in parsed_mail.to]
        emails = [email for name, email in parsed_mail.to]
    elif details == "from":
        names = [name for name, email in parsed_mail.from_]
        emails = [email for name, email in parsed_mail.from_]
    elif details == "bcc":
        names = [name for name, email in parsed_mail.bcc]
        emails = [email for name, email in parsed_mail.bcc]
    elif details == "cc":
        names = [name for name, email in parsed_mail.cc]
        emails = [email for name, email in parsed_mail.cc]

    return names, emails


def extract_metadata(
    file_path: str,
    metadata_extraction_prompt: str,
):
    """
    Extract structured and agentic metadata from an email.
    """
    try:
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

        if os.path.splitext(file_path)[1] == ".msg":
            metadata_extract_msg = extract_msg.Message(file_path)
            metadata_json = json.loads(metadata_extract_msg.getJson())

            for field in ["to", "from", "cc", "bcc"]:
                if metadata_json.get(field):
                    result[f"sent_{field}_name"], result[f"sent_{field}_email"] = (
                        extract_email_details_msg(metadata_json[field])
                    )

            result.update(
                {
                    "subject": metadata_extract_msg.subject,
                    "date": str(metadata_extract_msg.date),
                    "filename": os.path.basename(metadata_extract_msg.filename),
                }
            )
        else:
            parsed_mail = mailparser.parse_from_file(file_path)
            result["sent_to_name"], result["sent_to_email"] = extract_email_details_msg(
                parsed_mail, "to"
            )
            result["sent_from_name"], result["sent_from_email"] = (
                extract_email_details_msg(parsed_mail, "from")
            )
            result["sent_cc_name"], result["sent_cc_email"] = extract_email_details_msg(
                parsed_mail, "cc"
            )
            result["sent_bcc_name"], result["sent_bcc_email"] = (
                extract_email_details_msg(parsed_mail, "bcc")
            )

        #
        prompt = ChatPromptTemplate.from_template(metadata_extraction_prompt)
        chain = {"content": lambda x: x} | prompt | llm_gpt
        agentic_metadata = chain.invoke(metadata_extract_msg.body)

        agentic_metadata_json = json.loads(agentic_metadata.content)
        result.update(agentic_metadata_json)

        return result, None

    except Exception as e:
        logging.error(f"Error extracting metadata from {file_path}: {e}")
        return False, (e)
