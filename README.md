def is_pdf(fpath, fname):
    try:
        with open_pdf(os.path.join(fpath, fname)) as pdf:
            page_layouts = set((page.width, page.height) for page in pdf.pages)
            if len(page_layouts) == 1:
                width, height = next(iter(page_layouts))
                aspect_ratio = width / height
                if aspect_ratio > 1:
                    logging.info("PPT converted to PDF")
                    return False
        logging.info("Original PDF")
        return True
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False
