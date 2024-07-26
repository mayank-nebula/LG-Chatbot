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
from langchain.schema import HumanMessage
from langchain_openai import AzureChatOpenAI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
from chromadb.config import Settings
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
import io
import re
import os
import json
import pickle
import base64
import chromadb
from PIL import Image

settings = Settings(anonymized_telemetry=False)
load_dotenv()

current_dir = os.getcwd()
user_permissions = []
sources = {}
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

with open("config.json", "r") as confile_file:
    config = json.load(confile_file)
base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava_llama3 = config["ollama"]["models"]["llava-llama3-fp16"]
# llama3 = config["ollama"]["models"]["llama3.1-8B"]


embeddings_ollama = OllamaEmbeddings(base_url=base_url, model=nomic)
vectorstore_ollama = Chroma(
    collection_name="GV_Test_OCR_50_ollama",
    client=chroma_client,
    embedding_function=embeddings_ollama,
)
docstore_path_ollama = os.path.join(current_dir, "GV_Test_OCR_50_ollama.pkl")
with open(docstore_path_ollama, "rb") as f:
    loaded_docstore_ollama = pickle.load(f)
retriever_ollama = MultiVectorRetriever(
    vectorstore=vectorstore_ollama,
    docstore=loaded_docstore_ollama,
    id_key="GV_Test_OCR_50_ollama",
)


embeddings_gpt = AzureOpenAIEmbeddings(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment="text-embedding-3-large-1",
)
vectorstore_gpt = Chroma(
    collection_name="GV_Test_OCR_50_GPT",
    client=chroma_client,
    embedding_function=embeddings_gpt,
)
docstore_path_gpt = os.path.join(current_dir, "GV_Test_OCR_50_GPT.pkl")
with open(docstore_path_gpt, "rb") as f:
    loaded_docstore_gpt = pickle.load(f)
retriever_gpt = MultiVectorRetriever(
    vectorstore=vectorstore_gpt,
    docstore=loaded_docstore_gpt,
    id_key="GV_Test_OCR_50_GPT",
)

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
    max_retries=20,
)


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
    image: str = "Yes"
    llm: str = "GPT"
    chatId: str = ""
    userEmailId: str = ""


prompt = ChatPromptTemplate.from_template("{message}")
parser = StrOutputParser()


def is_generalChat(question: str) -> bool:
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


def standalone_question(question, chatHistory, llm):
    if llm == "GPT":
        llm_to_use = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            temperature=0,
            max_retries=20,
        )
    else:
        llm_to_use = ChatOllama(
            temperature=0, model="llama3:latest", base_url="http://10.0.0.4:11434"
        )

    chat_history = "\n".join(
        [f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chatHistory]
    )

    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
        "Don't provide anything else, just provide the question"
        f"Chat History - {chat_history}"
        "{element}"
    )
    prompt = ChatPromptTemplate.from_template(contextualize_q_system_prompt)
    summarize_chain = {"element": lambda x: x} | prompt | llm_to_use | StrOutputParser()

    new_question = summarize_chain.invoke(question)
    return new_question


def looks_like_base64(sb):
    """Check if the string looks like base64"""
    try:
        return base64.b64encode(base64.b64decode(sb)) == sb.encode()
    except Exception:
        return False


def is_image_data(b64data):
    """Check if the base64 data is an image by looking at the start of the data"""
    image_signatures = {
        b"\xff\xd8\xff": "jpg",
        b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "png",
        b"\x47\x49\x46\x38": "gif",
        b"\x52\x49\x46\x46": "webp",
    }
    try:
        header = base64.b64decode(b64data)[:8]
        for sig, format in image_signatures.items():
            if header.startswith(sig):
                return True
        return False
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
    global sources
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
                doc_content = json.loads(doc.page_content)
                title = doc.metadata["Title"]
                link = doc.metadata["source"]
                slide_number = doc.metadata["slide_number"]

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
                        doc_content["content"], size=(250, 250)
                    )
                    b64_images.append(resized_image)
                else:
                    texts.append(doc_content["content"])

                summary.append(doc_content["summary"])

            else:
                continue

    return {"images": b64_images, "texts": texts, "summary": summary}


def img_prompt_func(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
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
            "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
            "Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n"
            "Maintain context from previous conversations to ensure coherent and relevant responses.\n\n"
            f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
            f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
            f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
        ),
    }
    messages.append(text_message)

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(retriever, llm_to_use, llm, image, filters):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "llm": llm,
            "image_present": image,
            "filters": filters,
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


def create_retriever(filters, stores):
    if len(filters) == 1:
        filter_condition = {"Title": filters[0]}
    elif isinstance(filters, list):
        or_conditions = [{"Title": v} for v in filters]
        filter_condition = {"$or": or_conditions}

    search_kwargs = {"filter": filter_condition}
    print(search_kwargs)

    if stores == "GPT":
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore_gpt,
            docstore=loaded_docstore_gpt,
            id_key="GV_Test_OCR_50_GPT",
            search_kwargs=search_kwargs,
        )
    else:
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore_ollama,
            docstore=loaded_docstore_ollama,
            id_key="GV_Test_OCR_50_ollama",
            search_kwargs=search_kwargs,
        )

    return retriever
