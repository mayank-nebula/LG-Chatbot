import asyncio
import os
from typing import AsyncIterable

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema import HumanMessage
from pydantic import BaseModel
from typing import List
from langchain_community.chat_models import ChatOllama
from fastapi.responses import StreamingResponse
from langchain_openai import AzureChatOpenAI
from processing_multi_vector_retriever import process_question
from pymongo import MongoClient
import pandas as pd

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client["GV_Test"]
collection_user = db["user"]
collection_chat = db["chat"]

permission_df = pd.read_csv(
    "/home/Mayank.Sharma/GV_Test/backend/fast/users_permission.csv"
)
user_permissions = permission_df[permission_df["UserLookupId"] == 194]
permission_str = user_permissions.iloc[0]["Permissions"]
permissions = permission_str.split(";")


class Message(BaseModel):
    question: str
    chatHistory: List[str] = []
    filters: List[str] = []
    stores: str = "GPT"
    image: str = "No"
    llm: str = "GPT"
    chatId: str = ""
    userEmailId: str = ""


async def send_message_RAG(message: Message) -> AsyncIterable[str]:
    callback = AsyncIteratorCallbackHandler()

    human_message = process_question(
        message.question,
        message.chatHistory,
        permissions,
        message.filters,
        message.stores,
        message.image,
        message.llm,
    )

    if message.llm == "GPT":
        model = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            temperature=0,
            streaming=True,
            verbose=True,
            callbacks=[callback],
        )
    else:
        if message.image:
            model = ChatOllama(
                base_url="http://10.0.0.4:11434",
                temperature=0,
                model="llava-llama3:8b-v1.1-fp16",
                callbacks=[callback],
                stream_chat=True,
            )
        else:
            model = ChatOllama(
                base_url="http://10.0.0.4:11434",
                temperature=0,
                model="llama3:latest",
                callbacks=[callback],
                stream_chat=True,
            )

    task = asyncio.create_task(
        model.agenerate(messages=[[HumanMessage(content=human_message)]])
    )

    try:
        async for token in callback.aiter():
            yield token
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task

    if message.chatId:
        new_chat = {
            "user": message.question,
            "ai": aiResponse,
            # , "sources": sources
        }
        collection_chat.update_one(
            {"_id": message.chatId}, {"$push": {"chats": new_chat}}
        )
    else:
        new_chat = {
            "userEmailId": message.userEmailId,
            "title": message.question,
            "chats": [
                {
                    "user": message.question,
                    "ai": aiResponse,
                    #    , "sources": sources
                }
            ],
        }
        collection_chat.insert_one(new_chat)


async def send_message_GPT(message: Message) -> AsyncIterable[str]:
    callback = AsyncIteratorCallbackHandler()
    model = AzureChatOpenAI(
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        streaming=True,
        verbose=True,
        callbacks=[callback],
    )

    chat_history = "\n".join(
        [
            f"Human : {chat['user']}\nAssistant: {chat['ai']}"
            for chat in message.chatHistory
        ]
    )

    text_message = {
        "type": "text",
        "text": (
            "Please answer the following question based on the given conversation history.\n"
            "Use your own knowledge to answer the question\n"
            "Conversation history:\n"
            f"{chat_history if chat_history else 'No previous conversation.'}\n\n"
            "User question:\n"
            f"{message.question}"
        ),
    }

    task = asyncio.create_task(
        model.agenerate(messages=[[HumanMessage(content=text_message)]])
    )

    try:
        async for token in callback.aiter():
            yield token
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task

    if message.chatId:
        new_chat = {
            "user": message.question,
            "ai": aiResponse,
            # , "sources": sources
        }
        collection_chat.update_one(
            {"_id": message.chatId}, {"$push": {"chats": new_chat}}
        )
    else:
        new_chat = {
            "userEmailId": message.userEmailId,
            "title": message.question,
            "chats": [
                {
                    "user": message.question,
                    "ai": aiResponse,
                    #    , "sources": sources
                }
            ],
        }
        collection_chat.insert_one(new_chat)


@app.post("/stream_chat/")
async def stream_chat(message: Message):

    if "@GK" in message.question:
        generator = send_message_GPT(message)
    else:
        generator = send_message_RAG(message)
    return StreamingResponse(generator, media_type="text/event-stream")
