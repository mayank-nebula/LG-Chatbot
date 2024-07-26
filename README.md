import re
import os
import uvicorn
import pandas as pd
from typing import List
from fastapi import FastAPI
from dotenv import load_dotenv
from pydantic import BaseModel
from pymongo import MongoClient
from typing import AsyncGenerator
from langchain_openai import AzureChatOpenAI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from processing_multi_vector_retriever import process_question

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


prompt = ChatPromptTemplate.from_template("{message}")
parser = StrOutputParser()


@app.get("/generate")
async def generate_content(message: Message):
    async def content_generator(question: str) -> AsyncGenerator[str, None]:
        prompt_text, sources = process_question(
            question,
            permissions,
            message.filters,
            message.stores,
            message.image,
            message.llm,
        )

        if message.image == "Yes":
            if message.llm == "Ollama":
                model = ChatOllama(
                    base_url="http://10.0.0.4:11434",
                    temperature=0,
                    model="llava-llama3:8b-v1.1-fp16",
                )
        else:
            if message.llm == "Ollama":
                model = ChatOllama(
                    base_url="http://10.0.0.4:11434",
                    temperature=0,
                    model="llama3.1:latest",
                )

        model = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            temperature=0,
        )

        chain = prompt | model | parser
        async for chunk in chain.astream({"message": prompt_text}):
            yield f"{chunk}"

    return StreamingResponse(
        content_generator(message.question), media_type="text/markdown"
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6969)
