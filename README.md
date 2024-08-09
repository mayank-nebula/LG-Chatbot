import os
import io
import csv
import json
import pickle
import base64
import logging
import chromadb
import tiktoken
import pandas as pd
from PIL import Image
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient
from chromadb.config import Settings
from langchain.schema import HumanMessage
from fastapi import FastAPI, HTTPException
from typing import Any, List, AsyncGenerator
from langchain_core.documents import Document
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough


load_dotenv()

settings = Settings(anonymized_telemetry=False)
current_dir = os.getcwd()

user_permissions = []
sources = {}
count_restriction = 0
num_of_images = 0
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

with open("config.json", "r") as confile_file:
    config = json.load(confile_file)
base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava_llama3 = config["ollama"]["models"]["llava-llama3-fp16"]
llama3_1 = config["ollama"]["models"]["llama3.1-8B"]


embeddings_ollama = OllamaEmbeddings(base_url=base_url, model=nomic)
embeddings_gpt = AzureOpenAIEmbeddings(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment="text-embedding-3-large-1",
)

vectorstore_ollama = Chroma(
    collection_name="GV_Test_OCR_50_ollama",
    client=chroma_client,
    embedding_function=embeddings_ollama,
)
vectorstore_gpt = Chroma(
    collection_name="GV_Test_OCR_50_GPT",
    client=chroma_client,
    embedding_function=embeddings_gpt,
)
vectorstore_ollama_summary = Chroma(
    collection_name="GV_Test_OCR_50_ollama_summary",
    client=chroma_client,
    embedding_function=embeddings_ollama,
)
vectorstore_gpt_summary = Chroma(
    collection_name="GV_Test_OCR_50_GPT_summary",
    client=chroma_client,
    embedding_function=embeddings_gpt,
)

with open(
    os.path.join(current_dir, "docstores", "GV_Test_OCR_50_ollama.pkl"), "rb"
) as f:
    loaded_docstore_ollama = pickle.load(f)
with open(os.path.join(current_dir, "docstores", "GV_Test_OCR_50_GPT.pkl"), "rb") as f:
    loaded_docstore_gpt = pickle.load(f)
with open(
    os.path.join(current_dir, "docstores", "GV_Test_OCR_50_ollama_summary.pkl"), "rb"
) as f:
    loaded_docstore_ollama_summary = pickle.load(f)
with open(
    os.path.join(current_dir, "docstores", "GV_Test_OCR_50_GPT_summary.pkl"), "rb"
) as f:
    loaded_docstore_gpt_summary = pickle.load(f)

retriever_ollama = MultiVectorRetriever(
    vectorstore=vectorstore_ollama,
    docstore=loaded_docstore_ollama,
    id_key="GV_Test_OCR_50_ollama",
)
retriever_gpt = MultiVectorRetriever(
    vectorstore=vectorstore_gpt,
    docstore=loaded_docstore_gpt,
    id_key="GV_Test_OCR_50_GPT",
)
retriever_ollama_summary = MultiVectorRetriever(
    vectorstore=vectorstore_ollama_summary,
    docstore=loaded_docstore_ollama_summary,
    id_key="GV_Test_OCR_50_ollama_summary",
)
retriever_gpt_summary = MultiVectorRetriever(
    vectorstore=vectorstore_gpt_summary,
    docstore=loaded_docstore_gpt_summary,
    id_key="GV_Test_OCR_50_GPT_summary",
)

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
    max_retries=3,
)

encoding = tiktoken.get_encoding("o200k_base")
token_csv_file_path = os.path.join(current_dir, "utils", "token_counts.csv")
permission_df = pd.read_csv(os.path.join(current_dir, "utils", "users_permission.csv"))

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


class Message(BaseModel):
    question: str
    chatId: str = ""
    chatHistory: List[Any] = []
    filters: List[str] = []
    stores: str = "GPT"
    image: str = "Yes"
    llm: str = "GPT"
    userEmailId: str = ""
    regenerate: str = "No"
    feedbackRegenerate: str = "No"
    reason: str = ""
    userLookupId: int = 194


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


