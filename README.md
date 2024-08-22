import os
import uuid
import pickle
from collections import defaultdict

def create_multi_vector_retriever(
    vectorstore,
    text_summaries,
    texts,
    table_summaries,
    tables,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
    batch_size=75  # Process in batches of 75
):
    current_dir = os.getcwd()
    docstore_path = os.path.join(
        current_dir,
        "docstores_normal_rag",
        f"{deliverables_list_metadata['Title']}.pkl",
    )

    # Load existing docstore if it exists
    if os.path.exists(docstore_path):
        with open(docstore_path, 'rb') as f:
            store = pickle.load(f)
    else:
        store = InMemoryStore()

    id_key = "GatesVentures_Scientia"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store, id_key=id_key
    )
    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])

    def add_documents_in_batches(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, len(doc_contents), batch_size):
            end_idx = start_idx + batch_size
            batch_summaries = {k: doc_summaries[k] for k in list(doc_summaries)[start_idx:end_idx]}
            batch_contents = {k: doc_contents[k] for k in list(doc_contents)[start_idx:end_idx]}

            doc_ids = [str(uuid.uuid4()) for _ in batch_contents]

            summary_docs = [
                Document(
                    page_content=s,
                    metadata={**file_metadata, **deliverables_list_metadata, "slide_number": img_name}
                )
                for img_name, s in batch_summaries.items()
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                Document(
                    page_content=json.dumps({"summary": batch_summaries[img_name], "content": s}),
                    metadata={**file_metadata, **deliverables_list_metadata, "slide_number": img_name}
                )
                for img_name, s in batch_contents.items()
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    add_documents_in_batches(retriever, text_summaries, texts)
    add_documents_in_batches(retriever, table_summaries, tables)
    add_documents_in_batches(retriever, image_summaries, images)

    # Save the updated docstore back to the .pkl file
    with open(docstore_path, 'wb') as f:
        pickle.dump(store, f)
