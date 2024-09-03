def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    text_summaries,
    texts,
    table_summaries,
    tables,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
    batch_size=75,
):

    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])

    current_dir = os.getcwd()
    docstore_path_normal = os.path.join(
        current_dir,
        "docstores_normal_rag",
        f"{file_metadata['ID']}.pkl",
    )
    docstore_path_summary = os.path.join(
        current_dir,
        "docstores_summary_rag",
        f"{file_metadata['ID']}.pkl",
    )

    store_normal = InMemoryStore()
    id_key_normal = "GatesVentures_Scientia_123"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store_normal, id_key=id_key_normal
    )

    store_summary = InMemoryStore()
    id_key_summary = "GatesVentures_Scientia_Summary_123"
    retriever_summary = MultiVectorRetriever(
        vectorstore=vectorstore_summary, docstore=store_summary, id_key=id_key_summary
    )

    def add_documents(retriever, retriever_summary, doc_summaries, doc_contents):
        for start_idx in range(0, len(doc_contents), batch_size):
            document_summary_list = []

            end_idx = start_idx + batch_size

            batch_content_split = doc_contents[start_idx:end_idx]
            batch_summary_split = doc_summaries[start_idx:end_idx]
            batch_summaries = {
                next(iter(item)): item[next(iter(item))] for item in batch_summary_split
            }
            batch_contents = {
                next(iter(item)): item[next(iter(item))] for item in batch_content_split
            }

            doc_ids = [str(uuid.uuid4()) for _ in batch_contents]
            summary_docs = [
                Document(
                    page_content=s,
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": img_name,
                    },
                )
                for i, (img_name, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)
            full_docs = [
                Document(
                    page_content=json.dumps(
                        {"summary": doc_summaries[img_name], "content": s}
                    ),
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": img_name,
                    },
                )
                for i, (img_name, s) in enumerate(batch_contents.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

            document_summary_list.append(create_summary(batch_summaries))

        if len(document_summary_list) > 1:
            summary = " ".join(document_summary_list)
        else:
            summary = document_summary_list[0]

        doc_id_summary = [str(uuid.uuid4())]
        summary_docs_summaryRetriever = [
            Document(
                page_content="Summary of the document - {title}",
                metadata={
                    id_key_summary: doc_id_summary[0],
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
                },
            )
        ]
        retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
        full_docs_summaryRetriever = [
            Document(
                page_content={
                    "summary": f"Summary of the document - {title} - is {summary}",
                    "content": f"Summary of the document - {title} - is {summary}",
                },
                metadata={
                    id_key_summary: doc_id_summary[0],
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
                },
            )
        ]
        retriever_summary.docstore.mset(
            list(zip(doc_id_summary, full_docs_summaryRetriever))
        )

        generate_and_save_questions(title, summary)

    if text_summaries:
        add_documents(retriever, retriever_summary, text_summaries, texts)
    if table_summaries:
        add_documents(retriever, retriever_summary, table_summaries, tables)
    if image_summaries:
        add_documents(retriever, retriever_summary, image_summaries, images)

    save_docstore(retriever.docstore, docstore_path_normal)
    save_docstore(retriever_summary.docstore, docstore_path_summary)

    logging.info(f"Ingestion Done {file_metadata['Name']}")
