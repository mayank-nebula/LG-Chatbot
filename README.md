from pydantic import BaseModel
from typing import List, Any, Optional


class Message(BaseModel):
    """
    Pydantic model for handling incoming user messages in the chat system.

    Attributes:
    - question (str): The question or message sent by the user.
    - chatId (Optional[str]): The ID of the chat thread, if any.
    - chatHistory (List[Any]): The previous chat history associated with the chat session.
    - filters (List[str]): Any filters applied to the message (e.g., filtering documents).
    - image (Optional[str]): Whether the message contains an image or image-related query.
    - userEmailId (str): The email ID of the user sending the message.
    - regenerate (Optional[str]): Whether this is a request to regenerate a previous response.
    - feedbackRegenerate (Optional[str]): Whether this is a feedback-based regeneration.
    - reason (Optional[str]): Reason provided for the regeneration request.
    - userLookupId (int): The lookup ID of the user, used for user identification and permission checks.
    - filtersMetadata (List[Any]): Metadata associated with the applied filters.
    - isGPT (Optional[bool]): Flag indicating whether the message is being processed by GPT or another model.
    """

    question: str
    chatId: Optional[str] = None
    chatHistory: List[Any] = []
    filters: List[str] = []
    image: Optional[str] = "Yes"
    userEmailId: str
    regenerate: Optional[str] = "No"
    feedbackRegenerate: Optional[str] = "No"
    reason: Optional[str] = ""
    userLookupId: int
    filtersMetadata: List[Any] = []
    isGPT: Optional[bool] = False
    anonymousFilter: Optional[str] = ""
