async def content_generator_summary(question: str) -> AsyncGenerator[str, None]:
        try:
            ai_text = ""
            output_token = 0
            token_count_reason = "Question Answer from Summary RAG"
            global user_permissions, sources
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )
            retriever = MultiVectorRetriever(
                vectorstore=(
                    vectorstore_gpt_summary
                    if message.stores == "GPT"
                    else vectorstore_ollama_summary
                ),
                docstore=(
                    loaded_docstore_gpt_summary
                    if message.stores == "GPT"
                    else loaded_docstore_ollama_summary
                ),
                id_key=(
                    "GV_Test_OCR_50_GPT_summary"
                    if message.stores == "GPT"
                    else "GV_Test_OCR_50_ollama_summary"
                ),
                search_kwargs=search_kwargs,
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
                "summary",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                if message.llm == "GPT":
                    output_token += len(encoding.encode(chunk))
                yield json.dumps({"type": "text", "content": chunk})

            if not message.filters:
                if count_restriction == 4:
                    sources.update({"Note: This is a Restricted Answer": ""})

            chat_id, message_id = update_chat(message, ai_text, sources)

            if message.llm == "GPT":
                count_tokens(
                    token_csv_file_path,
                    token_count_reason,
                    message.question,
                    input_token,
                    output_token,
                    input_token + output_token,
                    "True",
                    0,
                    True,
                )

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")


def update_chat(message: Message, ai_text: str, sources=None):
    chat_id = None
    message_id = None

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
                    "filtersMetadata": (
                        message.filtersMetadata if message.filtersMetadata else None
                    ),
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

    return chat_id, message_id
