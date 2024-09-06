def ingest_files(file, files_metadata, deliverables_list_metadata):
    logging.info("hi")

    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(
        parent_folder, current_folder, "files_to_ingest"
    )
    failed_files = []

    if os.path.exists(os.path.join(files_to_ingest_folder, file)):

        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        original_file_path = os.path.join(files_to_ingest_folder, file)
        lower_case_file = base_name + lower_ext
        lower_case_path = os.path.join(files_to_ingest_folder, lower_case_file)

        file_was_renamed = False

        if ext.isupper():
            os.rename(original_file_path, lower_case_path)
            file_was_renamed = True
        else:
            lower_case_file = file

        try:
            success = False
            ingestion_error = None  # Initialize ingestion_error

            if lower_case_file.endswith(".pdf"):
                if is_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)  # Raise the returned error message
                else:
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                logging.info(f"{lower_case_file} processed successfully")

            elif lower_case_file.endswith((".ppt", ".pptx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("PPT/PPTX Conversion failed")

            elif lower_case_file.endswith((".doc", ".docx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("DOC/DOCX Conversion failed")

        except Exception as e:
            logging.error(f"Error Processing : {e}")
            failed_files.append({**files_metadata, "IngestionError": ingestion_error or str(e)})

        if file_was_renamed:
            os.rename(lower_case_path, original_file_path)

    failed_file_path = os.path.join(parent_folder, current_folder, "failed_files_1.csv")
    with open(failed_file_path, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(failed_file_path).st_size == 0:
            csv_writer.writerow(["ID", "Name", "Path", "WebUrl", "CreatedDateTime", "IngestionError"])
        for failed_file in failed_files:
            csv_writer.writerow([
                failed_file.get("ID", ""),
                failed_file.get("Name", ""),
                failed_file.get("Path", ""),
                failed_file.get("WebUrl", ""),
                failed_file.get("CreatedDateTime", ""),
                failed_file.get("IngestionError", ""),
            ])

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")
