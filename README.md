from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId


class ChatMessage(BaseModel):
    """
    Model for individual messages in a chat.

    Attributes:
    - user (Optional[str]): The user who sent the message.
    - ai (Optional[str]): The AI's response.
    - sources (Optional[dict]): The sources used in the response, if applicable.
    - feedback (Optional[str]): Any feedback provided on the message.
    - reason (Optional[str]): Reason for the feedback, if any.
    - flag (Optional[bool]): A flag indicating whether the message is flagged (e.g., for re-evaluation).
    """

    _id: Optional[ObjectId] = None
    user: Optional[str] = None
    ai: Optional[str] = None
    sources: Optional[dict] = {}
    feedback: Optional[str] = None
    reason: Optional[str] = None
    flag: Optional[bool] = None


class Chat(BaseModel):
    """
    Model for the overall chat structure.

    Attributes:
    - userEmailId (str): The email ID of the user associated with the chat.
    - title (str): The title of the chat.
    - chats (List[ChatMessage]): A list of ChatMessage objects representing the conversation.
    - bookmark (Optional[bool]): Whether the chat is bookmarked by the user.
    - filtersMetadata (Optional[List[dict]]): Metadata for filters applied to the chat, if any.
    - isGPT (Optional[bool]): Flag to indicate if the chat used a GPT-based model.
    - updatedAt (Optional[datetime]): Timestamp of when the chat was last updated.
    - createdAt (Optional[datetime]): Timestamp of when the chat was created.
    """

    userEmailId: str
    title: str
    chats: List[ChatMessage]
    bookmark: Optional[bool] = False
    filtersMetadata: Optional[List[dict]] = []
    isGPT: Optional[bool] = False
    updatedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
