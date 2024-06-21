import logging
import time

from sharepoint_file_acquisition import sharepoint_file_acquisition

# Configure logging
logging.basicConfig(
    filename='pipeline.log',  # Log file name
    level=logging.INFO,       # Logging level
    format='%(asctime)s - %(message)s'  # Log message format
)

def main():
    """
    Main function to run the pipeline.
    - Logs the start of the pipeline.
    - Calls the function to acquire files from SharePoint.
    - Logs success or failure of the pipeline.
    """
    logging.info('Pipeline started.')
    try:
        # Call the function to acquire files from SharePoint
        sharepoint_file_acquisition()
    except Exception as e:
        # Log any exceptions that occur during the pipeline execution
        logging.error(f'Pipeline failed: {e}')
    else:
        # Log successful completion of the pipeline
        logging.info('Pipeline completed.')

if __name__ == '__main__':
    # Run the main function if the script is executed directly
    main()
