retriever = MultiVectorRetriever(
    vectorstore=vectorStore, docstore=loaded_docstore, id_key="MV_Summary", search_kwargs={"filter": {"MV_Summary": "483ff14d-3ce1-4258-897e-c9d486b28576"}}
)
