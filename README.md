def standalone_question(
    question: str, chat_history: list, llm_gpt: AzureChatOpenAI
) -> str:
    """
    Forms a standalone question based on the user's input and chat history.

    Args:
    - question (str): The user's question.
    - chat_history (list): The previous chat history.
    - llm_gpt (AzureChatOpenAI): The LLM used to process the prompt.

    Returns:
    - str: The standalone question.
    """
    try:
        formatted_chat_history = format_chat_history(chat_history)
        prompt_text = prompts["standalone_question"]
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = (
            {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
            | prompt
            | llm_gpt
        )
        new_question = chain.invoke(question)
        return new_question.content
    except Exception as e:
        raise Exception(f"Error generating standalone question: {str(e)}")
