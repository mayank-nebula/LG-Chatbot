def create_search_kwargs(filters):
    """
    Creates search kwargs for filtering a ChromaDB collection.

    Args:
        filters (list): List of filter values.

    Returns:
        dict: The search kwargs for filtering.
    """
    if isinstance(filters, str):
        filter_condition = {"Title": filters}
        search_kwargs = {"filter": filter_condition}
        return search_kwargs

    search_kwargs = {"filter": {"Title": {"$in": filters}}}

    return search_kwargs

  "create_new_title": "Given the following question, create a concise and informative title that accurately reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n {element}.Don't use your own knowledge, form question based on the first question.",
