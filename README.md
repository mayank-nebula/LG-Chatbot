import os
import logging

import pandas as pd
from dotenv import load_dotenv
from office365.graph_client import GraphClient

import sharepoint_file_acquisition

load_dotenv()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Failed_files.log")),
        logging.StreamHandler(),
    ],
)

site_url = os.getenv("SHAREPOINT_SITE")
drive_id = os.getenv("DRIVE_ID")
parent_dir = os.path.dirname(os.getcwd())


if __name__ == "__main__":
    try:
        token, token_expires_at = sharepoint_file_acquisition.acquire_token_func()
        client = GraphClient(lambda: token)

        failed_files_csv = pd.read_csv("failed_files.csv")
        failed_files_ids = failed_files_csv["ID"]

        site_id = sharepoint_file_acquisition.get_site_id(client, site_url)

        files_metadata = sharepoint_file_acquisition.load_existing_csv_data(
            "files_metadata.csv", "ID"
        )
        deliverables_list_metadata = sharepoint_file_acquisition.load_existing_csv_data(
            "deliverables_list.csv", "FileLeafRef"
        )

        for file_id in failed_files_ids:
            sharepoint_file_acquisition.stream_file_content(
                site_id, drive_id, file_id, files_metadata, deliverables_list_metadata
            )

        sharepoint_file_acquisition.update_and_save_docstore(
            "docstores_normal_rag",
            os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl"),
            os.path.join(os.getcwd(), "backup", "normal"),
        )
        sharepoint_file_acquisition.update_and_save_docstore(
            "docstores_summary_rag",
            os.path.join(
                parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
            ),
            os.path.join(os.getcwd(), "backup", "summary"),
        )
    except Exception as e:
        logging.error(f"An error occurred: {e}")
