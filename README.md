async def content_generator_salutation(
        question: str, title: str
    ) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = format_chat_history(message.chatHistory)
            ai_text = ""
            chat_id = None
            message_id = None

            model = (
                AzureChatOpenAI(
                    api_key=os.environ["AZURE_OPENAI_API_KEY"],
                    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                )
                if message.llm == "GPT"
                else ChatOllama(base_url=base_url, model=llama3_1)
            )

            prompt_text = """
                The following is a conversation with a highly intelligent AI assistant. \
                The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \
                When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

            prompt = ChatPromptTemplate.from_template(prompt_text)

            chain = (
                {
                    "chat_history": lambda _: formatted_chat_history,
                    "question": lambda x: x,
                }
                | prompt
                | model
                | StrOutputParser()
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if len(message.chatId) > 0:
                if message.regenerate == "Yes":
                    collection_chat.update_one(
                        {"_id": ObjectId(message.chatId)},
                        {
                            "$pop": {"chats": 1},
                            "$set": {"updatedAt": datetime.utcnow()},
                        },
                    )

                if message.feedbackRegenerate == "Yes":
                    chat = collection_chat.find_one({"_id": ObjectId(message.chatId)})
                    if chat and "chats" in chat and len(chat["chats"]) > 0:
                        last_chat_index = len(chat["chats"]) - 1
                        collection_chat.update_one(
                            {
                                "_id": ObjectId(message.chatId),
                                f"chats.{last_chat_index}.flag": {"$exists": False},
                            },
                            {
                                "$set": {
                                    f"chats.{last_chat_index}.flag": True,
                                    "updatedAt": datetime.utcnow(),
                                }
                            },
                        )

                new_chat = {
                    "_id": ObjectId(),
                    "user": message.question,
                    "ai": ai_text,
                }

                collection_chat.update_one(
                    {"_id": ObjectId(message.chatId)},
                    {
                        "$push": {"chats": new_chat},
                        "$set": {"updatedAt": datetime.utcnow()},
                    },
                )
                chat_id = (message.chatId)

            else:
                new_chat = {
                    "userEmailId": message.userEmailId,
                    "title": title,
                    "chats": [
                        {
                            "_id": ObjectId(),
                            "user": message.question,
                            "ai": ai_text,
                        }
                    ],
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
                inserted_chat = collection_chat.insert_one(new_chat)
                chat_id = inserted_chat.inserted_id

            chat = collection_chat.find_one({"_id": ObjectId(chat_id)})
            if chat and "chats" in chat:
                message_id = chat["chats"][-1]["_id"]

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": None})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    try:
        # print(message.chatId)
        if len(message.chatId) == 0:
            title = create_new_title(message.question, message.llm)
        else:
            title = ""
            # new_question = standalone_question(message.question, message.chatHistory, message.llm)

        question = (
            standalone_question(message.question, message.chatHistory, message.llm)
            if message.chatHistory
            else message.question
        )

        if is_generalChat(message.question):
            return StreamingResponse(
                content_generator_salutation(question, title),
                media_type="application/json",
            )

class Message(BaseModel):
    question: str
    chatId: str = ""
    chatHistory: List[Any] = []
    filters: List[str] = []
    stores: str = "GPT"
    image: str = "Yes"
    llm: str = "GPT"
    userEmailId: str = ""
    regenerate: str = "No"
    feedbackRegenerate: str = "No"
    reason: str = ""

