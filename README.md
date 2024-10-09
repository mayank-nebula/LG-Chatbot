import random
from typing import List
from bson import ObjectId
from fastapi import HTTPException
from pymongo import ReturnDocument
from motor.motor_asyncio import AsyncIOMotorCollection

# from utils.user_permissions import get_user_permissions


# Retrieve all chat threads of a user
async def get_all_chats(
    user_email_id: str,
    # user_lookup_id: str,
    collection_user: AsyncIOMotorCollection,
    collection_chat: AsyncIOMotorCollection,
):
    """
    Retrieves all chat threads for a specific user, creating a new user entry if not found.

    Args:
        user_email_id (str): The email ID of the user.
        full_name (str): The full name of the user.
        user_lookup_id (str): The lookup ID for the user.

    Returns:
        dict: A dictionary containing the chats and a status message.
    """
    try:
        user = await collection_user.find_one({"email": user_email_id})
        # user_permission_csv = os.path.join("csv", "users_permission.csv")
        # permission = await get_user_permissions(user_permission_csv, user_lookup_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Retrieve chat history, sorting by the latest update time
        chats_cursor = collection_chat.find({"userEmailId": user_email_id}).sort(
            "updatedAt", -1
        )
        chats = await chats_cursor.to_list(length=None)
        chat_list = [
            {
                "id": str(chat["_id"]),
                "title": chat["title"],
                "updatedAt": chat["updatedAt"],
                "bookmark": chat.get("bookmark", False),
            }
            for chat in chats
        ]

        return {"chats": chat_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chats: {str(e)}")


# Retrieve a specific chat by ID
async def get_specific_chat(
    chat_id: str,
    user_email_id: str,
    collection_chat: AsyncIOMotorCollection,
):
    """
    Retrieve a specific chat thread for a user by chat ID.
    """
    try:
        # Query MongoDB using the ObjectId and userEmailId
        chat = await collection_chat.find_one(
            {"_id": ObjectId(chat_id), "userEmailId": user_email_id}
        )
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Filter chats that are not flagged
        filtered_chats = chat.get("chats", [])
        for chat_item in filtered_chats:
            if "_id" in chat_item:
                chat_item["_id"] = str(chat_item["_id"])

        return {
            "message": "Chat retrieved successfully",
            "title": chat["title"],
            "chats": filtered_chats,
            "updatedAt": chat["updatedAt"],
            "createdAt": chat["createdAt"],
            "filtersMetadata": chat["filtersMetadata"],
            "isGPT": chat["isGPT"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat: {str(e)}")


# Retrieve random questions
async def get_random_questions(
    user_email_id: str,
    collection_user: AsyncIOMotorCollection,
    collection_question: AsyncIOMotorCollection,
):
    """
    Retrieve a set of random questions for the user.
    """
    try:
        user = await collection_user.find_one({"email": user_email_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Use MongoDB's $sample to fetch random questions
        random_questions = await collection_question.aggregate(
            [
                {"$unwind": "$questions"},  # Unwind the questions array
                {"$sample": {"size": 4}},  # Sample 4 random questions
            ]
        ).to_list(None)

        questions = {q["questions"]: q["documentName"] for q in random_questions}
        return {
            "message": "Random questions retrieved successfully",
            "totalQuestions": len(questions),
            "questions": questions,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving random questions: {str(e)}"
        )


# Post filtered questions based on document names
async def post_filtered_question(
    document_names: List[str],
    collection_question: AsyncIOMotorCollection,
):
    """
    Post filtered questions based on provided document names.
    """
    try:
        if not isinstance(document_names, list) or not document_names:
            raise HTTPException(
                status_code=400, detail="documentNames should be a non-empty array."
            )

        # Find documents where documentName is in document_names
        matched_questions = await collection_question.find(
            {"documentName": {"$in": document_names}}
        ).to_list(None)

        if not matched_questions:
            return {"message": "No matching documents found", "questions": {}}

        # Create a mapping of questions to their corresponding document names
        question_to_document_map = {}
        for doc in matched_questions:
            for question in doc.get("questions", []):
                question_to_document_map[question] = doc["documentName"]

        unique_questions = list(question_to_document_map.keys())

        # Shuffle and limit to 4 questions
        random.shuffle(unique_questions)
        limited_questions = unique_questions[:4]

        # Create the final map of selected questions to document names
        final_questions = {q: question_to_document_map[q] for q in limited_questions}

        return {"message": "Matching documents found", "questions": final_questions}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error posting filtered questions: {str(e)}"
        )


# Change the title of a specific chat
async def put_change_title(
    chat_id: str,
    title: str,
    collection_chat: AsyncIOMotorCollection,
):
    """
    Change the title of a specific chat.
    """
    try:

        updated_chat = await collection_chat.find_one_and_update(
            {"_id": ObjectId(chat_id)},
            {"$set": {"title": title}},
            return_document=ReturnDocument.AFTER,
        )
        if not updated_chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"message": "Chat title updated", "chatId": chat_id, "title": title}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error changing chat title: {str(e)}"
        )


# Toggle bookmark of a chat
async def put_bookmark(
    chat_id: str,
    collection_chat: AsyncIOMotorCollection,
):
    """
    Toggle the bookmark status of a chat.
    """
    try:

        chat = await collection_chat.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        new_bookmark = not chat.get("bookmark", False)
        await collection_chat.find_one_and_update(
            {"_id": ObjectId(chat_id)}, {"$set": {"bookmark": new_bookmark}}
        )
        return {"message": "Bookmark updated", "bookmark": new_bookmark}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating bookmark: {str(e)}"
        )


# Update feedback for a specific message in a chat
async def put_chat_feedback(
    chat_id: str,
    message_id: str,
    feedback: str,
    collection_chat: AsyncIOMotorCollection,
    reason: str = "",
):
    """
    Update feedback for a specific message in a chat.
    """
    try:
        chat = await collection_chat.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Find the message by ID
        message = next((m for m in chat["chats"] if str(m["_id"]) == message_id), None)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Update feedback and reason
        feedback_update = {"chats.$.feedback": feedback}
        if reason:
            feedback_update["chats.$.reason"] = reason

        await collection_chat.update_one(
            {"_id": ObjectId(chat_id), "chats._id": ObjectId(message_id)},
            {"$set": feedback_update},
        )

        return {"message": "Feedback updated"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating feedback: {str(e)}"
        )


# Delete a specific chat
async def delete_chat(
    chat_id: str,
    collection_chat: AsyncIOMotorCollection,
):
    """
    Delete a specific chat by chat ID.
    """
    try:
        deleted_chat = await collection_chat.find_one_and_delete(
            {"_id": ObjectId(chat_id)}
        )
        if not deleted_chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        return {"message": "Chat deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")
