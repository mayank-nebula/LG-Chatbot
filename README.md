for index, row in failed_files_csv.iterrows():
            file_id = row["ID"]
            try:
                # Attempt to process the file.
                sharepoint_file_acquisition.stream_file_content(
                    site_id, drive_id, file_id, files_metadata, deliverables_list_metadata
                )
                # If successful, log the success.
                logging.info(f"Successfully processed file {file_id}")
                
                # Remove the row corresponding to the successfully processed file.
                failed_files_csv.drop(index, inplace=True)

                # Save the updated CSV file after each successful processing.
                failed_files_csv.to_csv("failed_files.csv", index=False)
                logging.info(f"File {file_id} removed from 'failed_files.csv'.")
            except Exception as e:
                # Log an error for files that fail to process.
                logging.error(f"Failed to process file {file_id}: {e}")
