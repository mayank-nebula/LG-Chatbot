if filters:
    retriever = create_retriever(filters, stores)
else:
    retriever = retriever_gpt if stores == "GPT" else retriever_ollama

llm_to_use = llm_gpt if llm == "GPT" else llm_ollama

if image:
    chain = multi_modal_rag_chain_source(retriever, chatHistory, llm_to_use, llm)
else:
    chain = multi_modal_rag_chain_source_1(retriever, chatHistory, llm_to_use)

response = chain.invoke(question)

return response, sources
