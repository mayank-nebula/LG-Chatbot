def create_search_kwargs(filters_array):
    """
    Creates search kwargs for filtering a ChromaDB collection based on an array of JSON inputs.

    Args:
        filters_array (list): A list of dictionaries, where each dictionary contains a single key-value pair.
                              The key is the filter type, and the value is a list of strings.
                              For example: [{"Title": ["Book1", "Book2"]}, {"Region": ["Europe"]}]

    Returns:
        dict: The search kwargs for filtering.
    """
    filter_conditions = []

    for filter_dict in filters_array:
        for field, values in filter_dict.items():
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
