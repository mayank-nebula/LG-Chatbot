def split_image_text_types(docs):
    """
    Split base64-encoded images and texts
    """
    b64_images = []
    texts = []
    for doc in docs:
        # Check if the document is of type Document and extract page_content if so
        if isinstance(doc, Document):
            doc = doc.page_content
        if looks_like_base64(doc) and is_image_data(doc):
            decoded_string = doc.decode('utf-8')
            doc = resize_base64_image(decoded_string, size=(1300, 600))
            b64_images.append(doc)
        else:
            print(doc)
            decoded_string = doc.decode('utf-8')
            print(decoded_string)
            texts.append(decoded_string)
    return {"images": b64_images, "texts": texts}
