def process_directory(directory):
    data = []

    # Check for subfolders GPT and LLava
    gpt_path = os.path.join(directory, 'GPT')
    llava_path = os.path.join(directory, 'LLava')
    selected_folder = directory  # Default to the main directory

    if os.path.isdir(gpt_path):
        selected_folder = gpt_path
    elif os.path.isdir(llava_path):
        selected_folder = llava_path

    # Find the text_chunks.json file in the selected folder
    json_files = find_files(selected_folder, 'text_chunks.json')

    for json_file in json_files:
        with open(json_file, 'r') as f:
            text_chunks = json.load(f)

        # Find images in the subdirectory named 'images' within the selected folder
        image_dir = os.path.join(os.path.dirname(json_file), 'images')
        image_files = []
        if os.path.exists(image_dir):
            image_files = glob(os.path.join(image_dir, '*.jpg')) + \
                          glob(os.path.join(image_dir, '*.png'))

        for image_file in image_files:
            data.append({
                'folder_name': os.path.basename(directory),  # Main folder name (xyz)
                'text_chunks': json.dumps(text_chunks),  # Convert dict to string for CSV
                'image': image_file
            })
        
        # Since we only want one entry per xyz folder, we break after processing the first json file
        break

    return data
