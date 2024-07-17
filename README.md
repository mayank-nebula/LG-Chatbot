def main(directory):
    data = []

    # Find all text_chunks.json files
    json_files = find_files(directory, 'text_chunks.json')

    for json_file in json_files:
        with open(json_file, 'r') as f:
            text_chunks = json.load(f)

        # Find images in the same directory as the json file or in a subdirectory named 'images'
        image_files = glob(os.path.join(os.path.dirname(json_file), '*.jpg')) + \
                      glob(os.path.join(os.path.dirname(json_file), '*.png')) + \
                      find_files(os.path.dirname(json_file), 'images/*.jpg') + \
                      find_files(os.path.dirname(json_file), 'images/*.png')

        for image_file in image_files:
            data.append({
                'text_chunks': text_chunks,
                'image': image_file
            })

    # Create a DataFrame and write to CSV
    df = pd.DataFrame(data)
    df.to_csv('output.csv', index=False)

if __name__ == "__main__":
    directory = input("Enter the path to the directory: ")
    main(directory)
