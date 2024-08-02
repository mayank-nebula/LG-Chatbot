def normal_rag_wrapper(query):
    return normal_rag_api(
        query,
        chat_history,
        permissions,
        filters,
        stores,
        image,
        llm,
        chat_id,
        reason
    )

normal_RAGTool = Tool(
    func=normal_rag_wrapper,
    name="normal_RAGTool",
    description="Use this normal_RAGTool for answering questions.",
)

def summary_rag_wrapper(query):
    return summary_rag_api(
        query,
        chat_history,
        llm,
        stores
    )

summary_RAGTool = Tool(
    func=summary_rag_wrapper,
    name="summary_RAGTool",
    description="Use this summary_RAGTool for addressing questions about the overall content, main ideas, or summary of an entire document.",
)

def gpt3_5_wrapper(query):
    return call_gpt3_5(query, chat_history)

GPT3_5Tool = Tool(
    func=gpt3_5_wrapper,
    name="GPT3_5Tool",
    description="Use this GPT3_5Tool when explicitly requested by the user with '@GK / use external knowledge'. Otherwise, don't use it.",
)
