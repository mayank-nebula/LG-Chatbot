def parse_line(line, num_columns):
    """
    Parse a row string into exactly num_columns fields.
    - Fields separated by commas
    - Fields may contain commas
    - A field usually ends with '.' but it may also end without '.'
    - Empty fields marked as '--' become ''
    """
    tokens = line.strip().split(",")
    fields = []

    # First column (e.g. country)
    first = tokens[0].strip()
    fields.append("" if first == "--" else first)

    current = []
    for i, token in enumerate(tokens[1:], start=1):
        token = token.strip()
        token = "" if token == "--" else token
        current.append(token)

        # End condition: field ends with '.' OR we reached last token
        if token.endswith(".") or i == len(tokens) - 1:
            field = ",".join(current).strip()
            fields.append(field)
            current = []
            if len(fields) == num_columns:
                break

    # If still missing fields, pad with empty strings
    while len(fields) < num_columns:
        fields.append("")

    return fields
