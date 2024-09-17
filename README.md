def create_search_kwargs(filters_json):
    """
    Creates search kwargs for filtering a ChromaDB collection based on a JSON input.

    Args:
        filters_json (dict): A dictionary where keys are filter types and values are lists of strings.
                             For example: {"Title": ["Book1", "Book2"], "Strategy": ["StrategyA"]}

    Returns:
        dict: The search kwargs for filtering.
    """
    filter_conditions = []

    for field, values in filters_json.items():
        if values:
            if len(values) == 1:
                filter_conditions.append({field: values[0]})
            else:
                filter_conditions.append({"$or": [{field: v} for v in values]})

    if len(filter_conditions) == 1:
        filter_condition = filter_conditions[0]
    elif len(filter_conditions) > 1:
        filter_condition = {"$and": filter_conditions}
    else:
        filter_condition = {}

    search_kwargs = {"filter": filter_condition}
    return search_kwargs
