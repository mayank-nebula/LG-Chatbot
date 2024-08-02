def process_agent(agent_executor, user_input, chat_history, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason):
    response = agent_executor.invoke(
        {
            "input": user_input,
            "chat_history": (chat_history if chat_history else []),
        }
    )
    return response["output"]

if __name__ == "__main__":
    user_input = input()
    chat_history = []
    chat_id = ""
    filters = []
    stores = "GPT"
    image = "No"
    llm = "GPT"
    userEmailId = ""
    regenerate = "No"
    feedbackRegenerate = "No"
    reason = ""
    print(process_agent(agent_executor, user_input, chat_history, chat_id, filters, stores, image, llm, userEmailId, regenerate, feedbackRegenerate, reason))
