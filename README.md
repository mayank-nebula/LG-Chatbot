import uuid
from langchain.vectorstores import MultiVectorRetriever
from langchain.docstores import InMemoryStore
from langchain.schema import Document

def create_multi_vector_retriever(vectorstore, json_data):
    """
    Create a retriever that indexes summaries, but returns raw images or texts.
    Uses JSON input where keys are used as metadata titles and values as page content.
    """
    
    # Initialize the storage layer
    store = InMemoryStore()
    id_key = "doc_id"
    title_key = "title"

    # Create the multi-vector retriever
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore,
        docstore=store,
        id_key=id_key,
    )

    # Helper function to add documents to the vectorstore and docstore
    def add_documents_from_json(retriever, json_data):
        doc_ids = [str(uuid.uuid4()) for _ in json_data]
        summary_docs = [
            Document(page_content=value, metadata={id_key: doc_ids[i], title_key: key})
            for i, (key, value) in enumerate(json_data.items())
        ]
        retriever.vectorstore.add_documents(summary_docs)
        retriever.docstore.mset(list(zip(doc_ids, [value for value in json_data.values()])))

    # Add documents from JSON data
    if json_data:
        add_documents_from_json(retriever, json_data)

    return retriever

# Example usage:
# vectorstore = ... # Initialize your vectorstore here
# json_data = {
#     "Title 1": "Content for document 1",
#     "Title 2": "Content for document 2",
#     ...
# }
# retriever = create_multi_vector_retriever(vectorstore, json_data)
