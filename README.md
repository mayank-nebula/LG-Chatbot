def create_search_kwargs(filters):
    """
    Creates search kwargs for filtering a ChromaDB collection.

    Args:
        filters (list): List of filter dictionaries.
            Each dictionary should have a key (field name) and a list of values.

    Returns:
        dict: The search kwargs for filtering.
    """
    if not filters:
        return {}

    or_conditions = []
    for filter_dict in filters:
        for field, values in filter_dict.items():
            if isinstance(values, list):
                or_conditions.extend([{field: value} for value in values])
            else:
                or_conditions.append({field: values})

    filter_condition = {"$or": or_conditions} if len(or_conditions) > 1 else or_conditions[0]
    search_kwargs = {"filter": filter_condition}

    return search_kwargs
