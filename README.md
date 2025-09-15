def parse_line(line, num_columns):
    """
    Parse a row string into exactly num_columns fields.
    - Fields separated by commas
    - Fields may contain commas but always end with '.' (when malformed)
    - Empty fields marked as '--' become ''
    - Handles both malformed (with periods) and proper CSV format
    """
    tokens = line.strip().split(",")
    fields = []
    
    # First column (e.g. "country" or whatever the first header is)
    first = tokens[0].strip()
    fields.append("" if first == "--" else first)
    
    # Check if we already have the right number of tokens for proper CSV
    if len(tokens) == num_columns:
        # Likely proper CSV format - process remaining tokens directly
        for token in tokens[1:]:
            token = token.strip()
            fields.append("" if token == "--" else token)
        return fields
    
    # Handle malformed CSV with periods marking field boundaries
    current = []
    for token in tokens[1:]:
        token = token.strip()
        token = "" if token == "--" else token   # normalize empty
        current.append(token)
        
        if token.endswith("."):  # end of one field
            field = ",".join(current).strip()
            fields.append(field)
            current = []
            if len(fields) == num_columns:
                break
    
    # Handle case where we have remaining tokens but no period at the end
    if current and len(fields) < num_columns:
        field = ",".join(current).strip()
        fields.append(field)
    
    # Ensure correct number of fields
    while len(fields) < num_columns:
        fields.append("")
    
    return fields
