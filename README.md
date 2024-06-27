def generate_img_summaries():
    """
    Generate image summaries and base64 encoded strings for images.

    Returns:
        tuple: Tuple containing lists of base64 encoded images and their summaries.
    """
    img_base64_list = []
    image_summaries = []
    prompt = """You are an assistant tasked with summarizing images for retrieval. \
    These summaries will be embedded and used to retrieve the raw image. \
    Give a concise summary of the image that is well optimized for retrieval."""
    
    start_time = time.time()
    timeout = 1800  # 30 minutes in seconds

    for img_file in os.listdir("figures"):
        if time.time() - start_time > timeout:
            logging.error("Timeout while generating image summaries.")
            return False

        if img_file.endswith(".jpg"):
            try:
                img_path = os.path.join("figures", img_file)
                base64_image = encode_image(img_path)
                img_base64_list.append(base64_image)
                
                # Check time before making the LLM request
                if time.time() - start_time > timeout:
                    logging.error("Timeout before sending LLM request.")
                    return False

                # Use concurrent.futures to set a timeout for the image_summarize call
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(image_summarize, base64_image, prompt)
                    try:
                        summary = future.result(timeout=1800 - (time.time() - start_time))
                    except concurrent.futures.TimeoutError:
                        logging.error("Timeout during LLM request.")
                        return False

                # Check time after making the LLM request
                if time.time() - start_time > timeout:
                    logging.error("Timeout after receiving LLM response.")
                    return False

                image_summaries.append(summary)
            except Exception as e:
                logging.error(f"Error while generating image summaries: {e}")
                return False

    return img_base64_list, image_summaries
