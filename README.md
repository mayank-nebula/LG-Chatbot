def convert_metadata_to_chroma_format(metadata: dict):
    try:
        new_metadata = {}
        for key, value in metadata.items():
            if isinstance(value, list):
                new_metadata[key] = json.dumps(value)
            elif value is None:
                new_metadata[key] = "null"
            else:
                new_metadata[key] = value

        return new_metadata, None
    except Exception as e:
        logging.error(f"Failed to create metadata: {str(e)}")
        return None, e
