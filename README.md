async def get_specific_chat(
    chat_id: str,
    userEmailId: str,
    collection_chat: AsyncIOMotorCollection,
):
    try:
        chat = await collection_chat.find_one(
            {"_id": ObjectId(chat_id), "userEmailId": userEmailId}
        )
        if not chat:
            raise custom_error_response("Chat not found", 404)

        filtered_chats = chat.get("chats", [])
        for chat_item in filtered_chats:
            if "_id" in chat_item:
                chat_item["_id"] = str(chat_item["_id"])
            elif ["user","ai","feedback","reason"] in chat_item:
                chat_item[""] = decrypt_data(chair[""],"Hello")

        return {
            "message": "Chat retrieved successfully",
            "title": decrypt_data(chat["title"], "Hello"),
            "chats": filtered_chats,  # todo
            "updatedAt": chat["updatedAt"],
            "createdAt": chat["createdAt"],
            "filtersMetadata": decrypt_data(chat["filtersMetadata"]),
        }
    except Exception as e:
        logging.error(f"An error occurred while retrieving chat {userEmailId}: {e}")
        return custom_error_response(f"An error occurred while retrieving chat", 400)
