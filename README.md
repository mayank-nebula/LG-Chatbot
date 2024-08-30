import uuid
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.schema import Document
from langchain.storage import InMemoryStore


def create_multi_vector_retriever(vectorstore, json_data, batch_size=75):
    """
    Create a retriever that indexes summaries, but returns raw images or texts.
    Uses JSON input where keys are used as metadata titles and values as page content.
    """

    store = InMemoryStore()
    id_key = "GatesVentures_Scientia_Summary_Testing"

    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store, id_key=id_key
    )

    def add_documents_from_json(retriever, json_data):
        for start_idx in range(0, len(json_data), batch_size):
            end_idx = start_idx + batch_size
            keys = list(json_data)[start_idx:end_idx]
            batch_summaries = {
                str(k).rsplit("_", 1)[0]: json_data[k]
                for k in keys
            }
            doc_ids = [str(uuid.uuid4()) for _ in batch_summaries]
            summary_docs = [
                Document(
                    page_content=f"Summary of document - {key}",
                    metadata={
                        id_key: doc_ids[i],
                        "id": value["metadata"]["id"],
                        "Title": value["metadata"]["Title"],
                        "ContentTags": value["metadata"]["ContentTags"],
                        "Abstract": value["metadata"]["Abstract"],
                        "Region": value["metadata"]["Region"],
                        "StrategyArea": value["metadata"]["StrategyArea"],
                        "StrategyAreaTeam": value["metadata"]["StrategyAreaTeam"],
                        "Country": value["metadata"]["Country"],
                        "Country_x003a_CountryFusionID": value["metadata"][
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": value["metadata"]["ContentTypes"],
                        "Country_x003a_ID": value["metadata"]["Country_x003a_ID"],
                        "DeliverablePermissions": value["metadata"][
                            "DeliverablePermissions"
                        ],
                        "source": value["metadata"]["WebUrl"],
                        "deliverables_list_metadata": f"{value['metadata']['deliverables_list_metadata']}",
                    },
                )
                for i, (key, value) in enumerate(json_data.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)
            full_docs = [
                Document(
                    page_content=json.dumps(
                        {
                            "summary": f"Summary of the document - {key} - is {value['page_content']}",
                            "content": f"Summary of the document - {key} - is {value['page_content']}",
                        }
                    ),
                    metadata={
                        id_key: doc_ids[i],
                        "id": value["metadata"]["id"],
                        "Title": value["metadata"]["Title"],
                        "ContentTags": value["metadata"]["ContentTags"],
                        "Abstract": value["metadata"]["Abstract"],
                        "Region": value["metadata"]["Region"],
                        "StrategyArea": value["metadata"]["StrategyArea"],
                        "StrategyAreaTeam": value["metadata"]["StrategyAreaTeam"],
                        "Country": value["metadata"]["Country"],
                        "Country_x003a_CountryFusionID": value["metadata"][
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": value["metadata"]["ContentTypes"],
                        "Country_x003a_ID": value["metadata"]["Country_x003a_ID"],
                        "DeliverablePermissions": value["metadata"][
                            "DeliverablePermissions"
                        ],
                        "source": value["metadata"]["WebUrl"],
                        "deliverables_list_metadata": f"{value['metadata']['deliverables_list_metadata']}",
                    },
                )
                for i, (key, value) in enumerate(json_data.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    if json_data:
        add_documents_from_json(retriever, json_data)

    save_docstore(retriever.docstore, "GatesVentures_Scientia_Summary.pkl")

    return retriever

print(data[0])
retriever = create_multi_vector_retriever(vectorstore, data)
