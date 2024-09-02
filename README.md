import os
import re
import io
import csv
import json
import pickle
import base64
import logging
from bson import ObjectId
from datetime import datetime

import chromadb
import tiktoken
import pandas as pd
from PIL import Image
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient
from chromadb.config import Settings
from langchain.schema import HumanMessage
from langchain_core.documents import Document
from typing import Any, List, Dict, AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from fastapi import FastAPI, HTTPException, Request
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from fastapi.responses import JSONResponse, StreamingResponse
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough


load_dotenv()

settings = Settings(anonymized_telemetry=False)
current_dir = os.getcwd()

sources = {}
num_of_images = 0
user_permissions = []
count_restriction = 0
CHROMA_CLIENT = chromadb.HttpClient(host="localhost", port=8000, settings=settings)


embeddings_gpt = AzureOpenAIEmbeddings(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING"],
)


vectorstore_gpt = Chroma(
    collection_name="GatesVentures_Scientia",
    client=CHROMA_CLIENT,
    embedding_function=embeddings_gpt,
)

vectorstore_gpt_summary = Chroma(
    collection_name="GatesVentures_Scientia_Summary",
    client=CHROMA_CLIENT,
    embedding_function=embeddings_gpt,
)


with open(os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"), "rb") as f:
    loaded_docstore_gpt = pickle.load(f)

with open(
    os.path.join(current_dir, "docstores", "GatesVentures_Scientia_Summary.pkl"), "rb"
) as f:
    loaded_docstore_gpt_summary = pickle.load(f)


retriever_gpt = MultiVectorRetriever(
    vectorstore=vectorstore_gpt,
    docstore=loaded_docstore_gpt,
    id_key="GatesVentures_Scientia",
)
retriever_gpt_summary = MultiVectorRetriever(
    vectorstore=vectorstore_gpt_summary,
    docstore=loaded_docstore_gpt_summary,
    id_key="GatesVentures_Scientia_Summary",
)

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
    max_retries=3,
)


permission_df = pd.read_csv(os.path.join(current_dir, "csv", "users_permission.csv"))

allowed_origins = [
    "https://evalueserveglobal.sharepoint.com",
    "https://gatesventures.sharepoint.com",
]

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    question: str
    chatId: str = ""
    chatHistory: List[Any] = []
    filters: List[str] = []
    image: str = "Yes"
    userEmailId: str
    regenerate: str = "No"
    feedbackRegenerate: str = "No"
    reason: str = ""
    userLookupId: int = 194
    filtersMetadata: List[Any] = []
    isGPT: bool = False


client = MongoClient(os.environ["MONGO_API_KEY"])
db = client[os.environ["MONGODB_COLLECTION"]]
collection_user = db["users"]
collection_chat = db["chats"]


def get_user_permissions(userLookupId):
    user_permissions = permission_df[permission_df["UserLookupId"] == userLookupId]
    permission_str = user_permissions.iloc[0]["Permissions"]
    permissions = permission_str.split(";")

    return permissions


def format_chat_history(chatHistory):
    return "\n".join(
        [f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chatHistory]
    )


def looks_like_base64(sb):
    """Check if the string looks like base64"""
    try:
        return base64.b64encode(base64.b64decode(sb)) == sb.encode()
    except Exception:
        return False


