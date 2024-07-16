for file in os.listdir("files_to_ingest"):
    file_name, ext = os.path.splitext(file)
    if ext == ".ppt" or ext == ".pptx":
        combined_summary = extract_content("summary", file_name)
    elif ext == ".doc" or ext == ".docx":
        combined_summary = extract_content("content", file_name)
    elif ext == ".pdf":
        if is_pdf("files_to_ingest", file):
            combined_summary = extract_content("content", file_name)
        else:
            combined_summary = extract_content("summary", file_name)

    combined_summary_by_title[file_name] = combined_summary

with open("combined_summary_by_title.json", "w") as file:
    json.dump(combined_summary_by_title, file, indent=4)
