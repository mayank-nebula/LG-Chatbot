from langchain.docstore.document import Document


def append_to_dict(dict, key, value, metadata):
    unique_key = f"{key}_{metadata['id']}"
    dict[unique_key] = {"page_content": value, "metadata": metadata}
    with open("final_summary_1.txt", "a") as f:
        f.write(json.dumps(dict) + "\n")


for individual_data in data:
    summarized_docs = {}
    summarized_docs_list = []
    title = individual_data["metadata"]["Title"]
    page_content = individual_data["page_content"]
    metadata = individual_data["metadata"]
    for individual_batch_key, individual_batch_value in page_content.items():
        doc = Document(page_content=individual_batch_value)
        summary_result = summary_chain.invoke([doc])
        summary = summary_result["output_text"]
        summarized_docs_list.append(summary)

    if len(summarized_docs_list) > 1:
        final_summary = " ".join(summarized_docs_list)
    else:
        final_summary = summarized_docs_list[0]

    append_to_dict(summarized_docs, title, final_summary, metadata)
