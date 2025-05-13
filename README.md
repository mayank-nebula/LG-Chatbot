import logging
from logging.handlers import TimedRotatingFileHandler
from datetime import datetime
import os


class HttpxLevelFilter(logging.Filter):
    """
    Filters httpx logs to only WARNING and ERROR.
    Allows all other loggers' logs.
    """
    def filter(self, record):
        if record.name.startswith("httpx") or record.name.startswith("http"):
            return record.levelno >= logging.WARNING
        return True  # Allow all other logs


class DailyLogFileHandler(TimedRotatingFileHandler):
    """
    Custom handler that creates a new log file each day with the date in the filename,
    rather than rotating the existing file with a suffix.
    """
    def __init__(self, log_dir, category=None, backupCount=7, encoding='utf-8'):
        self.log_dir = log_dir
        self.category = category
        
        # Create category subdirectory if provided
        if category:
            self.log_dir = os.path.join(log_dir, category)
            
        # Make sure the directory exists before defining the base_filename
        os.makedirs(self.log_dir, exist_ok=True)
            
        self.base_filename = os.path.join(self.log_dir, "{date}.log")
        
        # Create the initial filename with today's date
        current_date = datetime.now().strftime("%d-%m-%Y")
        filename = self.base_filename.format(date=current_date)
        
        super().__init__(
            filename=filename,
            when='midnight',
            interval=1,
            backupCount=backupCount,
            encoding=encoding,
            utc=True
        )
        self.suffix = ""  # We don't want a suffix as we're using date in the base name
    
    def doRollover(self):
        """
        Override the rollover method to create a new file with the next day's date,
        rather than renaming the current file.
        """
        # Close the current file if it's open
        if self.stream:
            self.stream.close()
            self.stream = None
        
        # Calculate the current day's date (not next day)
        current_date = datetime.now().strftime("%d-%m-%Y")
        self.baseFilename = self.base_filename.format(date=current_date)
        
        # Force creation of a new file
        if self.encoding:
            self.stream = open(self.baseFilename, "a", encoding=self.encoding)
        else:
            self.stream = open(self.baseFilename, "a")
            
        # Reset rotation timer
        self.rolloverAt = self.computeRollover(datetime.now())
        
        # Remove old log files if backupCount is exceeded
        if self.backupCount > 0:
            try:
                # Get all log files in directory (ensure directory exists)
                if not os.path.exists(self.log_dir):
                    return
                    
                files = [f for f in os.listdir(self.log_dir) if f.endswith('.log')]
                # Parse the dates from filenames for proper sorting
                dated_files = []
                for f in files:
                    try:
                        # Extract date from filename (without .log extension)
                        date_str = f.replace('.log', '')
                        file_date = datetime.strptime(date_str, "%d-%m-%Y")
                        dated_files.append((f, file_date))
                    except ValueError:
                        # Skip files that don't match our date format
                        continue
                    
                # Sort by date, newest first
                dated_files.sort(key=lambda x: x[1], reverse=True)
                
                # Remove files beyond the backup count
                for old_file, _ in dated_files[self.backupCount:]:
                    try:
                        os.remove(os.path.join(self.log_dir, old_file))
                    except (OSError, IOError) as e:
                        # Just log this error but don't stop the rotation process
                        # We can't use the logger here to avoid circular references
                        print(f"Error removing old log file {old_file}: {str(e)}")
            except Exception as e:
                # Catch any errors during cleanup to ensure rotation still works
                print(f"Error during log rotation cleanup: {str(e)}")


class LoggerManager:
    """
    Singleton class for managing loggers to ensure each logger is initialized only once.
    """
    _instance = None
    _loggers = {}
    _handlers = {}  # Store handlers by log_dir and category

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(LoggerManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, log_dir="logs"):
        if not hasattr(self, '_initialized'):
            self._initialized = True
        
        # Create log directory if it doesn't exist
        self.log_dir = log_dir
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)

    def get_logger(self, name, category=None):
        """
        Returns a logger with the specified name and category.
        Creates it if it doesn't exist.
        
        Args:
            name (str): The name of the logger
            category (str, optional): The category for logs, will create a subdirectory if provided
        
        Returns:
            logging.Logger: Configured logger
        """
        # Use a combination of name, log_dir and category as the key
        logger_key = f"{name}:{self.log_dir}:{category}"
        
        if logger_key in self._loggers:
            return self._loggers[logger_key]

        # Create a new logger
        logger = logging.getLogger(name if not category else f"{name}.{category}")
        logger.setLevel(logging.DEBUG)  # Accept all levels
        
        # Only add handlers if none exist for this logger
        if not logger.handlers:
            # Create our custom daily file handler
            handler_key = f"{self.log_dir}:{category}"
            
            if handler_key not in self._handlers:
                file_handler = DailyLogFileHandler(
                    log_dir=self.log_dir,
                    category=category,
                    backupCount=7,
                    encoding='utf-8'
                )
                
                file_handler.setFormatter(logging.Formatter(
                    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
                ))
                file_handler.addFilter(HttpxLevelFilter())  # Custom filter
                self._handlers[handler_key] = file_handler
            else:
                # Re-use existing handler
                file_handler = self._handlers[handler_key]
                
            logger.addHandler(file_handler)
            logger.propagate = False
        
        # Store the logger
        self._loggers[logger_key] = logger
        return logger


def get_logger(name, log_dir="logs/daily_logs", category=None):
    """
    Convenience function to get a logger using the LoggerManager.
    This maintains compatibility with existing code while adding category support.
    
    Args:
        name (str): Logger name
        log_dir (str, optional): Base directory for logs. Defaults to "logs".
        category (str, optional): Log category, will be a subdirectory. Defaults to None.
    
    Returns:
        logging.Logger: Configured logger
    """
    manager = LoggerManager(log_dir=log_dir)
    return manager.get_logger(name, category=category)

