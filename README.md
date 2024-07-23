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
import uvicorn
from processing_multi_vector_retriever import process_question
from pymongo import MongoClient
import pandas as pd
import re

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
collection_user = db["users"]
collection_chat = db["chats"]

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
    aiResponse = ""

    # user = collection_user.find_one({"email": message.userEmailId})
    # permissions = user["userPermissions"]

    human_message, sources = process_question(
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
            aiResponse += token
            yield token
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task

    # sources_str = json.dumps(source)

    # if message.chatId:
    #     new_chat = {"user": message.question, "ai": aiResponse, "sources": sources}
    #     collection_chat.update_one(
    #         {"_id": message.chatId}, {"$push": {"chats": new_chat}}
    #     )
    # else:
    #     new_chat = {
    #         "userEmailId": message.userEmailId,
    #         "title": message.question,
    #         "chats": [{"user": message.question, "ai": aiResponse, "sources": sources}],
    #     }
    #     collection_chat.insert_one(new_chat)


async def send_message_GPT(message: Message) -> AsyncIterable[str]:
    callback = AsyncIteratorCallbackHandler()
    aiResponse = ""

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
            aiResponse += token
            yield token
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task

    # if message.chatId:
    #     new_chat = {
    #         "user": message.question,
    #         "ai": aiResponse,
    #         "sources": {"This response is generated by ChatGPT": ""},
    #     }
    #     collection_chat.update_one(
    #         {"_id": message.chatId}, {"$push": {"chats": new_chat}}
    #     )
    # else:
    #     new_chat = {
    #         "userEmailId": message.userEmailId,
    #         "title": message.question,
    #         "chats": [
    #             {
    #                 "user": message.question,
    #                 "ai": aiResponse,
    #                 "sources": {"This response is generated by ChatGPT": ""},
    #             }
    #         ],
    #     }
    #     collection_chat.insert_one(new_chat)


async def send_message_salutation(message: Message) -> AsyncIterable[str]:
    callback = AsyncIteratorCallbackHandler()
    aiResponse = ""

    chat_history = "\n".join(
        [
            f"Human : {chat['user']}\nAssistant: {chat['ai']}"
            for chat in message.chatHistory
        ]
    )

    if message.llm == "GPT":
        model = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            streaming=True,
            verbose=True,
            callbacks=[callback],
        )
    else:
        model = ChatOllama(
            base_url="http://10.0.0.4:11434",
            temperature=0,
            model="llama3:latest",
            callbacks=[callback],
            stream_chat=True,
        )

    text_message = {
        "type": "text",
        "text": (
            "The following is a conversation with a highly intelligent AI assistant. \n"
            "The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses.\n"
            "When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\n"
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
            aiResponse += token
            yield token
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task

    # if message.chatId:
    #     new_chat = {
    #         "user": message.question,
    #         "ai": aiResponse,
    #         "sources": {"This response is generated by ChatGPT": ""},
    #     }
    #     collection_chat.update_one(
    #         {"_id": message.chatId}, {"$push": {"chats": new_chat}}
    #     )
    # else:
    #     new_chat = {
    #         "userEmailId": message.userEmailId,
    #         "title": message.question,
    #         "chats": [
    #             {
    #                 "user": message.question,
    #                 "ai": aiResponse,
    #                 "sources": {"This response is generated by ChatGPT": ""},
    #             }
    #         ],
    #     }
    #     collection_chat.insert_one(new_chat)


async def is_generalChat(question):
    salutations = [
        r"^hello$",
        r"^hi$",
        r"^hey$",
        r"^good morning$",
        r"^good afternoon$",
        r"^good evening$",
        r"^greetings$",
        r"^what's up$",
        r"^howdy$",
        r"^hi there$",
    ]

    salutation_patterns = [
        re.compile(salutation, re.IGNORECASE) for salutation in salutations
    ]

    for pattern in salutation_patterns:
        if pattern.match(question.strip()):
            return True
    return False


@app.post("/stream_chat/")
async def stream_chat(message: Message):

    if is_generalChat(message.question):
        print(message.question)
        generator = send_message_salutation(message)
    elif "@GK" in message.question:
        generator = send_message_GPT(message)
    else:
        generator = send_message_RAG(message)
    return StreamingResponse(generator, media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=6677, reload=False, log_level="debug")
