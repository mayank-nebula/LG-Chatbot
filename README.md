def split_image_text_types(docs):
    """
    Split base64-encoded images and texts.
    """
    b64_images = []
    texts = []
    
    for doc in docs:
        # Check if the document is of type Document and extract page_content if so
        if isinstance(doc, Document):
            doc = doc.page_content
        
        # Decode the document if it is a bytes object
        if isinstance(doc, bytes):
            doc = doc.decode('utf-8')
        
        if looks_like_base64(doc) and is_image_data(doc):
            resized_image = resize_base64_image(doc, size=(1300, 600))
            b64_images.append(resized_image)
        else:
            texts.append(doc)
    
    return {"images": b64_images, "texts": texts}
