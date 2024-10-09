def build_chat_history(messages: List[dict]) -> List[BaseMessage]:
    """
    Converts a list of dictionaries with message content and type (either 'human' or 'ai')
    into a list of HumanMessage and AIMessage instances.

    Args:
    messages (List[dict]): A list of dictionaries, where each dictionary represents a message 
                           with 'content' (the text) and 'type' ('human' or 'ai').

    Returns:
    List[BaseMessage]: A list of HumanMessage and AIMessage instances.
    """
    chat_history = []
    
    for msg in messages:
        if msg['type'] == 'human':
            chat_history.append(HumanMessage(content=msg['content']))
        elif msg['type'] == 'ai':
            chat_history.append(AIMessage(content=msg['content']))
    
    return chat_history
