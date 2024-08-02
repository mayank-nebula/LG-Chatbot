from functools import partial

def normal_rag_wrapper(*args, **kwargs):
    print(f"normal_rag_wrapper called with args: {args}, kwargs: {kwargs}")
    # Assuming the first argument is always the query
    query = args[0] if args else kwargs.get('query')
    if query is None:
        raise ValueError("Query is required")
    return normal_rag_api(
        query,
        kwargs.get('chat_history'),
        kwargs.get('permissions'),
        kwargs.get('filters'),
        kwargs.get('stores'),
        kwargs.get('image'),
        kwargs.get('llm'),
        kwargs.get('chat_id'),
        kwargs.get('reason')
    )

normal_RAGTool = Tool(
    func=normal_rag_wrapper,
    name="normal_RAGTool",
    description="Use this normal_RAGTool for answering questions.",
)

def summary_rag_wrapper(*args, **kwargs):
    print(f"summary_rag_wrapper called with args: {args}, kwargs: {kwargs}")
    query = args[0] if args else kwargs.get('query')
    if query is None:
        raise ValueError("Query is required")
    return summary_rag_api(
        query,
        kwargs.get('chat_history'),
        kwargs.get('llm'),
        kwargs.get('stores')
    )

summary_RAGTool = Tool(
    func=summary_rag_wrapper,
    name="summary_RAGTool",
    description="Use this summary_RAGTool for addressing questions about the overall content, main ideas, or summary of an entire document.",
)

def gpt3_5_wrapper(*args, **kwargs):
    print(f"gpt3_5_wrapper called with args: {args}, kwargs: {kwargs}")
    query = args[0] if args else kwargs.get('query')
    if query is None:
        raise ValueError("Query is required")
    return call_gpt3_5(query, kwargs.get('chat_history'))

GPT3_5Tool = Tool(
    func=gpt3_5_wrapper,
    name="GPT3_5Tool",
    description="Use this GPT3_5Tool when explicitly requested by the user with '@GK / use external knowledge'. Otherwise, don't use it.",
)
