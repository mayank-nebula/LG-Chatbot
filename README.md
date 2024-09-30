import os
import logging
from pathlib import Path

def get_long_path(path: str) -> str:
    """
    Add the '\\\\?\\' prefix to the path if it's a Windows system
    and the path length exceeds the standard limit.
    """
    if os.name == 'nt' and len(path) > 255:  # Check if system is Windows and path is too long
        return f"\\\\?\\{path}"
    return path

async def process_file(file_path: Path):
    """
    Process the file based on its type (eml or msg) and retrieve attachments.
    """
    # Convert to long path format if necessary
    file_path_str = get_long_path(str(file_path))
    output_dir = Path(file_path_str).parent / Path(file_path_str).stem  # Use the long path

    # Ensure the directory is created
    output_dir.mkdir(parents=True, exist_ok=True)

    if file_path.suffix == ".msg":
        logging.info(f"Processing .msg file: {file_path}")
        extract_msg_attachments(file_path_str, str(output_dir))
    elif file_path.suffix == ".eml":
        logging.info(f"Processing .eml file: {file_path}")
        extract_eml_attachments(file_path_str, str(output_dir))
    else:
        logging.info(f"Skipping unsupported file type: {file_path}")

    logging.info(f"Finished processing file: {file_path}")
