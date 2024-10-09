def create_new_title(question: str, llm_gpt: AzureChatOpenAI) -> str:
    """
    Generates a concise and informative title based on the user's question.

    Args:
    - question (str): The user's question.
    - llm_gpt (AzureChatOpenAI): The LLM used to generate the title.

    Returns:
    - str: The generated title.
    """
    try:
        prompt_text = prompts["create_new_title"]
        prompt = ChatPromptTemplate.from_template(prompt_text)
        new_title = {"element": lambda x: x} | prompt | llm_gpt
        response = new_title.invoke(question)
        return response.content
    except Exception as e:
        raise Exception(f"Error generating title: {str(e)}")
