def main(directory):
    data = []

    # Find all text_chunks.json files in the directory and its subdirectories
    json_files = find_files(directory, 'text_chunks.json')

    for json_file in json_files:
        with open(json_file, 'r') as f:
            text_chunks = json.load(f)

        # Get the folder name containing the text_chunks.json file
        folder_name = os.path.basename(os.path.dirname(json_file))

        # Find images in the subdirectory named 'images' within the same directory as the json file
        image_dir = os.path.join(os.path.dirname(json_file), 'images')
        image_files = []
        if os.path.exists(image_dir):
            image_files = glob(os.path.join(image_dir, '*.jpg')) + \
                          glob(os.path.join(image_dir, '*.png'))

        for image_file in image_files:
            data.append({
                'folder_name': folder_name,
                'text_chunks': json.dumps(text_chunks),  # Convert dict to string for CSV
                'image': image_file
            })

    # Create a DataFrame and write to CSV
    df = pd.DataFrame(data)
    df.to_csv('output.csv', index=False)
