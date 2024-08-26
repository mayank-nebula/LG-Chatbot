with open(failed_file_path, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(failed_file_path).st_size == 0:
            csv_writer.writerow(["ID,Name,Path,WebUrl,CreatedDateTime"])
        for failed_file in failed_files:
            csv_writer.writerow([failed_file])

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")



chunk_store_nomal = load_full_docstore(
            os.path.join(os.getcwd(), "docstores_normal_rag")
        )
        main_store_normal = load_existing_docstore(
            os.path.join(os.getcwd(), "GatesVentures_Scientia.pkl")
        )
        main_store_normal.store.update(chunk_store_nomal.store)
        save_full_docstore(
            main_store_normal,
            os.path.join(os.getcwd(), "GatesVentures_Scientia.pkl"),
        )

        chunk_store_summary = load_full_docstore(
            os.path.join(os.getcwd(), "docstores_normal_summary")
        )
        main_store_summary = load_existing_docstore(
            os.path.join(os.getcwd(), "GatesVentures_Scientia_Summary.pkl")
        )
        main_store_summary.store.update(chunk_store_summary.store)
        save_full_docstore(
            main_store_summary,
            os.path.join(os.getcwd(), "GatesVentures_Scientia_Summary.pkl"),
        )
