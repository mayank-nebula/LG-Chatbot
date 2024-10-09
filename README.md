import os
import logging
from dotenv import load_dotenv
from models.message import Message
from fastapi import APIRouter, Depends
from controller import chat_controller
from langchain_openai import AzureChatOpenAI
from utils.db_utils import get_chat_collection
from motor.motor_asyncio import AsyncIOMotorCollection
from auth.utils.jwt_utils import TokenData, authenticate_jwt
from fastapi.responses import JSONResponse, StreamingResponse
from utils.chat_utils import standalone_question, question_intent

load_dotenv()

router = APIRouter()


def custom_error_response(detail: str, status_code: int = 400):
    return JSONResponse(status_code=status_code, content={"detail": detail})


@router.post("/chat")
async def generate_chat_content(
    message: Message,
    token_data: TokenData = Depends(authenticate_jwt),
    collection_chat: AsyncIOMotorCollection = Depends(get_chat_collection),
):
    userEmailId = token_data.email
    try:
        llm = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            temperature=0,
            streaming=True,
        )

        intent = question_intent(message.question, message.chatHistory, llm)
        if "summary_rag" in intent:
            generator = chat_controller.content_generator(
                message.question,
                userEmailId,
                llm,
                message,
                collection_chat,
                "summary_rag",
            )
        elif "normal_rag" in intent:
            generator = chat_controller.content_generator(
                message.question,
                userEmailId,
                llm,
                message,
                collection_chat,
                "normal_rag",
            )
        elif "structured_rag" in intent:
            question = (
                standalone_question(message.question, message.chatHistory, llm)
                if message.chatHistory
                else (message.question.strip())
            )
            generator = chat_controller.content_generator_struture(
                question, userEmailId, llm, message, collection_chat
            )
        elif "salutation" in intent:
            question = (
                standalone_question(message.question, message.chatHistory, llm)
                if message.chatHistory
                else (message.question.strip())
            )
            generator = chat_controller.content_generator_salutation(
                question, userEmailId, llm, message, collection_chat
            )

        return StreamingResponse(generator, media_type="application/json")

    except Exception as e:
        logging.error(f"Error occurred while generating response: {str(e)}")
        return custom_error_response("Error occurred while generating response", 500)
