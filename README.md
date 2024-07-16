full_data_to_save = [
            {
                "summary": doc_summaries[img_name],
                "content": s,
                "metadata": {
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
            }
            for i, (img_name, s) in enumerate(doc_contents.items())
        ]
