from controller import user_controller
from fastapi import APIRouter, Depends, Body
from motor.motor_asyncio import AsyncIOMotorCollection
from auth.utils.jwt_utils import TokenData, authenticate_jwt
from utils.db_utils import (
    get_chat_collection,
    get_question_collection,
    get_user_collection,
)

# Create an instance of APIRouter
router = APIRouter()


# Route to get all chats
@router.get("/all-chats")
async def get_all_chats(
    # user_lookup_id: str,
    token_data: TokenData = Depends(authenticate_jwt),
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    """
    Retrieve all chat threads for a given user.

    Args:
    - user_email_id (str): The email ID of the user requesting the chats.
    - full_name (str): Full name of the user.
    - user_lookup_id (str): User lookup ID for fetching permissions.

    Returns:
    - dict: A dictionary containing chat threads.
    """
    # print(token_data.email)
    user_email_id = token_data.email
    return await user_controller.get_all_chats(
        user_email_id, collection_user, collection_chat
    )


# Route to fetch a specific chat by ID
@router.get("/fetch-chat")
async def get_specific_chat(
    chat_id: str,
    token_data: TokenData = Depends(authenticate_jwt),
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    """
    Retrieve a specific chat by its ID.

    Args:
    - chat_id (str): The ID of the chat to be fetched.
    - user_email_id (str): The email ID of the user.

    Returns:
    - dict: A dictionary containing chat details.
    """
    user_email_id = token_data.email
    return await user_controller.get_specific_chat(
        chat_id, user_email_id, collection_chat
    )


# Route to get random questions
@router.get("/random-question")
async def get_random_questions(
    token_data: TokenData = Depends(authenticate_jwt),
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
    collection_question: AsyncIOMotorCollection = Depends(get_question_collection),
):
    """
    Retrieve a set of random questions for the user.

    Args:
    - user_email_id (str): The email ID of the user.

    Returns:
    - dict: A dictionary containing random questions.
    """
    user_email_id = token_data.email
    return await user_controller.get_random_questions(
        user_email_id, collection_user, collection_question
    )


# Route to post filtered questions
@router.post("/filtered-question")
async def post_filtered_question(
    document_names: list[str] = Body(..., embed=True),
    collection_question: AsyncIOMotorCollection = Depends(get_question_collection),
):
    """
    Post filtered questions based on provided document names.

    Args:
    - document_names (list[str]): List of document names for which questions are required.

    Returns:
    - dict: A dictionary containing the filtered questions.
    """
    return await user_controller.post_filtered_question(
        document_names,
        collection_question,
    )


# Route to change the chat title
@router.put("/change-title")
async def put_change_title(
    chat_id: str = Body(..., embed=True),
    title: str = Body(..., embed=True),
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    """
    Change the title of a specific chat.

    Args:
    - chat_id (str): The ID of the chat to update.
    - title (str): The new title of the chat.

    Returns:
    - dict: A dictionary confirming the title change.
    """
    return await user_controller.put_change_title(chat_id, title, collection_chat)


# Route to toggle the bookmark of a chat
@router.put("/bookmark")
async def put_bookmark(
    chat_id: str = Body(..., embed=True),
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    """
    Toggle the bookmark status of a specific chat.

    Args:
    - chat_id (str): The ID of the chat to toggle bookmark status.

    Returns:
    - dict: A dictionary confirming the bookmark update.
    """
    return await user_controller.put_bookmark(chat_id, collection_chat)


# Route to update feedback on a specific message in a chat
@router.put("/chat-feedback")
async def put_chat_feedback(
    chat_id: str = Body(..., embed=True),
    message_id: str = Body(..., embed=True),
    feedback: str = Body(..., embed=True),
    reason: str = Body(..., embed=True),
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    """
    Update feedback for a specific message in a chat.

    Args:
    - chat_id (str): The ID of the chat containing the message.
    - message_id (str): The ID of the message to update.
    - feedback (str): The feedback content.
    - reason (Optional[str]): The reason for the feedback (optional).

    Returns:
    - dict: A dictionary confirming the feedback update.
    """
    return await user_controller.put_chat_feedback(
        chat_id, message_id, feedback, collection_chat, reason
    )


# Route to delete a specific chat by its ID
@router.delete("/delete-chat/{chat_id}")
async def delete_chat(
    chat_id: str,
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    """
    Delete a specific chat by its ID.

    Args:
    - chat_id (str): The ID of the chat to delete.

    Returns:
    - dict: A dictionary confirming the chat deletion.
    """
    return await user_controller.delete_chat(chat_id, collection_chat)
