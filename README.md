file_handler = logging.handlers.RotatingFileHandler('pipeline.log', maxBytes=10**7, backupCount=5)
console_handler = logging.StreamHandler()

# Set log format
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)
