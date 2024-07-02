def create_retriever(filters):
    filter_conditions = []
    contains_fields = ['Region','StrategyArea']

    if not filters:
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
        )
        return retriever
    else:
        for field, value in json_data.items():
            if field in contains_fields:
                if isinstance(value, (list, dict)):
                    or_conditions = [
                        {field: {"$contains": str(v)}} for v in value
                    ]
                    filter_conditions.append({"$or": or_conditions})
                else:
                    filter_conditions.append({field: {"$contains": str(value)}})
            elif isinstance(value, (list, dict)):
                or_conditions = [
                    {field: v} for v in value
                ]
                filter_conditions.append({"$or": or_conditions})
            else:
                filter_conditions.append({field: value})

        final_filter = {"$and": filter_conditions}
        search_kwargs = {"filter": chroma_filter}

        retriever = MultiVectorRetriever(
            vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
            search_kwargs=search_kwargs
        )
        return retriever
