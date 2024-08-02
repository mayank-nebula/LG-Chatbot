GPT3_5Tool = Tool(
    func=gpt3_5_wrapper,
    name="GPT3_5Tool",
    description="This tool accesses external knowledge sources. Use ONLY when the user explicitly requests external information or when the query cannot be answered using the internal knowledge base. The user must clearly indicate they want to use external sources.",
)

summary_RAGTool = Tool(
    func=summary_rag_wrapper,
    name="summary_RAGTool",
    description="Use this tool for questions about overall content, main ideas, or summaries of entire documents within the internal knowledge base.",
)

normal_RAGTool = Tool(
    func=normal_rag_wrapper,
    name="normal_RAGTool",
    description="Primary tool for answering questions using the internal knowledge base. Use this tool for most queries that don't specifically request external information.",
)
