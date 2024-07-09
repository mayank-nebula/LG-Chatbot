def save_chunks(question, text_chunks, image_chunks, model_type):
    safe_question = re.sub(r'[^a-zA-Z0-9]', '_', question)  # sanitize question for filename
    base_folder = os.path.join('chunks', safe_question, model_type)
    os.makedirs(base_folder, exist_ok=True)

    text_file_name = os.path.join(base_folder, 'text_chunks.json')
    image_file_name = os.path.join(base_folder, 'image_chunks.json')
    
    with open(text_file_name, 'w') as text_file:
        json.dump(text_chunks, text_file)
    
    with open(image_file_name, 'w') as image_file:
        json.dump(image_chunks, image_file)
