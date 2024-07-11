def split_image_text_types(docs):
    global global_sources, global_sources_link, global_ids, global_text_chunks, global_image_chunks
    b64_images, texts = [], []
    sources, sources_link, sources_ids = set(), set(), set()
    for doc in docs:
        if isinstance(doc, Document):
            sources.add(doc.metadata["Title"])
            sources_link.add(doc.metadata["source"])
            sources_ids.add(doc.metadata["id"])
            doc = doc.page_content
        if looks_like_base64(doc) and is_image_data(doc):
            doc = resize_base64_image(doc, size=(1300, 600))
            b64_images.append(doc)
        else:
            texts.append(doc)
    global_sources = list(sources)
    global_sources_link = list(sources_link)
    global_ids = list(sources_ids)
    global_text_chunks = texts
    global_image_chunks = b64_images
    return {"images": b64_images, "texts": texts}
