# from flask import Flask, request, jsonify
# from flask_cors import CORS
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Any
import uvicorn

import io
import re
import os
import json
import pickle
import base64
import chromadb
from PIL import Image
from dotenv import load_dotenv
from chromadb.config import Settings
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

app = FastAPI()

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
llama3 = config["ollama"]["models"]["llama3-8B"]


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


def looks_like_base64(sb):
    """Check if the string looks like base64"""
    return re.match("^[A-Za-z0-9+/]+[=]{0,2}$", sb) is not None


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

                if looks_like_base64(doc_content["content"]) and is_image_data(
                    doc_content["content"]
                ):
                    resized_image = resize_base64_image(
                        doc_content["content"], size=(1300, 600)
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
    formatted_summary = "\n".join(data_dict["context"]["summary"])
    chat_history = "\n".join(
        [
            f"Human: {chat['user']}\nAssistant: {chat['ai']}"
            for chat in data_dict["context"]["chat_history"]
        ]
    )

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

    text_message = {
        "type": "text",
        "text": (
            "From the given context, please provide a well-articulated response to the asked question.\n"
            "Make sure not to provide an answer from your own knowledge.\n"
            "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
            "Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n"
            "Maintain context from previous conversations to ensure coherent and relevant responses.\n\n"
            f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
            "Previous conversation:\n"
            f"{chat_history if chat_history else 'No previous conversation.'}\n\n"
            f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
            f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
        ),
    }
    messages.append(text_message)

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(
    retriever, chatHistory, llm_to_use, llm, image, filters
):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "chat_history": chatHistory,
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


async def process_question(
    question, chatHistory, permissions, filters, stores, image, llm
):
    """Process a question and return the answer"""
    global user_permissions, sources
    user_permissions = permissions.copy()
    sources.clear()

    if filters:
        retriever = create_retriever(filters, stores)
    else:
        retriever = retriever_gpt if stores == "GPT" else retriever_ollama

    if image == "Yes":
        if llm == "GPT":
            llm_to_use = llm_gpt
        else:
            llm_to_use = ChatOllama(
                temperature=0,
                model=llava_llama3,
                base_url=base_url,
            )
    else:
        if llm == "GPT":
            llm_to_use = llm_gpt
        else:
            llm_to_use = ChatOllama(temperature=0, model=llama3, base_url=base_url)

    chain = multi_modal_rag_chain_source(
        retriever, chatHistory, llm_to_use, llm, image, filters
    )

    # response = chain.invoke(question)

    # return response, sources

    async for chunk in chain.astream(question):
        content = chunk.replace("\n", "<br>")
        yield f"data: {content}"


class RequestData(BaseModel):
    question: str
    chat_history: Optional[list[Any]] = None
    userPermissions: Optional[list[str]] = None
    filters: Optional[list[str]] = None
    stores: Optional[str] = None
    image: Optional[str] = None
    llm: Optional[str] = None


@app.route("/flask", methods=["POST"])
async def process(request_data: RequestData):
    question = request_data.question
    chatHistory = request_data.chat_history
    permissions = request_data.userPermissions
    filters = request_data.filters
    stores = request_data.stores
    image = request_data.image
    llm = request_data.llm

    if not question:
        return HTTPException(status_code=400, detail="No question provided")

    try:
        # response, sources = process_question(
        #     question, chatHistory, permissions, filters, stores, image, llm
        # )
        # return {"response": response, "sources": sources}
        return StreamingResponse(
            process_question(
                question, chatHistory, permissions, filters, stores, image, llm
            ),
            media_type="text/event-stream",
        )
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
