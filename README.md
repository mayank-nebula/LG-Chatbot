import os
import logging
import pandas as pd
from dotenv import load_dotenv
from office365.graph_client import GraphClient

import sharepoint_file_acquisition

# Load environment variables from a .env file, which contains sensitive information like API keys.
load_dotenv()

# Configure logging to log both to a file ('Failed_files.log') and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Failed_files.log")),
        logging.StreamHandler(),
    ],
)

# Load SharePoint site URL and drive ID from environment variables.
site_url = os.getenv("SHAREPOINT_SITE")
drive_id = os.getenv("DRIVE_ID")
# Get the parent directory of the current working directory.
parent_dir = os.path.dirname(os.getcwd())

if __name__ == "__main__":
    try:
        # Acquire an authentication token for Microsoft Graph API using a function from 'sharepoint_file_acquisition'.
        token, token_expires_at = sharepoint_file_acquisition.acquire_token_func()
        # Initialize the Graph API client using the acquired token.
        client = GraphClient(lambda: token)

        # Read the 'failed_files.csv' to get a list of file IDs that failed to process earlier.
        failed_files_csv = pd.read_csv("failed_files.csv")
        failed_files_ids = failed_files_csv["ID"]

        # Retrieve the SharePoint site ID using the site URL.
        site_id = sharepoint_file_acquisition.get_site_id(client, site_url)

        # Load metadata for files and deliverables from existing CSV files.
        files_metadata = sharepoint_file_acquisition.load_existing_csv_data(
            "files_metadata.csv", "ID"
        )
        deliverables_list_metadata = sharepoint_file_acquisition.load_existing_csv_data(
            "deliverables_list.csv", "FileLeafRef"
        )

        # Iterate over the list of failed file IDs and attempt to reprocess them.
        for file_id in failed_files_ids:
            sharepoint_file_acquisition.stream_file_content(
                site_id, drive_id, file_id, files_metadata, deliverables_list_metadata
            )

        # Update and save the document stores (normal and summary) after reprocessing the failed files.
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
        # Log an error message if an exception occurs during the process.
        logging.error(f"An error occurred: {e}")
