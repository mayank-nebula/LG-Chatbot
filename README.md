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

    and_conditions = []
    for filter_dict in filters:
        or_conditions = []
        for field, values in filter_dict.items():
            if isinstance(values, list):
                or_conditions.extend([{field: value} for value in values])
            else:
                or_conditions.append({field: values})
        
        if len(or_conditions) > 1:
            and_conditions.append({"$or": or_conditions})
        else:
            and_conditions.extend(or_conditions)

    filter_condition = {"$and": and_conditions} if len(and_conditions) > 1 else and_conditions[0]
    search_kwargs = {"filter": filter_condition}

    return search_kwargs
