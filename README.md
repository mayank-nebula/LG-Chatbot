async def create_new_title_chat(
    message: Message, collection_chat: AsyncIOMotorCollection, llm_gpt: AzureChatOpenAI
):
    """
    Creates a new chat thread with a generated title based on the user's question.

    Args:
        message (Message): The message object containing user information and question.

    Returns:
        str: The ID of the newly created chat thread.
    """
    try:
        title = create_new_title(message.question, llm_gpt)
        new_chat = {
            "userEmailId": message.userEmailId,
            "title": title,
            "chats": [
                {
                    "_id": ObjectId(),
                    "user": message.question,
                }
            ],
            "filtersMetadata": (
                message.filtersMetadata if message.filtersMetadata else []
            ),
            "isGPT": message.isGPT,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        inserted_chat = await collection_chat.insert_one(new_chat)
        return inserted_chat.inserted_id
    except Exception as e:
        logging.error(f"Error creating new chat: {e}")
        raise HTTPException(status_code=500, detail="Error creating new chat")
