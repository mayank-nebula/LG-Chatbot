normal_RAGTool = Tool(
    func=lambda query: normal_rag_api(query, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason),
    name="normal_RAGTool",
    description="Use this normal_RAGTool for answering specific questions about particular parts or details or information within a document.",
)

summary_RAGTool = Tool(
    func=lambda query: summary_rag_api(query, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason),
    name="summary_RAGTool",
    description="Use this summary_RAGTool for addressing questions about the overall content, main ideas, or summary of an entire document.",
)

GPT3_5Tool = Tool(
    func=lambda query: call_gpt3_5(query, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason),
    name="GPT3_5Tool",
    description="Use this GPT3_5Tool for general knowledge questions, creative tasks, or when explicitly requested by the user with '@GK / use external knowledge' or similar indicators.",
)


def call_gpt3_5(query: str, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason):
    print("hitting gpt rag")
    # Use the parameters as needed
    return

def normal_rag_api(query: str, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason):
    try:
        print("Hitting normal rag")
        # Use the parameters as needed
        return
    except Exception as e:
        raise ValueError(f"Error processing normal rag tool results: {e}")

def summary_rag_api(query: str, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason):
    try:
        print("Hitting summary rag")
        # Use the parameters as needed
        return
    except Exception as e:
        raise ValueError(f"Error processing summary rag tool results: {e}")
