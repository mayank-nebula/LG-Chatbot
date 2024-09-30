def sanitize_filename(filename: str) -> str:
    """Sanitize the filename by removing special characters and replacing spaces."""
    return re.sub(r'[^\w\s-]', '', filename).replace(' ', '_')
