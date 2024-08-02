def process_agent(
    agent_executor,
    user_input,
    chat_history,
    permissions,
    filters,
    stores,
    image,
    llm,
    chat_id,
    reason,
):
    response = agent_executor.invoke(
        {
            "input": user_input,
            "chat_history": chat_history if chat_history else [],
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
