if icon_values:
                    filter_conditions.append({"deliverables_list_metadata": {"$in": icon_values}})
            else:
                # Handle other metadata fields
                if isinstance(values, list) and len(values) > 1:
                    filter_conditions.append({mapped_field: {"$in": values}})
                else:
                    # Use $eq for single values or lists with one element
                    value = values if isinstance(values, list) else [values]
                    filter_conditions.append({mapped_field: {"$eq": value[0]}})
    
    # Combine all conditions
    if len(filter_conditions) == 1:
        search_kwargs = {"filter": filter_conditions[0]}
    elif len(filter_conditions) > 1:
        search_kwargs = {"filter": {"$and": filter_conditions}}
    else:
        search_kwargs = {}
    
    return search_kwargs
