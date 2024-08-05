def update_chat(message, ai_text, sources):
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
