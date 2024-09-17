filter_conditions = []

    def add_filter(field, values):
        if values:
            # Ensure values is always a list
            values = values if isinstance(values, list) else [values]
            if len(values) == 1:
                filter_conditions.append({field: values[0]})
            else:
                filter_conditions.append({"$or": [{field: v} for v in values]})

    add_filter("Title", title)
    add_filter("Strategy", strategy)
    add_filter("Region", region)
    add_filter("Country", country)

    if len(filter_conditions) == 1:
        filter_condition = filter_conditions[0]
    elif len(filter_conditions) > 1:
        filter_condition = {"$and": filter_conditions}
    else:
        filter_condition = {}

    search_kwargs = {"filter": filter_condition}
    return search_kwargs