def split_image_text_types(docs):
    """Split base64-encoded images, texts, and metadata"""
    global sources, count_restriction, num_of_images
    num_of_images = 0
    count_restriction = 0
    b64_images = []
    texts = []
    summary = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                count_restriction += 1
                doc_content = json.loads(doc.page_content)
                title = doc.metadata["Title"]
                link = doc.metadata["source"]
                slide_number = doc.metadata.get("slide_number", "")

                existing_key = next(
                    (k for k in sources.keys() if k.startswith(title)), None
                )

                if existing_key:
                    new_key = existing_key + f", {slide_number}"
                    sources[new_key] = sources.pop(existing_key)
                else:
                    new_key = f"{title} - {slide_number}"
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
                continue

    return {"images": b64_images, "texts": texts, "summary": summary}


def img_prompt_func(data_dict):
    """Join the context into a single string"""
    global input_token
    input_token = 0
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    chatHistory = format_chat_history(data_dict["context"]["chatHistory"])
    reason = data_dict["context"]["reason"]
    formatted_summary = ""

    messages = []

    if data_dict["context"]["image_present"] == "Yes":
        if data_dict["context"]["llm"] == "GPT":
            if data_dict["context"]["images"]:
                for image in data_dict["context"]["images"]:
                    image_message = {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                    }
                    messages.append(image_message)
        else:
            if data_dict["context"]["images"]:
                for image in data_dict["context"]["images"]:
                    image_message = {
                        "type": "image_url",
                        "image_url": image,
                    }
                    messages.append(image_message)
    else:
        formatted_summary = "\n".join(data_dict["context"]["summary"])

    text_message = {
        "type": "text",
        "text": (
            "From the given context, please provide a well-articulated response to the asked question.\n"
            "Make sure not to provide an answer from your own knowledge.\n"
            # "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
            "Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n"
            "Maintain context from previous conversations to ensure coherent and relevant responses.\n\n"
            f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
            f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }"
            f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
            f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
            f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
            "Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed."
        ),
    }
    messages.append(text_message)

    input_token += len(encoding.encode(str(messages)))

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(
    retriever, llm_to_use, llm, image, filters, chatHistory, reason
):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "llm": llm,
            "image_present": image,
            "filters": filters,
            "chatHistory": chatHistory,
            "reason": reason,
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


def create_new_title(question, llm):
    llm_to_use = (
        llm_gpt
        if llm == "GPT"
        else ChatOllama(temperature=0, model=llama3_1, base_url=base_url)
    )

    prompt_text = (
        "Given the following question, create a concise and informative title that accuratelt reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n"
        "{element}"
    )

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_title = {"element": lambda x: x} | prompt | llm_to_use
    response = new_title.invoke(question)

    if llm == "GPT":
        token_count_reason = "Creating New Title"
        count_tokens(
            token_csv_file_path,
            token_count_reason,
            question,
            response.usage_metadata["input_tokens"],
            response.usage_metadata["output_tokens"],
            response.usage_metadata["total_tokens"],
            "False",
            0,
        )

    return response.content


