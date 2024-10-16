import logging
from cryptography.fernet import Fernet

# Assuming this is your encryption function
def load_key() -> bytes:
    # Load your key here
    return b'your-fernet-key'

def encrypt_string(plain_text: str) -> str:
    key = load_key()
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(plain_text.encode())
    return encrypted_data.decode()

# Custom formatter that encrypts log messages
class EncryptedFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        # Get the original log message
        original_message = super().format(record)
        # Encrypt the message
        encrypted_message = encrypt_string(original_message)
        return encrypted_message

# Configure the logging
def setup_logger():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)  # Set the logging level (INFO, DEBUG, etc.)

    # Create file handler and console handler
    file_handler = logging.FileHandler("app.log")
    console_handler = logging.StreamHandler()

    # Use the encrypted formatter
    formatter = EncryptedFormatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# Function to get logger in other modules
def get_logger(name: str) -> logging.Logger:
    setup_logger()  # Ensure logger is set up
    return logging.getLogger(name)

# Example usage
if __name__ == "__main__":
    logger = get_logger(__name__)
    logger.info("This is an info message")
    logger.debug("This is a debug message")
    logger.error("This is an error message")
