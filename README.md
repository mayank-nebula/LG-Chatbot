from langchain.docstore.document import Document


def append_to_dict(dict, key, value):
    if key not in dict:
        dict[key] = ""
    dict[key] += value


summarized_docs = {}
for individual_data in data:
    title = individual_data["metadata"]["Title"]
    page_content = individual_data["page_content"]
    metadata = individual_data["metadata"]
    for individual_batch_key, individual_batch_value in page_content.items():
        doc = Document(page_content=individual_batch_value)
        summary_result = summary_chain.invoke([doc])
        summary = summary_result["output_text"]
        append_to_dict(summarized_docs, title, f"{summary} ",metadata)
