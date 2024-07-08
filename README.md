def use_primary_llm(question, chatHistory):
    """Use the primary LLM (llava-llama3) to answer general chat questions."""
    model = ChatOllama(model=llava_llama3, base_url=base_url)
    
    # Format the chat history
    formatted_history = []
    for chat in chatHistory:
        formatted_history.append(HumanMessage(content=chat['user']))
        formatted_history.append(AIMessage(content=chat['ai']))
    
    # Add the current question
    formatted_history.append(HumanMessage(content=question))
    
    # Prepare the system message
    system_message = HumanMessage(content=
        "You are a friendly and helpful AI assistant. Please respond naturally to the user's message or question. "
        "If it's a greeting or general chat, respond in a conversational manner. "
        "If it's a question, provide a helpful and concise answer."
    )
    
    # Combine system message with chat history and current question
    full_conversation = [system_message] + formatted_history
    
    # Get the response from the primary LLM
    response = model(full_conversation)
    
    return response.content
