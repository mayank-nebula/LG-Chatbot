def create_multi_vector_retriever(
    vectorstore, image_summaries, images, file_metadata, deliverables_list_metadata
):
    """
    Create a multi-vector retriever.

    Args:
        vectorstore (Vectorstore): Vectorstore object.
        image_summaries (List[str]): Summaries of image elements.
        images (List[str]): Image elements.
        file_metadata (dict): Metadata for the file.
        deliverables_list_metadata (dict): Deliverables list metadata
    """
    current_dir = os.getcwd()
    docstore_path = os.path.join(current_dir, "GV_Test_OCR.pkl")
    existing_store = load_docstore(docstore_path)

    store = existing_store if existing_store else InMemoryStore()
    id_key = "GV_Test_OCR"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store, id_key=id_key
    )

    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])

    def add_documents(retriever, doc_summaries, doc_contents):
        doc_ids = [str(uuid.uuid4()) for _ in doc_contents]
        summary_docs = [
            Document(
                page_content=s,
                metadata={
                    id_key: doc_ids[i],
                    "id": file_metadata["ID"],
                    "Title": title,
                    "ContentTags": deliverables_list_metadata["ContentTags"],
                    "Abstract": deliverables_list_metadata["Abstract"],
                    "Region": deliverables_list_metadata["Region"],
                    "StrategyArea": deliverables_list_metadata["StrategyArea"],
                    "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                    "Country": deliverables_list_metadata["Country"],
                    "Country_x003a_CountryFusionID": deliverables_list_metadata[
                        "Country_x003a_CountryFusionID"
                    ],
                    "ContentTypes": deliverables_list_metadata["ContentTypes"],
                    "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                    "DeliverablePermissions": deliverables_list_metadata[
                        "DeliverablePermissions"
                    ],
                    "source": file_metadata["WebUrl"],
                    "deliverables_list_metadata": f"{deliverables_list_metadata}",
                    "slide_number": img_name,
                },
            )
            for i, (img_name, s) in enumerate(doc_summaries.items())
        ]
        retriever.vectorstore.add_documents(summary_docs)
        full_docs = [
            Document(
                page_content=s,
                metadata={
                    id_key: doc_ids[i],
                    "id": file_metadata["ID"],
                    "Title": title,
                    "ContentTags": deliverables_list_metadata["ContentTags"],
                    "Abstract": deliverables_list_metadata["Abstract"],
                    "Region": deliverables_list_metadata["Region"],
                    "StrategyArea": deliverables_list_metadata["StrategyArea"],
                    "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                    "Country": deliverables_list_metadata["Country"],
                    "Country_x003a_CountryFusionID": deliverables_list_metadata[
                        "Country_x003a_CountryFusionID"
                    ],
                    "ContentTypes": deliverables_list_metadata["ContentTypes"],
                    "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                    "DeliverablePermissions": deliverables_list_metadata[
                        "DeliverablePermissions"
                    ],
                    "source": file_metadata["WebUrl"],
                    "deliverables_list_metadata": f"{deliverables_list_metadata}",
                    "slide_number": img_name,
                },
            )
            for i, (img_name, s) in enumerate(doc_contents.items())
        ]
        retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    if image_summaries:
        add_documents(retriever, image_summaries, images)

    save_docstore(retriever.docstore, docstore_path)

    logging.info(f"Ingestion Done {file_metadata['Name']}")
