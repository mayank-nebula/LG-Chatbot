def create_search_kwargs(filters_array):
    """
    Creates search kwargs for filtering a ChromaDB collection based on an array of JSON inputs.

    Args:
        filters_array (list): A list of dictionaries, where each dictionary contains a single key-value pair.
                              The key is the filter type, and the value is a list of strings.
                              For example: [{"Title": ["Book1", "Book2"]}, {"Region": ["Europe"]}]

    Returns:
        dict: The search kwargs for filtering.

    Raises:
        TypeError: If the input is not a list or if any element is not a dictionary.
        ValueError: If any dictionary in the list does not contain exactly one key-value pair.
    """
    if not isinstance(filters_array, list):
        raise TypeError("Input must be a list of dictionaries")

    filter_conditions = []

    for i, filter_dict in enumerate(filters_array):
        if not isinstance(filter_dict, dict):
            raise TypeError(f"Element at index {i} is not a dictionary")
        
        if len(filter_dict) != 1:
            raise ValueError(f"Dictionary at index {i} must contain exactly one key-value pair")

        for field, values in filter_dict.items():
            if not isinstance(values, list):
                raise TypeError(f"Value for '{field}' at index {i} must be a list")

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
