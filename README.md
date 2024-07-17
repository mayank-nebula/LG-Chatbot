def process_directory(directory):
    data = []
    # Check for subfolders GPT and LLava
    gpt_path = os.path.join(directory, 'GPT')
    llava_path = os.path.join(directory, 'LLava')
    subfolders = [directory]  # Start with the main directory

    if os.path.isdir(gpt_path):
        subfolders.append(gpt_path)
    if os.path.isdir(llava_path):
        subfolders.append(llava_path)

    for subfolder in subfolders:
        # Find all text_chunks.json files in the subfolder
        json_files = find_files(subfolder, 'text_chunks.json')

        for json_file in json_files:
            with open(json_file, 'r') as f:
                text_chunks = json.load(f)

            # Find images in the subfolder or in a subdirectory named 'images' within the subfolder
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

    return data

def main(root_directory):
    all_data = []

    # Process each subfolder in the root directory
    for subfolder in next(os.walk(root_directory))[1]:
        subfolder_path = os.path.join(root_directory, subfolder)
        all_data.extend(process_directory(subfolder_path))

    # Create a DataFrame and write to CSV
    df = pd.DataFrame(all_data)
    df.to_csv('output.csv', index=False)
