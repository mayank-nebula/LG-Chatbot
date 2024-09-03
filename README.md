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

    # Combine all summaries and contents
    combined_summaries = {}
    combined_contents = {}

    # Add text summaries and contents
    if text_summaries:
        combined_summaries.update(text_summaries)
        combined_contents.update(texts)

    # Add table summaries and contents
    if table_summaries:
        combined_summaries.update(table_summaries)
        combined_contents.update(tables)

    # Add image summaries and contents
    if image_summaries:
        combined_summaries.update(image_summaries)
        combined_contents.update(images)

    doc_keys = list(combined_contents.keys())
    total_docs = len(doc_keys)

    logging.info("Done till here")

    def add_documents(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, total_docs, batch_size):
            document_summary_list = []

            end_idx = min(start_idx + batch_size, total_docs)
            batch_keys = doc_keys[start_idx:end_idx]

            batch_summaries = {key: doc_summaries[key] for key in batch_keys}
            batch_contents = {key: doc_contents[key] for key in batch_keys}

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
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                Document(
                    page_content=json.dumps(
                        {"summary": doc_summaries[key], "content": s}
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
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

            # Accumulate the summaries
            document_summary_list.append(create_summary(batch_summaries))

        return document_summary_list

    # Process documents and accumulate summaries
    all_document_summaries = add_documents(
        retriever, combined_summaries, combined_contents
    )

    # Combine all summaries into one
    if len(all_document_summaries) > 1:
        combined_summary = " ".join(all_document_summaries)
    else:
        combined_summary = all_document_summaries[0] if all_document_summaries else ""

    # Store the combined summary in the summary retriever
    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
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
            page_content=json.dumps(
                {
                    "summary": f"Summary of the document - {title} - is {combined_summary}",
                    "content": f"Summary of the document - {title} - is {combined_summary}",
                }
            ),
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

    # generate_and_save_questions(title, combined_summary)

    save_docstore(retriever.docstore, docstore_path_normal)
    save_docstore(retriever_summary.docstore, docstore_path_summary)

    logging.info(f"Ingestion Done {file_metadata['Name']}")
