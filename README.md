def split_image_text_types(docs):
    """Split base64-encoded images, texts, and metadata"""
    global sources, count_restriction, num_of_images
    num_of_images = 0
    count_restriction = 0
    texts = []
    summary = []
    b64_images = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                doc_content = json.loads(doc.page_content)
                link = doc.metadata["source"]
                slide_number = doc.metadata.get("slide_number", "")

                metadata = doc.metadata.get("deliverables_list_metadata")
                title = process_metadata(metadata)
                _, ext = os.path.splitext(title)

                existing_key = next(
                    (k for k in sources.keys() if k.startswith(title)), None
                )

                if existing_key:
                    new_key = existing_key + f", {slide_number}"
                    sources[new_key] = sources.pop(existing_key)
                else:
                    new_key = f"{title} {'-' if slide_number else ''} {slide_number}"
                    sources[new_key] = link

                if looks_like_base64(doc_content["content"]):
                    resized_image = resize_base64_image(
                        doc_content["content"], size=(512, 512)
                    )
                    num_of_images += 1
                    b64_images.append(resized_image)
                    summary.append(doc_content["summary"])
                else:
                    texts.append(doc_content["content"])
            else:
                count_restriction += 1
                continue

    return {"images": b64_images, "texts": texts, "summary": summary}
