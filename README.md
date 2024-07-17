if filters:
        retriever = create_retriever(filters, stores)
    elif stores == "GPT":
        retriever = retriever_gpt
    else:
        retriever = retriever_ollama

    if image:
        if llm == "GPT":
            llm_to_use = llm_gpt
        else:
            llm_to_use = llm_ollama
    else:
        if llm == "GPT":
            llm_to_use = llm_gpt
        else:
            llm_to_use = llm_ollama

    if image:
        chain = multi_modal_rag_chain_source(retriever, chatHistory, llm_to_use, llm)
    else:
        chain = multi_modal_rag_chain_source_1(retriever, chatHistory, llm_to_use)

    response = chain.invoke(question)

    return response, sources
