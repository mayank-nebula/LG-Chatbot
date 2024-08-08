def split_image_text_types(docs):
    """Split base64-encoded images, texts, and metadata"""
    global sources, count_restriction
    count_restriction = 0
    b64_images = []
    texts = []
    summary = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                count_restriction += 1
                doc_content = json.loads(doc.page_content)
                title = doc.metadata["Title"]
                link = doc.metadata["source"]
                slide_number = doc.metadata.get("slide_number", "")

                existing_key = next(
                    (k for k in sources.keys() if k.startswith(title)), None
                )

                if existing_key:
                    new_key = existing_key + (
                        f", {slide_number}" if slide_number else ""
                    )
                    sources[new_key] = sources.pop(existing_key)
                else:
                    new_key = f"{title}" + (
                        f" - {slide_number}" if slide_number else ""
                    )
                    sources[new_key] = link

                if looks_like_base64(doc_content["content"]):
                    resized_image = resize_base64_image(
                        doc_content["content"], size=(250, 250)
                    )
                    b64_images.append(resized_image)
                    summary.append(doc_content["summary"])
                else:
                    texts.append(doc_content["content"])
            else:
                continue
