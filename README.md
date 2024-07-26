import os
import re
import io
import json
import base64
import pickle
from typing import List

import pandas as pd
from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel

from langchain.schema import HumanMessage
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from chromadb.config import Settings

# Load environment variables
load_dotenv()

# Initialize settings and current directory
settings = Settings(anonymized_telemetry=False)
current_dir = os.getcwd()

# Load configurations
with open("config.json", "r") as config_file:
    config = json.load(config_file)
base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava_llama3 = config["ollama"]["models"]["llava-llama3-fp16"]

# Initialize embedding models and vector stores
embeddings_ollama = OllamaEmbeddings(base_url=base_url, model=nomic)
embeddings_gpt = AzureOpenAIEmbeddings(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment="text-embedding-3-large-1",
)

# Initialize Chroma clients
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

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

# Load document stores
with open(os.path.join(current_dir, "GV_Test_OCR_50_ollama.pkl"), "rb") as f:
    loaded_docstore_ollama = pickle.load(f)
with open(os.path.join(current_dir, "GV_Test_OCR_50_GPT.pkl"), "rb") as f:
    loaded_docstore_gpt = pickle.load(f)

# Initialize retrievers
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

# Initialize LLMs
llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    temperature=0,
    max_retries=20,
)

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB client
client = MongoClient("mongodb://localhost:27017/")
db = client["GV_Test"]
collection_user = db["users"]
collection_chat = db["chats"]

# Load user permissions
permission_df = pd.read_csv("/home/Mayank.Sharma/GV_Test/backend/fast/users_permission.csv")
user_permissions = permission_df[permission_df["UserLookupId"] == 194]["Permissions"].iloc[0].split(";")

# Define Pydantic model for request body
class Message(BaseModel):
    question: str
    chatHistory: List[dict] = []
    filters: List[str] = []
    stores: str = "GPT"
    image: str = "Yes"
    llm: str = "GPT"
    chatId: str = ""
    userEmailId: str = ""

# Define prompt and parser
prompt = ChatPromptTemplate.from_template("{message}")
parser = StrOutputParser()

def is_generalChat(question: str) -> bool:
    salutations = [
        r"^hello$", r"^hi$", r"^hey$", r"^good morning$", r"^good afternoon$",
        r"^good evening$", r"^greetings$", r"^what's up$", r"^howdy$", r"^hi there$"
    ]
    return any(re.compile(salutation, re.IGNORECASE).match(question.strip()) for salutation in salutations)

def standalone_question(question, chatHistory, llm):
    llm_to_use = llm_gpt if llm == "GPT" else ChatOllama(
        temperature=0, model="llama3:latest", base_url="http://10.0.0.4:11434"
    )

    chat_history = "\n".join([f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chatHistory])
    contextualize_q_system_prompt = (
        f"Given a chat history and the latest user question which might reference context in the chat history, "
        "formulate a standalone question which can be understood without the chat history. "
        "Do NOT answer the question, just reformulate it if needed and otherwise return it as is."
        f"Chat History - {chat_history}{question}"
    )
    prompt = ChatPromptTemplate.from_template(contextualize_q_system_prompt)
    summarize_chain = {"element": lambda x: x} | prompt | llm_to_use | StrOutputParser()
    return summarize_chain.invoke(question)

def looks_like_base64(sb):
    try:
        return base64.b64encode(base64.b64decode(sb)) == sb.encode()
    except Exception:
        return False

def is_image_data(b64data):
    image_signatures = {
        b"\xff\xd8\xff": "jpg",
        b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "png",
        b"\x47\x49\x46\x38": "gif",
        b"\x52\x49\x46\x46": "webp",
    }
    try:
        header = base64.b64decode(b64data)[:8]
        return any(header.startswith(sig) for sig in image_signatures)
    except Exception:
        return False

def resize_base64_image(base64_string, size=(128, 128)):
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    resized_img = img.resize(size, Image.LANCZOS)
    buffered = io.BytesIO()
    resized_img.save(buffered, format=img.format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def split_image_text_types(docs):
    global sources
    b64_images, texts, summary = [], [], []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            if any(element in file_permission_list for element in user_permissions):
                doc_content = json.loads(doc.page_content)
                title, link, slide_number = doc.metadata["Title"], doc.metadata["source"], doc.metadata["slide_number"]
                existing_key = next((k for k in sources.keys() if k.startswith(title)), None)
                new_key = f"{title} - {slide_number}" if not existing_key else existing_key + f", {slide_number}"
                sources[new_key] = sources.pop(existing_key, link)
                if looks_like_base64(doc_content["content"]):
                    b64_images.append(resize_base64_image(doc_content["content"], size=(250, 250)))
                else:
                    texts.append(doc_content["content"])
                summary.append(doc_content["summary"])
    return {"images": b64_images, "texts": texts, "summary": summary}

def img_prompt_func(data_dict):
    messages = []
    if data_dict["context"]["image_present"] == "Yes":
        if data_dict["context"]["llm"] == "GPT":
            for image in data_dict["context"]["images"]:
                messages.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}})
        else:
            for image in data_dict["context"]["images"]:
                messages.append({"type": "image_url", "image_url": image})
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
            f"{'Original content: ' if data_dict['context']['texts'] else ''}{'\n'.join(data_dict['context']['texts'])}\n"
            f"{'Summary content: ' if formatted_summary else ''}{formatted_summary}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
        ),
    }
    messages.append(text_message)
    return [HumanMessage(content=messages)]

def multi_modal_rag_chain_source(retriever, llm_to_use, llm, image, filters):
    def combined_context(data_dict):
        return {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "llm": llm,
            "image_present": image,
            "filters": filters,
        }
    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types) | RunnableLambda(combined_context),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | llm_to_use
        | StrOutputParser()
    )
    return chain

def create_retriever(filters, stores):
    filter_condition = {"$or": [{"Title": v} for v in filters]} if len(filters) > 1 else {"Title": filters[0]}
    search_kwargs = {"filter": filter_condition}
    vectorstore, docstore, id_key = (vectorstore_gpt, loaded_docstore_gpt, "GV_Test_OCR_50_GPT") if stores == "GPT" else (vectorstore_ollama, loaded_docstore_ollama, "GV_Test_OCR_50_ollama")
    return MultiVectorRetriever(vectorstore=vectorstore, docstore=docstore, id_key=id_key, search_kwargs=search_kwargs)
