import os
import json
import base64
import re
import imghdr

def save_image(base64_string, file_path):
    img_data = base64.b64decode(base64_string)
    with open(file_path, 'wb') as file:
        file.write(img_data)

def process_existing_data(base_dir):
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file == 'image_chunks.json':
                json_path = os.path.join(root, file)
                with open(json_path, 'r') as f:
                    image_chunks = json.load(f)

                # Determine the directory to save the images
                for idx, img_data in enumerate(image_chunks):
                    # Determine the correct file extension
                    extension = imghdr.what(None, base64.b64decode(img_data))
                    if not extension:
                        extension = 'png'  # Default to png if type detection fails
                    
                    image_file_name = f"image_{idx + 1}.{extension}"
                    image_path = os.path.join(root, image_file_name)
                    save_image(img_data, image_path)
                
                # Remove the image_chunks.json file after processing
                os.remove(json_path)

if __name__ == "__main__":
    base_directory = 'chunks'  # Starting directory
    process_existing_data(base_directory)
    print("Conversion complete.")
