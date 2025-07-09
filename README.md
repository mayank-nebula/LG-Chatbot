def split_image_text_types(docs, sources, prompt_container, extra_sources) -> Dict[str, List[str]]:
    texts = []
    summary = []
    b64_images = []

    for doc in docs:
        decoded_doc = doc.decode("utf-8")
        final_doc = json.loads(decoded_doc)

        doc_content = final_doc["page_content"]
        metadata = final_doc["metadata"]

        slide_number = metadata.get("slide_number", "")
        id = metadata.get("id")

        title = metadata.get("title", "")
        _, ext = os.path.splitext(title)

        if ext in [".pdf", ".doc", ".docx", ".ppt", ".pptx"]:
            filename = metadata.get("filename") 
            if filename and filename not in extra_sources:
                extra_sources[filename] = id

        if ext.lower() in [".pdf", ".doc", ".docx"]:
            slide_number = slide_number.replace("slide_", "Page ")
        elif ext.lower() in [".ppt", ".pptx"]:
            slide_number = slide_number.replace("slide_", "Slide ")

        existing_key = next((k for k in sources.keys() if k.startswith(title)), None)
        if existing_key:
            formatted_name = f", {slide_number}" if slide_number else ""
            new_key = existing_key + formatted_name
            sources[new_key] = sources.pop(existing_key)
        else:
            new_key = f"{title}{' :references: ' if slide_number else ''}{slide_number}"
            sources[new_key] = id

        if looks_like_base64(doc_content):
            resized_image = resize_base64_image(doc_content, size=(512, 512))
            b64_images.append(resized_image)
            summary.append(final_doc["summary"])
            prompt_container[title] = final_doc["summary"]
        else:
            texts.append(doc_content)
            prompt_container[title] = doc_content

    return {"images": b64_images, "texts": texts, "summary": summary}
