import logging
import time

from sharepoint_file_acquistion import sharepoint_file_acquisition

# Configure logging
logging.basicConfig(filename='pipeline.log', level=logging.INFO, format='%(asctime)s - %(message)s')

def main():
    logging.info('Pipeline started.')
    try:
        # print('hello')
        sharepoint_file_acquisition()
    except Exception as e:
        logging.info(f'Pipeline failed {e}')
    else:
        logging.info('Pipeline completed.')

if __name__ == '__main__':
    main()
