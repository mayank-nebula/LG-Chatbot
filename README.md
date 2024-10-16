import logging
from cryptography.fernet import Fernet
from typing import Optional
from your_key_module import load_key

class EncryptedLogger(logging.Logger):
    """Custom logger class that automatically encrypts all log messages using Fernet"""
    
    _fernet: Optional[Fernet] = None
    _initialized: bool = False
    
    @classmethod
    def _ensure_initialized(cls):
        """Initialize encryption if not already done"""
        if not cls._initialized:
            key = load_key()
            cls._fernet = Fernet(key)
            cls._initialized = True
    
    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False, stacklevel=1):
        """Override the internal logging method to encrypt messages"""
        self._ensure_initialized()
        if isinstance(msg, str):
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
