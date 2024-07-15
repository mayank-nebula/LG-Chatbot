def create_retriever(filters):
    if not filters:
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
        )
        return retriever

    filter_conditions = []
    for field, value in filters.items():
        if isinstance(value, (list,dict)):
            or_conditions = [
                {field: v} for v in value
            ]
            filter_conditions.append({"$or": or_conditions})
        else:
            filter_conditions.append({field: value})


    if filter_conditions:
        final_filter = {"$and": filter_conditions}
    else:
        final_filter = {}
    # if len(filters) == 1:
    #     filter_condition = {"Title":filters[0]}
    # elif isinstance(filters, list):
    #     or_conditions = [
    #         {"Title":v} for v in filters
    #     ]
    #     filter_condition = {"$or":or_conditions}
    
    search_kwargs = {"filter" : final_filter}
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
        search_kwargs=search_kwargs
    )
    return retriever
