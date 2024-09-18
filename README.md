def create_search_kwargs(filters):
    """
    Creates search kwargs for filtering a ChromaDB collection.

    Args:
        filters (list): List of filter dictionaries.
            Each dictionary should have a key (field name) and a list of values.

    Returns:
        dict: The search kwargs for filtering.
    """

    # Map filter keys to corresponding metadata fields
    filter_key_mapping = {
        "region": "Region",
        "country": "Country",
        "strategyArea": "StrategyArea",
    }

    if isinstance(filters, str):
        filter_condition = {"Title": filters}
        search_kwargs = {"filter": filter_condition}
        return search_kwargs
    
    filter_conditions = {}
    
    doc_type_to_icon = {
        "PDF Document": ["pdf"],
        "PowerPoint Presentation": ["pptx", "ppt"],
        "Word Document": ["docx", "doc"]
    }
    
    for filter_dict in filters:
        for field, values in filter_dict.items():
            # Map the field to its corresponding metadata field if needed
            mapped_field = filter_key_mapping.get(field, field)
            
            if mapped_field == "documentType":
                icon_values = []
                if isinstance(values, list):
                    for v in values:
                        icon_values.extend(doc_type_to_icon.get(v, [v]))
                else:
                    icon_values = doc_type_to_icon.get(values, [values])
                
                if icon_values:
                    icon_conditions = [
                        {"deliverables_list_metadata": {"$contains": icon}}
                        for icon in icon_values
                    ]
                    filter_conditions["$or"] = icon_conditions
            else:
                if isinstance(values, list):
                    filter_conditions[mapped_field] = {"$in": values}
                else:
                    filter_conditions[mapped_field] = values

    search_kwargs = {"filter": filter_conditions}
    return search_kwargs