def question_intent(question, chatHistory, llm):
    llm_to_use = (
        AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            max_retries=20,
        )
        if llm == "GPT"
        else ChatOllama(model=llama3_1, base_url=base_url)
    )

    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = """
        AI Assistant Instructions

        Role and Primary Task:
        You are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and generate informative and relevant responses. Your default source of information is the internal knowledge base.

        General Behavior:
        1. Respond to greetings warmly and briefly.
        2. If asked about your identity or capabilities, explain concisely that you're a RAG (Retrieval-Augmented Generation) chatbot with access to an internal knowledge base.
        3. Classify user input query intent into one of these categories: greeting/salutation, normal_rag, summary_rag, or external/general_knowledge.

        Strict Decision Protocol:

        1. normal_RAG (DEFAULT CATEGORY):
           - Purpose: Answering most questions using the internal knowledge base.
           - Use when: The query can be answered using internal information, which covers a wide range of topics including company data, reports, policies, product information, etc.
           - Always prioritize this category for most queries unless the query explicitly falls into another category.

        2. summary_RAG:
           - Purpose: Addressing questions about overall content, main ideas, or summaries of entire documents from the internal knowledge base.
           - Use when: The query explicitly requires a broad understanding or overview of a document's content.
           - Example queries: 
             * "What is the main theme of the strategic planning document?"
             * "Summarize the key points of this document."
             * "Tell me more about this document."
             * "What is in this document."
             * "Give me overview of this document."
             * "What is in this document."
             * "What are the main topics covered in this document."

        3. external_general_knowledge (USE ONLY WHEN EXPLICITLY REQUESTED):
           - Purpose: Answering questions that EXPLICITLY request external knowledge.
           - Use ONLY when: The user EXPLICITLY requests external knowledge using clear indicators like "@GK", "use general knowledge", "search from external sources", etc.
           - STRICTLY DO NOT use this category unless explicitly requested by the user, even if the internal knowledge base could provide an answer.
           - Example queries:
             * "What is the capital of France? @GK"
             * "Who is the current CEO of Google? Use general knowledge."

        4. direct_response:
           - Purpose: Handling greetings, casual conversation, or very simple queries.
           - Use when: The user input is a greeting, expression of gratitude, or a very simple question that doesn't require accessing any knowledge base.
           - Example queries:
             * "Hello!"
             * "How are you?"
             * "Thank you for your help."

        Response Protocol:
        1. Always default to using the normal_rag category unless the query clearly falls into another category.
        2. Use the summary_rag category only when explicitly asked for document summaries or overviews.
        3. Use the external_general_knowledge category ONLY when the user explicitly requests external knowledge with clear indicators.
        4. Respond directly without using any tool for greetings, salutations, and casual conversation.
        5. If the initial response is unsatisfactory, reconsider the normal_rag category if you haven't already, before considering other categories.
        6. For any responses:
           - Synthesize, process, or extract information to provide the final answer.
           - Do not simply relay raw data or links to the user.

        Remember: 
        1. Your primary source of information is the internal knowledge base. Always prioritize this over external sources unless explicitly instructed otherwise by the user.
        2. Consider Previous Conversation before returning any response.

        User Query: "{question}"

        Previous Conversation: "{chat_history}"

        Please respond with the appropriate keyword based on the analysis of the user query:
        - "normal_rag"
        - "summary_rag"
        - "external_general_knowledge"
        - "direct_response"
        """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_to_use
    )

    intent = chain.invoke(question)

    if llm == "GPT":
        count_tokens(
            token_csv_file_path,
            "Intent Identification",
            question,
            intent.usage_metadata["input_tokens"],
            intent.usage_metadata["output_tokens"],
            intent.usage_metadata["total_tokens"],
            "False",
            0,
        )

    return intent.content


