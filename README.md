@app.post("/")
async def generate_content(message: Message):
    async def content_generator_summary(question: str) -> AsyncGenerator[str, None]:
        try:
            ai_text = ""
            global user_permissions, sources
            user_permissions = permissions.copy()
            sources.clear()
            chat_id = None
            message_id = None

            if message.filters:
                search_kwargs = create_search_kwargs(message.filters)
                retriever = (
                    MultiVectorRetriever(
                        vectorstore=vectorstore_gpt_summary,
                        docstore=loaded_docstore_gpt_summary,
                        id_key="GV_Test_OCR_50_ollama_summary",
                        search_kwargs=search_kwargs,
                    )
                    if message.stores == "GPT"
                    else MultiVectorRetriever(
                        vectorstore=vectorstore_ollama_summary,
                        docstore=loaded_docstore_ollama_summary,
                        id_key="GV_Test_OCR_50_ollama_summary",
                        search_kwargs=search_kwargs,
                    )
                )
                # retriever = create_retriever_summary(message.filters, message.stores)
            else:
                retriever = (
                    retriever_gpt_summary
                    if message.stores == "GPT"
                    else retriever_ollama_summary
                )

            llm_to_use = (
                llm_gpt
                if message.llm == "GPT"
                else ChatOllama(temperature=0, model=llama3_1, base_url=base_url)
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_to_use,
                message.llm,
                "No",
                message.filters,
                message.chatHistory,
                "No",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if count_restriction < 4:
                sources.update({"Note: This is a Restricted Answer": ""})

            if message.chatId:
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
                    "sources": sources,
                }

                collection_chat.update_one(
                    {"_id": ObjectId(message.chatId)},
                    {
                        "$push": {"chats": new_chat},
                        "$set": {"updatedAt": datetime.utcnow()},
                    },
                )
                chat_id = ObjectId(message.chatId)
            else:
                title = create_new_title(message.question, message.llm)
                new_chat = {
                    "userEmailId": message.userEmailId,
                    "title": title,
                    "chats": [
                        {
                            "_id": ObjectId(),
                            "user": message.question,
                            "ai": ai_text,
                            "sources": sources,
                        }
                    ],
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
                inserted_chat = collection_chat.insert_one(new_chat)
                chat_id = inserted_chat.inserted_id

            chat = collection_chat.find_one({"_id": chat_id})
            if chat and "chats" in chat:
                message_id = chat["chats"][-1]["_id"]

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator(question: str) -> AsyncGenerator[str, None]:
        try:
            ai_text = ""
            global user_permissions, sources
            user_permissions = permissions.copy()
            sources.clear()
            chat_id = None
            message_id = None

            if message.filters:
                search_kwargs = create_search_kwargs(message.filters)
                retriever = (
                    MultiVectorRetriever(
                        vectorstore=vectorstore_gpt,
                        docstore=loaded_docstore_gpt,
                        id_key="GV_Test_OCR_50_GPT",
                        search_kwargs=search_kwargs,
                    )
                    if message.stores == "GPT"
                    else MultiVectorRetriever(
                        vectorstore=vectorstore_ollama,
                        docstore=loaded_docstore_ollama,
                        id_key="GV_Test_OCR_50_ollama",
                        search_kwargs=search_kwargs,
                    )
                )
                # retriever = create_retriever(message.filters, message.stores)
            else:
                retriever = (
                    retriever_gpt if message.stores == "GPT" else retriever_ollama
                )

            if message.image == "Yes":
                llm_to_use = (
                    llm_gpt
                    if message.llm == "GPT"
                    else ChatOllama(
                        temperature=0, model=llava_llama3, base_url=base_url
                    )
                )
            else:
                llm_to_use = (
                    llm_gpt
                    if message.llm == "GPT"
                    else ChatOllama(temperature=0, model=llama3_1, base_url=base_url)
                )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_to_use,
                message.llm,
                message.image,
                message.filters,
                message.chatHistory,
                message.reason,
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if count_restriction < 4:
                sources.update({"Note: This is a Restricted Answer": ""})

            if message.chatId:
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
                    "sources": sources,
                }

                collection_chat.update_one(
                    {"_id": ObjectId(message.chatId)},
                    {
                        "$push": {"chats": new_chat},
                        "$set": {"updatedAt": datetime.utcnow()},
                    },
                )
                chat_id = ObjectId(message.chatId)
            else:
                title = create_new_title(message.question, message.llm)
                new_chat = {
                    "userEmailId": message.userEmailId,
                    "title": title,
                    "chats": [
                        {
                            "_id": ObjectId(),
                            "user": message.question,
                            "ai": ai_text,
                            "sources": sources,
                        }
                    ],
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
                inserted_chat = collection_chat.insert_one(new_chat)
                chat_id = inserted_chat.inserted_id

            chat = collection_chat.find_one({"_id": chat_id})
            if chat and "chats" in chat:
                message_id = chat["chats"][-1]["_id"]

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator_GPT(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
            ai_text = ""
            chat_id = None
            message_id = None

            model = AzureChatOpenAI(
                api_key=os.environ["AZURE_OPENAI_API_KEY"],
                openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            )

            prompt_text = """
                Please answer the following question based on the given conversation history. \
                Use your own knowledge to answer the question. \
                Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.
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

            if message.chatId:
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
                    "sources": {"This response is generated by ChatGPT": ""},
                }

                collection_chat.update_one(
                    {"_id": ObjectId(message.chatId)},
                    {
                        "$push": {"chats": new_chat},
                        "$set": {"updatedAt": datetime.utcnow()},
                    },
                )
                chat_id = ObjectId(message.chatId)
            else:
                title = create_new_title(message.question, message.llm)
                new_chat = {
                    "userEmailId": message.userEmailId,
                    "title": title,
                    "chats": [
                        {
                            "_id": ObjectId(),
                            "user": message.question,
                            "ai": ai_text,
                            "sources": {"This response is generated by ChatGPT": ""},
                        }
                    ],
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
                inserted_chat = collection_chat.insert_one(new_chat)
                chat_id = inserted_chat.inserted_id

            chat = collection_chat.find_one({"_id": chat_id})
            if chat and "chats" in chat:
                message_id = chat["chats"][-1]["_id"]

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps(
                {
                    "type": "sources",
                    "content": {"This response is generated by ChatGPT": ""},
                }
            )
        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator_salutation(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
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

            if message.chatId:
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
                chat_id = message.chatId

            else:
                title = create_new_title(message.question, message.llm)
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
        question_intent_response = question_intent(
            message.question, message.chatHistory, message.llm
        )

        print(question_intent_response)

        question = (
            standalone_question(message.question, message.chatHistory, message.llm)
            if message.chatHistory
            else message.question
        )

        if "direct_response" in question_intent_response:
            generator = content_generator_salutation(question)
        elif "external_general_knowledge" in question_intent_response:
            generator = content_generator_GPT(question)
        elif "normal_rag" in question_intent_response:
            generator = content_generator(question)
        elif "summary_rag" in question_intent_response:
            generator = content_generator_summary(question)
        return StreamingResponse(generator, media_type="application/json")
    except Exception as e:
        logging.error(f"An Error Occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6969)
