def json_to_chromadb_filter(json_data, contains_fields):
    filter_conditions = []
    
    for field, value in json_data.items():
        if field in contains_fields:
            # For fields that should always use $contains
            if isinstance(value, (list, dict)):
                or_conditions = [
                    {field: {"$contains": str(v)}} for v in value
                ]
                filter_conditions.append({"$or": or_conditions})
            else:
                filter_conditions.append({field: {"$contains": str(value)}})
        elif isinstance(value, (list, dict)):
            # For fields with multiple values
            or_conditions = [
                {field: v} for v in value
            ]
            filter_conditions.append({"$or": or_conditions})
        else:
            # For fields with a single value
            filter_conditions.append({field: value})
    
    # Combine all conditions with $and
    final_filter = {"$and": filter_conditions}
    
    return final_filter

# Specify fields that should always use $contains
contains_fields = ["field3", "field4"]

# Your JSON data (example)
json_data = {
    "field1": ["Value1", "Value2"],
    "field2": "Value2",
    "field3": ["V1", "V2"],
    "field4": "Some text",
    "field5": ["A", "B", "C"]
}

# Convert to ChromaDB filter
chroma_filter = json_to_chromadb_filter(json_data, contains_fields)

# Use the filter
search_kwargs = {"filter": chroma_filter}

# Now you can use this with your retriever
# results = retriever.get_relevant_documents("your query", search_kwargs=search_kwargs)

# Print the filter for demonstration
print(chroma_filter)