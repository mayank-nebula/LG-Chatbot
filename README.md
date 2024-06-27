def custom_write_image(image, output_image_path):
    max_size = 65500
    try:
        # Check image size
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_size_kb = len(img_byte_arr.getvalue()) / 1024
        
        if img_size_kb < 20:
            print(f"Skipping image because its size is {img_size_kb} KB which is less than 20 KB.")
            return

        width, height = image.size
        if width > max_size or height > max_size:
            print(f"Resizing image from ({width}, {height}) to fit within ({max_size}, {max_size})")
            if width > height:
                new_width = max_size
                new_height = int((max_size / width) * height)
            else:
                new_height = max_size
                new_width = int((max_size / height) * width)
            image = image.resize((new_width, new_height), Image.LANCZOS)
        
        image.save(output_image_path)
    except OSError as e:
        print(f"Failed to save resized image: {e}")
    except UnidentifiedImageError as e:
        print(f"Failed to identify image: {e}")

# Monkey-patch the write_image function
pdf_image_utils.write_image = custom_write_image

def extract_pdf_elements(path, fname):
    """
    Extract images, tables, and chunk text from a PDF file.
    path: File path, which is used to dump images (.jpg)
    fname: File name
    """
    try:
        return partitio
