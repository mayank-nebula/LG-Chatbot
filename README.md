 def add_documents(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, total_docs, batch_size):
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
