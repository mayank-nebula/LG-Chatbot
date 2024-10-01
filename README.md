def convert_file_to_pdf(fpath, fname):
    """
    Convert a file to PDF using LibreOffice's headless mode.

    :param fpath: Path to the folder containing the file
    :param fname: Name of the file to convert
    :return: True if conversion was successful, False otherwise
    """
    try:
        pdf_fname = os.path.splitext(fname)[0] + ".pdf"
        pdf_file = os.path.join(fpath, pdf_fname)
        subprocess.run(
            [
                LIBREOFFICE_PATH,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                fpath,
                os.path.join(fpath, fname),
            ],
            timeout=CONVERSION_TIMEOUT,
        )
        if os.path.exists(pdf_file):
            logging.info(f"PDF file created: {pdf_file}")
            return True
        else:
            logging.error("PDF file was not created.")
            return False
    except subprocess.TimeoutExpired:
        logging.error(f"Conversion of {fname} timed out.")
    except Exception as e:
        logging.error(f"An error occurred during conversion: {e}")
    return False
