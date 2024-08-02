normal_RAGTool = Tool(
    func=lambda query, chat_history, permissions, filters, stores, image, llm, chat_id, reason: normal_rag_api(
        query,
        chat_history,
        permissions,
        filters,
        stores,
        image,
        llm,
        chat_id,
        reason,
    ),
    name="normal_RAGTool",
    description="Use this normal_RAGTool for answering questions.",
)

summary_RAGTool = Tool(
    func=lambda query, chat_history, llm, stores: summary_rag_api(
        query,
        chat_history,
        llm,
        stores,
    ),
    name="summary_RAGTool",
    description="Use this summary_RAGTool for addressing questions about the overall content, main ideas, or summary of an entire document.",
)

GPT3_5Tool = Tool(
    func=lambda query, chat_history: call_gpt3_5(query, chat_history),
    name="GPT3_5Tool",
    description="Use this GPT3_5Tool when explicitly requested by the user with '@GK / use external knowledge'. Otherwise, don't use it.",
)

def process_agent(
    agent_executor,
    user_input,
    chat_history,
    chat_id,
    filters,
    stores,
    image,
    llm,
    reason,
    permissions,
):
    response = agent_executor.invoke(
        {
            "input": user_input,
            "chat_history": chat_history,
            "permissions": permissions,
            "filters": filters,
            "stores": stores,
            "image": image,
            "llm": llm,
            "chat_id": chat_id,
            "reason": reason,
        }
    )
    return response["output"]
