def multi_modal_rag_chain_source(retriever): #will add chat history here
    """Multi-modal RAG chain"""
    model = ChatOllama(model=llava_llama3, base_url = base_url)

    # def combined_context(data_dict):
    #     context = {
    #         "texts": data_dict.get("texts", []),
    #         "images": data_dict.get("images", []),
    #         "chat_history": chat_history,
    #     }
    #     return context

    # chain = (
    #     {
    #         "context": retriever | RunnableLambda(split_image_text_types) | RunnableLambda(combined_context),
    #         "question": RunnablePassthrough()
    #     }
    #     | RunnableLambda(img_prompt_func)
    #     | model
    #     | StrOutputParser()
    # )

    # return chain

    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | model
        | StrOutputParser()
    )

    return chain
