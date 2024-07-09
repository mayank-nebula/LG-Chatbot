def save_chunks(question, text_chunks, image_chunks):
    safe_question = re.sub(r'[^a-zA-Z0-9]', '_', question)  # sanitize question for filename
    folder_path = os.path.join('chunks', safe_question)
    os.makedirs(folder_path, exist_ok=True)

    text_file_name = os.path.join(folder_path, 'text_chunks.json')
    image_file_name = os.path.join(folder_path, 'image_chunks.json')
    
    with open(text_file_name, 'w') as text_file:
        json.dump(text_chunks, text_file)
    
    with open(image_file_name, 'w') as image_file:
        json.dump(image_chunks, image_file)