def standalone_question(question, chatHistory, llm):
    llm_to_use = (
        AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            max_retries=20,
        )
        if llm == "GPT"
        else ChatOllama(model=llama3_1, base_url=base_url)
    )

    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = """
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
        | llm_to_use
    )

    new_question = chain.invoke(question)

    if llm == "GPT":
        count_tokens(
            token_csv_file_path,
            "Standalone Question",
            question,
            new_question.usage_metadata["input_tokens"],
            new_question.usage_metadata["output_tokens"],
            new_question.usage_metadata["total_tokens"],
            "False",
            0,
        )
    return new_question.content


def create_search_kwargs(filters):
    if len(filters) == 1:
        filter_condition = {"Title": filters[0]}
    elif isinstance(filters, list):
        or_conditions = [{"Title": v} for v in filters]
        filter_condition = {"$or": or_conditions}

    search_kwargs = {"filter": filter_condition}

    return search_kwargs


def update_chat(message: Message, ai_text: str, sources=None):
    chat_id = None
    message_id = None

    if message.chatId:
        if message.regenerate == "Yes":
            collection_chat.update_one(
                {"_id": ObjectId(message.chatId)},
                {
                    "$pop": {"chats": 1},
                    "$set": {"updatedAt": datetime.utcnow()},
                },
            )

        if message.feedbackRegenerate == "Yes":
            chat = collection_chat.find_one({"_id": ObjectId(message.chatId)})
            if chat and "chats" in chat and len(chat["chats"]) > 0:
                last_chat_index = len(chat["chats"]) - 1
                collection_chat.update_one(
                    {
                        "_id": ObjectId(message.chatId),
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

        collection_chat.update_one(
            {"_id": ObjectId(message.chatId)},
            {
                "$push": {"chats": new_chat},
                "$set": {"updatedAt": datetime.utcnow()},
            },
        )
        chat_id = ObjectId(message.chatId)
    else:
        title = create_new_title(message.question, message.llm)
        new_chat = {
            "userEmailId": message.userEmailId,
            "title": title,
            "chats": [
                {
                    "_id": ObjectId(),
                    "user": message.question,
                    "ai": ai_text,
                    "sources": sources,
                }
            ],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        inserted_chat = collection_chat.insert_one(new_chat)
        chat_id = inserted_chat.inserted_id

    chat = collection_chat.find_one({"_id": chat_id})
    if chat and "chats" in chat:
        message_id = chat["chats"][-1]["_id"]

    return chat_id, message_id


def count_tokens(
    file_path,
    token_count_reason,
    question,
    input_token,
    output_token,
    token_count,
    embeddings,
    images,
    flag=False,
):
    file_exists = os.path.isfile(file_path)

    with open(file_path, mode="a", newline="") as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow(
                [
                    "Token Count Reason",
                    "Question",
                    "Input Count",
                    "Output Count",
                    "Token Count",
                    "Embeddings",
                    "Images",
                ]
            )

        writer.writerow(
            [
                token_count_reason,
                question,
                input_token,
                output_token,
                token_count,
                embeddings,
                images,
            ]
        )

        if flag:
            writer.writerow([])


@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI"}


@app.post("/")
async def generate_content(message: Message):
    async def content_generator_summary(question: str) -> AsyncGenerator[str, None]:
        try:
            ai_text = ""
            output_token = 0
            token_count_reason = "Question Answer from Summary RAG"
            global user_permissions, sources
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )
            retriever = MultiVectorRetriever(
                vectorstore=(
                    vectorstore_gpt_summary
                    if message.stores == "GPT"
                    else vectorstore_ollama_summary
                ),
                docstore=(
                    loaded_docstore_gpt_summary
                    if message.stores == "GPT"
                    else loaded_docstore_ollama_summary
                ),
                id_key=(
                    "GV_Test_OCR_50_GPT_summary"
                    if message.stores == "GPT"
                    else "GV_Test_OCR_50_ollama_summary"
                ),
                search_kwargs=search_kwargs,
            )

            llm_to_use = (
                llm_gpt
                if message.llm == "GPT"
                else ChatOllama(temperature=0, model=llama3_1, base_url=base_url)
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_to_use,
                message.llm,
                "No",
                message.filters,
                message.chatHistory,
                "No",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                if message.llm == "GPT":
                    output_token += len(encoding.encode(chunk))
                yield json.dumps({"type": "text", "content": chunk})

            if count_restriction < 4:
                sources.update({"Note: This is a Restricted Answer": ""})

            chat_id, message_id = update_chat(message, ai_text, sources)

            if message.llm == "GPT":
                count_tokens(
                    token_csv_file_path,
                    token_count_reason,
                    message.question,
                    input_token,
                    output_token,
                    input_token + output_token,
                    "True",
                    0,
                    True,
                )

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def content_generator(question: str) -> AsyncGenerator[str, None]:
        try:
            ai_text = ""
            output_token = 0
            token_count_reason = "Question Answer from Normal RAG"
            global user_permissions, sources, input_token, num_of_images
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )
            retriever = MultiVectorRetriever(
                vectorstore=(
                    vectorstore_gpt if message.stores == "GPT" else vectorstore_ollama
                ),
                docstore=(
                    loaded_docstore_gpt
                    if message.stores == "GPT"
                    else loaded_docstore_ollama
                ),
                id_key=(
                    "GV_Test_OCR_50_GPT"
                    if message.stores == "GPT"
                    else "GV_Test_OCR_50_ollama"
                ),
                search_kwargs=search_kwargs,
            )

            llm_to_use = (
                llm_gpt
                if message.llm == "GPT"
                else ChatOllama(
                    temperature=0,
                    model=llava_llama3 if message.image == "Yes" else llama3_1,
                    base_url=base_url,
                )
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_to_use,
                message.llm,
                message.image,
                message.filters,
                message.chatHistory,
                message.reason,
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                if message.llm == "GPT":
                    output_token += len(encoding.encode(chunk))
                yield json.dumps({"type": "text", "content": chunk})

            if count_restriction < 4:
                sources.update({"Note: This is a Restricted Answer": ""})

            chat_id, message_id = update_chat(message, ai_text, sources)

            if message.llm == "GPT":
                count_tokens(
                    token_csv_file_path,
                    token_count_reason,
                    message.question,
                    input_token,
                    output_token,
                    input_token + output_token,
                    "True",
                    num_of_images,
                    True,
                )

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
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
            input_token = 0
            output_token = 0
            token_count_reason = "Question Answer from GPT"

            model = AzureChatOpenAI(
                api_key=os.environ["AZURE_OPENAI_API_KEY"],
                openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            )

            prompt_text = """
                Please answer the following question based on the given conversation history. \
                Use your own knowledge to answer the question. \
                Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

            prompt = ChatPromptTemplate.from_template(prompt_text)

            input_token += len(
                encoding.encode(
                    prompt.format(
                        chat_history=formatted_chat_history, question=question
                    )
                )
            )

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
                if message.llm == "GPT":
                    output_token += len(encoding.encode(chunk))
                yield json.dumps({"type": "text", "content": chunk})

            chat_id, message_id = update_chat(
                message, ai_text, {"This response is generated by ChatGPT": ""}
            )

            if message.llm == "GPT":
                count_tokens(
                    token_csv_file_path,
                    token_count_reason,
                    message.question,
                    input_token,
                    output_token,
                    input_token + output_token,
                    "False",
                    0,
                    True,
                )

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
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
            input_token = 0
            output_token = 0
            token_count_reason = "Question Answer for Salutation"

            model = (
                AzureChatOpenAI(
                    api_key=os.environ["AZURE_OPENAI_API_KEY"],
                    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                )
                if message.llm == "GPT"
                else ChatOllama(base_url=base_url, model=llama3_1)
            )

            prompt_text = """
                The following is a conversation with a highly intelligent AI assistant. \
                The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \
                When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

            prompt = ChatPromptTemplate.from_template(prompt_text)

            input_token += len(
                encoding.encode(
                    prompt.format(
                        chat_history=formatted_chat_history, question=question
                    )
                )
            )

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
                if message.llm == "GPT":
                    output_token += len(encoding.encode(chunk))
                yield json.dumps({"type": "text", "content": chunk})

            chat_id, message_id = update_chat(message, ai_text)

            if message.llm == "GPT":
                count_tokens(
                    token_csv_file_path,
                    token_count_reason,
                    message.question,
                    input_token,
                    output_token,
                    input_token + output_token,
                    "False",
                    0,
                    True,
                )

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": None})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    try:
        question = (
            standalone_question(message.question, message.chatHistory, message.llm)
            if message.chatHistory
            else message.question
        )

        question_intent_response = question_intent(
            question, message.chatHistory, message.llm
        )

        if "direct_response" in question_intent_response:
            generator = content_generator_salutation(question)
        elif "external_general_knowledge" in question_intent_response:
            generator = content_generator_GPT(question)
        elif "normal_rag" in question_intent_response:
            generator = content_generator(question)
        elif "summary_rag" in question_intent_response:
            generator = content_generator_summary(question)
        return StreamingResponse(generator, media_type="application/json")
    except Exception as e:
        logging.error(f"An Error Occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
