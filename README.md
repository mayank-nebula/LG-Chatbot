def json_to_chromadb_filter(json_data):
    filter_conditions = []
    
    for field, value in json_data.items():
        if isinstance(value, (list, dict)):
            # For fields with multiple values
            or_conditions = [
                {field: v} for v in value
            ]
            filter_conditions.append({"$or": or_conditions})
        else:
            # For fields with a single value
            filter_conditions.append({field: value})
    
    # Combine all conditions with $and
    if filter_conditions:
        final_filter = {"$and": filter_conditions}
    else:
        final_filter = {}
    
    return final_filter