def resize_base64_image(base64_string, size=(128, 128)):
    """Resize an image encoded as a Base64 string"""
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    resized_img = img.resize(size, Image.LANCZOS)
    buffered = io.BytesIO()
    resized_img.save(buffered, format=img.format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def process_metadata(metadata):
    metadata = re.sub(r"'", r'"', metadata)
    pattern = r'.*?"FileLeafRef"\s*:\s*"([^"]*)"'
    match = re.search(pattern, metadata, re.DOTALL)

    if match:
        return match.group(1)
    else:
        return None


def split_image_text_types(docs):
    """Split base64-encoded images, texts, and metadata"""
    global sources, count_restriction, num_of_images
    num_of_images = 0
    count_restriction = 0
    texts = []
    summary = []
    b64_images = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                doc_content = json.loads(doc.page_content)
                link = doc.metadata["source"]
                slide_number = doc.metadata.get("slide_number", "")

                metadata = doc.metadata.get("deliverables_list_metadata")
                title = process_metadata(metadata)
                _, ext = os.path.splitext(title)

                if ext.lower() in [".pdf", ".doc", ".docx"]:
                    slide_number = slide_number.replace("slide_", "Page ")
                else:
                    slide_number = slide_number.replace("slide_", "Slide ")

                existing_key = next(
                    (k for k in sources.keys() if k.startswith(title)), None
                )

                if existing_key:
                    new_key = existing_key + f", {slide_number}"
                    sources[new_key] = sources.pop(existing_key)
                else:
                    new_key = f"{title} {'-' if slide_number else ''} {slide_number}"
                    sources[new_key] = link

                if looks_like_base64(doc_content["content"]):
                    resized_image = resize_base64_image(
                        doc_content["content"], size=(512, 512)
                    )
                    num_of_images += 1
                    b64_images.append(resized_image)
                    summary.append(doc_content["summary"])
                else:
                    texts.append(doc_content["content"])
            else:
                count_restriction += 1
                continue

    return {"images": b64_images, "texts": texts, "summary": summary}


def img_prompt_func(data_dict):
    """Join the context into a single string"""
    formatted_summary = ""
    reason = data_dict["context"]["reason"]
    type_of_doc = data_dict["context"]["type_of_doc"]
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    chatHistory = format_chat_history(data_dict["context"]["chatHistory"])

    messages = []

    if data_dict["context"]["image_present"] == "Yes":
        if data_dict["context"]["images"]:
            for image in data_dict["context"]["images"]:
                image_message = {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                }
                messages.append(image_message)

    else:
        formatted_summary = "\n".join(data_dict["context"]["summary"])

    if type_of_doc == "normal":
        text_message = {
            "type": "text",
            "text": (
                "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\n"
                "When responding to a user's query, please ensure that your response:\n"
                "Is informative and comprehensive.\n"
                "Is clear and concise.\n"
                "Is relevant to the topic at hand.\n"
                "Adheres to the guidelines provided in the initial prompt.\n"
                "Is aligned with the specific context of the Scientia SharePoint portal.\n\n"
                "Remember to:\n"
                "Avoid providing personal opinions or beliefs.\n"
                "Base your responses solely on the information provided.\n"
                "Be respectful and polite in all interactions.\n"
                "Leverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\n"
                "From the given context, please provide a well-articulated response to the asked question.\n"
                "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
                "Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n"
                "Maintain context from previous conversations to ensure coherent and relevant responses.\n\n"
                "Never answer from your own knowledge source, always asnwer from the provided context."
                f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
            ),
        }
    else:
        text_message = {
            "type": "text",
            "text": (
                "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\n"
                "When responding to a user's query, please ensure that your response:\n"
                "Is informative and comprehensive.\n"
                "Is clear and concise.\n"
                "Is relevant to the topic at hand.\n"
                "Adheres to the guidelines provided in the initial prompt.\n"
                "Is aligned with the specific context of the Scientia SharePoint portal.\n\n"
                "Remember to:\n"
                "Avoid providing personal opinions or beliefs.\n"
                "Base your responses solely on the information provided.\n"
                "Be respectful and polite in all interactions.\n"
                "Leverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\n"
                "Task: Generate a cohesive and unified summary of the provided content, focusing on the business context and avoiding unnecessary formatting details.\n\n"
                "Guidelines : \n"
                "Avoid slide-by-slide or section-by-section breakdowns.\n"
                "Present the summary as a continuous flow.\n"
                "Ensure a smooth, coherent narrative.\n"
                "Omit concluding phrases like 'Thank you.'\n"
                "Base your response solely on the provided content.\n"
                "Maintain context from previous conversations.\n"
                "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n\n"
                "Input:\n"
                f"User's question: {data_dict.get('question', 'No question provided')}\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }\n"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
                "Output:\n"
                "Summary : A comprehensive and accurate response to the user's question, presented in a clear and concise format with appropriate headings, subheadings, bullet points, and spacing.\n\n"
            ),
        }

    messages.append(text_message)

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(
    retriever, llm_to_use, image, filters, chatHistory, reason, type_of_doc
):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "image_present": image,
            "filters": filters,
            "chatHistory": chatHistory,
            "reason": reason,
            "type_of_doc": type_of_doc,
        }
        return context

    chain = (
        {
            "context": retriever
            | RunnableLambda(split_image_text_types)
            | RunnableLambda(combined_context),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | llm_to_use
        | StrOutputParser()
    )

    return chain


def create_new_title(question):

    prompt_text = (
        "Given the following question, create a concise and informative title that accuratelt reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n"
        "{element}"
    )

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_title = {"element": lambda x: x} | prompt | llm_gpt
    response = new_title.invoke(question)

    return response.content


def update_chat(message: Message, ai_text: str, chat_id: str, flag: bool, sources=None):
    message_id = None

    if message.regenerate == "Yes" or flag == True:
        collection_chat.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$pop": {"chats": 1},
                "$set": {"updatedAt": datetime.utcnow()},
            },
        )

    if message.feedbackRegenerate == "Yes":
        chat = collection_chat.find_one({"_id": ObjectId(chat_id)})
        if chat and "chats" in chat and len(chat["chats"]) > 0:
            last_chat_index = len(chat["chats"]) - 1
            collection_chat.update_one(
                {
                    "_id": ObjectId(chat_id),
                    f"chats.{last_chat_index}.flag": {"$exists": False},
                },
                {
                    "$set": {
                        f"chats.{last_chat_index}.flag": True,
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )

    new_chat = {
        "_id": ObjectId(),
        "user": message.question,
        "ai": ai_text,
        "sources": sources,
    }

    update_fields = {
        "$push": {"chats": new_chat},
        "$set": {
            "updatedAt": datetime.utcnow(),
            "filtersMetadata": (
                message.filtersMetadata if message.filtersMetadata else []
            ),
            "isGPT": message.isGPT,
        },
    }

    collection_chat.update_one({"_id": ObjectId(chat_id)}, update_fields)

    chat = collection_chat.find_one({"_id": ObjectId(chat_id)})

    if chat and "chats" in chat:
        message_id = chat["chats"][-1]["_id"]

    return message_id


def create_search_kwargs(filters):
    if len(filters) == 1:
        filter_condition = {"Title": filters[0]}
    elif isinstance(filters, list):
        or_conditions = [{"Title": v} for v in filters]
        filter_condition = {"$or": or_conditions}

    search_kwargs = {"filter": filter_condition}

    return search_kwargs


def question_intent(question, chatHistory):
    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = """
        AI Assistant Instructions

        Role and Primary Task:
        You are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and generate informative and relevant responses. Your default source of information is the internal knowledge base.
        
        General Behavior:
        1. Respond to greetings warmly and briefly.
        2. If asked about your identity or capabilities, explain concisely that you're a RAG (Retrieval-Augmented Generation) chatbot with access to an internal knowledge base.
        3. Classify user input query intent into one of these categories: greeting/salutation, normal_rag, summary_rag.
        
        Strict Decision Protocol:
        
        1. normal_RAG (DEFAULT CATEGORY):
           - Purpose: Answering most questions using the internal knowledge base.
           - Use when: The query can be answered using internal information, which covers a wide range of topics including company data, reports, policies, product information, etc.
           - Always prioritize this category for most queries unless the query explicitly falls into another category.
           - This category also includes context-dependent follow-up questions like "Tell me more about it" or "Can you elaborate on that?"
        
        2. summary_rag:
           - Purpose: Addressing questions about overall content, main ideas, or summaries of entire documents from the internal knowledge base.
           - Use when: The query explicitly requires a broad understanding or overview of a document's content as a whole.
           - Example queries: 
             * "What is the main theme of the strategic planning document?"
             * "Summarize the key points of the entire document."
             * "Give me an overview of this document's content."
             * "What are the main topics covered throughout this document?"
        
        3. direct_response:
           - Purpose: Handling greetings, casual conversation, or very simple queries.
           - Use when: The user input is a greeting, expression of gratitude, or a very simple question that doesn't require accessing any knowledge base.
           - Example queries:
             * "Hello!"
             * "How are you?"
             * "Thank you for your help."
        
        Response Protocol:
        1. Always default to using the normal_rag category unless the query clearly falls into another category.
        2. Use the summary_rag category only when explicitly asked for document-wide summaries or overviews.
        3. Respond directly without using any tool for greetings, salutations, and casual conversation.
        4. For any responses:
           - Synthesize, process, or extract information to provide the final answer.
           - Do simply relay on raw data.
        
        Remember: 
        1. Your primary source of information is the internal knowledge base.
        2. Consider Previous Conversation before returning any response.
        
        User Query: "{question}"
        
        Previous Conversation: "{chat_history}"
        
        Please respond with the appropriate keyword based on the analysis of the user query:
        - "normal_rag"
        - "summary_rag"
        - "direct_response"
        
        """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_gpt
    )

    intent = chain.invoke(question)

    return intent.content


def standalone_question(question, chatHistory):
    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = """
            You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.
            When responding to a user's query, please ensure that your response:
            Is informative and comprehensive.
            Is clear and concise.
            Is relevant to the topic at hand.
            Adheres to the guidelines provided in the initial prompt.
            Is aligned with the specific context of the Scientia SharePoint portal.
            Remember to:
            Avoid providing personal opinions or beliefs.
            Base your responses solely on the information provided.
            Be respectful and polite in all interactions.
            Leverage the specific knowledge and resources available within the Scientia SharePoint portal.
            Given a chat history and the latest user question which might reference context in the chat history, \
            formulate a standalone question which can be understood without the chat history. Do NOT answer the question,\
            just reformulate it if needed and otherwise return it as is. Don't provide anything else, just provide the question\
            Chat History\
            {chat_history}
            User Question : \
            {question}
        """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_gpt
    )

    new_question = chain.invoke(question)

    return new_question.content


