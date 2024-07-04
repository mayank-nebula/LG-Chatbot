
def multi_modal_rag_chain_gpt(retriever):
    """Multi-modal RAG chain"""
    llm_gpt = AzureChatOpenAI(
        openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    )   
    
    context_and_question = RunnableParallel(
        context=retriever | RunnableLambda(split_image_text_types),
        question=RunnablePassthrough()
    )
    
    def combine_prompts(inputs):
        return {
            "llm_input": img_prompt_func_gpt(inputs),
            "sources": inputs["context"]["sources"]
        }
    
    chain = (
        context_and_question
        | RunnableLambda(combine_prompts)
        | {
            "answer": RunnablePassthrough(input_key="llm_input") | llm_gpt | StrOutputParser(),
            "sources": lambda x: x["sources"]
        }
    )
    
    return chain
