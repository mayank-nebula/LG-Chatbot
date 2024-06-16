import logging
import time

# Configure logging
logging.basicConfig(filename='pipeline.log', level=logging.INFO, format='%(asctime)s - %(message)s')

def main():
    logging.info('Pipeline started.')
    # Your pipeline code here
    for i in range(100):  # Example loop to simulate progress
        logging.info(f'Step {i+1}/100 completed.')
        time.sleep(1)  # Simulate work
    logging.info('Pipeline completed.')

if __name__ == '__main__':
    main()
