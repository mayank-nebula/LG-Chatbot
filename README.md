from langchain.docstore.document import Document
docs = []
for title, content in documents.items():
    print(f"summarising document with title: {title}" )

    doc =Document(page_content = content)
    
    summary_result = summary_chain.invoke([doc])
    
    summary = summary_result['output_text']
    
    summarized_docs[title] = summary    
