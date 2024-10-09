async def content_generator_salutation(
    question: str,
    message: Message,
    llm_gpt: AzureChatOpenAI,
    collection_chat: AsyncIOMotorCollection,
) -> AsyncGenerator[str, None]:
    try:
        formatted_chat_history = (
            format_chat_history(message.chatHistory)
            if message.chatHistory
            else "No Previous Conversation"
        )
        ai_text = ""
        chat_id = None
        flag = False

        if not message.chatId:
            chat_id = await create_new_title_chat(message, collection_chat, llm_gpt)
            flag = True
            yield json.dumps({"type": "chatId", "content": str(chat_id)})

        prompt_text = prompts["content_generator_salutation"]

        prompt = ChatPromptTemplate.from_template(prompt_text)

        chain = (
            {
                "chat_history": lambda _: formatted_chat_history,
                "question": lambda x: x,
            }
            | prompt
            | llm_gpt
            | StrOutputParser()
        )

        async for chunk in chain.astream(question):
            ai_text += chunk
            yield json.dumps({"type": "text", "content": chunk})

        message_id = await update_chat(
            message,
            ai_text,
            str(chat_id) if chat_id else message.chatId,
            flag,
            collection_chat,
        )

        yield json.dumps({"type": "messageId", "content": str(message_id)})
        yield json.dumps({"type": "sources", "content": None})

    except Exception as e:
        logging.error(f"An Error Occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
