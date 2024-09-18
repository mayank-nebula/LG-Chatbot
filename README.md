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

    filter_conditions = []

    if isinstance(filters, str):
        filter_condition = {"Title": filters}
        search_kwargs = {"filter": filter_condition}
        return search_kwargs

    # Mapping of document type descriptions to docIcon values
    doc_type_to_icon = {
        "PDF Document": ["pdf"],
        "PowerPoint Presentation": ["pptx", "ppt"],
        "Word Document": ["docx", "doc"],
    }

    # Map filter keys to corresponding metadata fields
    filter_key_mapping = {
        "region": "Region",
        "country": "Country",
        "strategyArea": "StrategyArea",
        "others": "Title",
    }

    for filter_dict in filters:
        for field, values in filter_dict.items():
            # Map the field to its corresponding metadata field if needed
            mapped_field = filter_key_mapping.get(field, field)

            if mapped_field == "documentType":
                # Handle document type mapping
                icon_values = []
                if isinstance(values, list):
                    for v in values:
                        icon_values.extend(doc_type_to_icon.get(v, [v]))
                else:
                    icon_values = doc_type_to_icon.get(values, [values])

                if icon_values:
                    filter_conditions.append(
                        {"deliverables_list_metadata": {"$in": icon_values}}
                    )
            else:
                # Handle other metadata fields
                if isinstance(values, list) and len(values) > 1:
                    filter_conditions.append({mapped_field: {"$in": values}})
                else:
                    # Use $eq for single values or lists with one element
                    value = values if isinstance(values, list) else [values]
                    filter_conditions.append({mapped_field: {"$in": [value[0]]}})

    # Combine all conditions
    if len(filter_conditions) == 1:
        search_kwargs = {"filter": filter_conditions[0]}
    elif len(filter_conditions) > 1:
        search_kwargs = {"filter": {"$and": filter_conditions}}
    else:
        search_kwargs = {}

    return search_kwargs

retriever = MultiVectorRetriever(
    vectorstore=vectorstore_gpt_summary,
    docstore=loaded_docstore_gpt_summary,
    id_key="GatesVentures_Scientia_Summary",
    search_kwargs=search_kwargs,
)
