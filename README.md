def process_ppt_pptx(ppt_file, files_metadata, failed_files):
    """
    Handle PPT/PPTX ingestion by converting to PDF first.

    :param ppt_file: Name of the PPT/PPTX file
    :param files_metadata: Metadata of the PPT/PPTX file
    :param failed_files: List to track failed file metadata
    """
    pdf_name = os.path.splitext(ppt_file)[0] + ".pdf"
    try:
        if convert_file_to_pdf(FILES_TO_INGEST_FOLDER, ppt_file):
            success, error = pdf_ppt_ingestion_MV(pdf_name, files_metadata)
            if success:
                os.remove(os.path.join(FILES_TO_INGEST_FOLDER, pdf_name))
                logging.info(f"{ppt_file} processed successfully")
            else:
                handle_ingestion_failure(
                    ppt_file,
                    error,
                    failed_files,
                    os.remove(os.path.join(FILES_TO_INGEST_FOLDER, pdf_name)),
                )
        else:
            raise Exception(f"Failed to convert {ppt_file} to PDF.")
    except Exception as e:
        failed_files.append({**files_metadata, "IngestionError": str(e)})
