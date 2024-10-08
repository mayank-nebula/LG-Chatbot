values_string = ', '.join(json.dumps(value) if isinstance(value, (dict, list)) else str(value) for value in final_query.values())
