def generate_img_summaries(path, deliverables_list_metadata):
    image_summaries = {}
    img_base64_list = {}
    prompt = """use this image to extract and analyze the information thoroughly"""
    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)
            title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
            abstract = deliverables_list_metadata["Abstract"]

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=30)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False
            image_summaries[img_name] = (
                f"Title : {title}\nAbstract : {abstract}\nSummary : {summary}"
            )
    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries
