async def update_chat(
    message: Message,
    ai_text: str,
    chat_id: str,
    flag: bool,
    collection_chat: AsyncIOMotorCollection,
    sources: dict = None,
) -> str:
    """
    Updates a chat thread by adding or modifying messages.

    Args:
    - message: The incoming message object.
    - ai_text (str): The AI-generated response.
    - chat_id (str): The chat ID of the conversation.
    - flag (bool): Whether this is a regeneration or modification.
    - collection_chat: The MongoDB collection for chats.
    - sources (dict): The sources for the AI response (if applicable).

    Returns:
    - str: The ID of the updated or newly added message.
    """
    message_id = None
    try:
        # Remove the last message if regeneration is requested
        if message.regenerate == "Yes" or flag:
            await collection_chat.update_one(
                {"_id": ObjectId(chat_id)},
                {"$pop": {"chats": 1}, "$set": {"updatedAt": datetime.utcnow()}},
            )

        # Update feedback if requested
        if message.feedbackRegenerate == "Yes":
            chat = await collection_chat.find_one({"_id": ObjectId(chat_id)})
            if chat and "chats" in chat and len(chat["chats"]) > 0:
                last_chat_index = len(chat["chats"]) - 1
                await collection_chat.update_one(
                    {
                        "_id": ObjectId(chat_id),
                        f"chats.{last_chat_index}.flag": {"$exists": False},
                    },
                    {
                        "$set": {
                            f"chats.{last_chat_index}.flag": True,
                            "updatedAt": datetime.utcnow(),
                        }
                    },
                )

        # Add the new message to the chat
        new_chat = {
            "_id": ObjectId(),
            "user": message.reason if message.reason else message.question,
            "ai": ai_text,
            "sources": sources or {},
        }
        update_fields = {
            "$push": {"chats": new_chat},
            "$set": {
                "updatedAt": datetime.utcnow(),
                "filtersMetadata": message.filtersMetadata or [],
                "isGPT": message.isGPT,
            },
        }
        await collection_chat.update_one({"_id": ObjectId(chat_id)}, update_fields)
        chat = await collection_chat.find_one({"_id": ObjectId(chat_id)})

        if chat and "chats" in chat:
            message_id = chat["chats"][-1]["_id"]

        return message_id
    except Exception as e:
        raise Exception(f"Error updating chat: {str(e)}")
