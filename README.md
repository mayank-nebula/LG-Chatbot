def parse_line(line, num_columns):
    """
    Parse a row string into exactly num_columns fields.
    - Fields separated by commas
    - Fields may contain commas but always end with '.'
    - Empty fields marked as '--' become ''
    """
    tokens = line.strip().split(",")
    fields = []

    # First column (e.g. "country" or whatever the first header is)
    first = tokens[0].strip()
    fields.append("" if first == "--" else first)

    # Collect remaining fields dynamically
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

    # Ensure correct number of fields
    while len(fields) < num_columns:
        fields.append("")

    return fields
