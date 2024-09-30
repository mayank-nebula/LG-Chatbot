def get_long_path(path: str) -> str:
    """
    Convert the file path to long path format if necessary (for Windows).
    """
    if os.name == 'nt' and len(path) > 255:  # Check if the system is Windows and the path is too long
        return f"\\\\?\\{path}"
    return path
