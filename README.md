# logger_base.py
import logging
from cryptography.fernet import Fernet
from typing import Optional

class EncryptedLogger(logging.Logger):
    """Custom logger class that automatically encrypts all log messages using Fernet"""
    
    _fernet: Optional[Fernet] = None
    _initialized: bool = False
    
    @classmethod
    def initialize_encryption(cls, key: bytes):
        """Initialize encryption with the provided key"""
        if not cls._initialized:
            cls._fernet = Fernet(key)
            cls._initialized = True
    
    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False, stacklevel=1):
        """Override the internal logging method to encrypt messages"""
        if self._fernet and isinstance(msg, str):
            encrypted_data = self._fernet.encrypt(msg.encode())
            msg = encrypted_data.decode()
        super()._log(level, msg, args, exc_info, extra, stack_info, stacklevel)

# Configure logging to use our custom logger class
logging.setLoggerClass(EncryptedLogger)

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.encrypted.log"),
        logging.StreamHandler()
    ]
)

def get_logger(name: str) -> EncryptedLogger:
    """Get a logger instance that automatically encrypts messages"""
    return logging.getLogger(name)

# logger_config.py
from your_key_module import load_key
from logger_base import EncryptedLogger

# Initialize encryption with the key
key = load_key()
EncryptedLogger.initialize_encryption(key)
