import uuid

from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_community.storage import RedisStore
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_community.embeddings import OllamaEmbeddings
from chromadb.config import Settings
import chromadb

kv_store = RedisStore(redis_url="redis://10.1.0.4:6379/15")


settings = Settings(anonymized_telemetry=False)


CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)


def create_multi_vector_retriever(
    vectorstore, text_summaries, texts, table_summaries, tables, image_summaries, images
):
    """
    Create retriever that indexes summaries, but returns raw images or texts
    """

    # Initialize the storage layer

    id_key = "testing_redis"

    # Create the multi-vector retriever
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore,
        docstore=kv_store,
        id_key=id_key,
    )

    # Helper function to add documents to the vectorstore and docstore
    def add_documents(retriever, doc_summaries, doc_contents):
        doc_ids = [str(uuid.uuid4()) for _ in doc_contents]
        summary_docs = [
            Document(page_content=s, metadata={id_key: doc_ids[i]})
            for i, s in enumerate(doc_summaries)
        ]
        retriever.vectorstore.add_documents(summary_docs)
        full_docs = [
            Document(page_content=s, metadata={id_key: doc_ids[i]})
            for i, s in enumerate(doc_contents)
        ]
        retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    # Add texts, tables, and images
    # Check that text_summaries is not empty before adding
    if text_summaries:
        add_documents(retriever, text_summaries, texts)
    # Check that table_summaries is not empty before adding
    if table_summaries:
        add_documents(retriever, table_summaries, tables)
    # Check that image_summaries is not empty before adding
    if image_summaries:
        add_documents(retriever, image_summaries, images)

    return retriever

embeddings = OllamaEmbeddings(model="nomic-embed-text:latest")

# The vectorstore to use to index the summaries
vectorstore = Chroma(
    collection_name="testing_redis",
    embedding_function=embeddings,
    client=CHROMA_CLIENT,
)

# Create retriever
retriever_multi_vector_img = create_multi_vector_retriever(
    vectorstore,
    text_summaries,
    texts,
    table_summaries,
    tables,
    image_summaries,
    img_base64_list,
)



Invalid input of type: 'Document'. Convert to a bytes, string, int or float first