def create_new_title_chat(message: Message):
    title = create_new_title(message.question)
    new_chat = {
        "userEmailId": message.userEmailId,
        "title": title,
        "chats": [
            {
                "_id": ObjectId(),
                "user": message.question,
            }
        ],
        "filtersMetadata": (message.filtersMetadata if message.filtersMetadata else []),
        "isGPT": message.isGPT,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    inserted_chat = collection_chat.insert_one(new_chat)
    chat_id = inserted_chat.inserted_id

    return chat_id


# @app.middleware("http")
# async def validate_origins_and_cors(request: Request, call_next):
#     # security_header = request.headers.get("X-Security-Header")
#     # if security_header is None or security_header != os.environ.get("SECURITY_HEADER"):
#     #     return JSONResponse(
#     #         status_code=403, content={"message": "Access Denied: Authentication Failed"}
#     #     )

#     if request.method == "OPTIONS":
#         response = JSONResponse(status_code=204)
#     else:
#         response = await call_next(request)

#     # Add CORS headers to the response
#     response.headers["Access-Control-Allow-Origin"] = allowed_origins
#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
#     response.headers["Access-Control-Allow-Headers"] = (
#         "Content-Type, Authorization, X-Security-Header"
#     )

#     return response


@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI"}


@app.post("/")
async def generate_content(message: Message):
    async def content_generator_summary(question: str) -> AsyncGenerator[str, None]:
        try:
            global user_permissions, sources
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )

            retriever = MultiVectorRetriever(
                vectorstore=vectorstore_gpt_summary,
                docstore=loaded_docstore_gpt_summary,
                id_key="GatesVentures_Scientia_Summary",
                search_kwargs=search_kwargs,
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_gpt,
                "No",
                message.filters,
                message.chatHistory,
                "No",
                "summary",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if (
                "I am not able to provide a response as it is not there in the context."
                in ai_text
            ):
                sources.clear()

            if not message.filters:
                if count_restriction == 4:
                    sources.update({"Note: This is a Restricted Answer": ""})

            message_id = update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                sources,
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator(question: str) -> AsyncGenerator[str, None]:
        try:
            global user_permissions, sources, num_of_images
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )
            retriever = MultiVectorRetriever(
                vectorstore=vectorstore_gpt,
                docstore=loaded_docstore_gpt,
                id_key="GatesVentures_Scientia",
                search_kwargs=search_kwargs,
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_gpt,
                message.image,
                message.filters,
                message.chatHistory,
                message.reason,
                "normal",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if (
                "I am not able to provide a response as it is not there in the context."
                in ai_text
            ):
                sources.clear()

            if not message.filters:
                if count_restriction == 4:
                    sources.update({"Note: This is a Restricted Answer": ""})

            message_id = update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                sources,
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator_GPT(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            model = AzureChatOpenAI(
                api_key=os.environ["AZURE_OPENAI_API_KEY"],
                openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_35"],
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            )

            prompt_text = """
                Please answer the following question based on the given conversation history. \
                Use your own knowledge to answer the question. \
                Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.
                Conversation history  \
                {chat_history}
                User Question : \
                {question}
            """

            prompt = ChatPromptTemplate.from_template(prompt_text)

            chain = (
                {
                    "chat_history": lambda _: formatted_chat_history,
                    "question": lambda x: x,
                }
                | prompt
                | model
                | StrOutputParser()
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            message_id = update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                {"This response is generated by ChatGPT": ""},
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps(
                {
                    "type": "sources",
                    "content": {"This response is generated by ChatGPT": ""},
                }
            )
        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator_salutation(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            prompt_text = """
                You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.
                When responding to a user's query, please ensure that your response:
                Is informative and comprehensive.
                Is clear and concise.
                Is relevant to the topic at hand.
                Adheres to the guidelines provided in the initial prompt.
                Is aligned with the specific context of the Scientia SharePoint portal.
                Remember to:
                Avoid providing personal opinions or beliefs.
                Base your responses solely on the information provided.
                Be respectful and polite in all interactions.
                Leverage the specific knowledge and resources available within the Scientia SharePoint portal.
                The following is a conversation with a highly intelligent AI assistant. \
                The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \
                When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

            prompt = ChatPromptTemplate.from_template(prompt_text)

            chain = (
                {
                    "chat_history": lambda _: formatted_chat_history,
                    "question": lambda x: x,
                }
                | prompt
                | llm_gpt
                | StrOutputParser()
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            message_id = update_chat(
                message, ai_text, str(chat_id) if chat_id else message.chatId, flag
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": None})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    try:
        question = (
            standalone_question(message.question, message.chatHistory)
            if message.chatHistory
            else message.question
        )

        if message.isGPT:
            generator = content_generator_GPT(question)
        else:
            question_intent_response = question_intent(question, message.chatHistory)
            if "direct_response" in question_intent_response:
                generator = content_generator_salutation(question)
            elif "normal_rag" in question_intent_response:
                generator = content_generator(question)
            elif "summary_rag" in question_intent_response:
                generator = content_generator_summary(question)

        return StreamingResponse(generator, media_type="application/json")
    except Exception as e:
        logging.error(f"An Error Occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
