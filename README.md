row = ",".join([f'"{value}"' if isinstance(value, str) and (',' in value or '[' in value) else value for value in metadata.values()])
