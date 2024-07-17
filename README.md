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
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

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
    b64_images = []
    texts = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")

            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                doc_content = doc.page_content
                title = doc.metadata["Title"]
                link = doc.metadata["source"]
                slide_number = doc.metadata["slide_number"]

                concatinated_title = f"{title} - {slide_number}"

                if concatinated_title in sources:
                    if link in sources[concatinated_title]:
                        continue
                    else:
                        sources[concatinated_title].append(link)
                else:
                    sources[concatinated_title] = link

                if looks_like_base64(doc_content) and is_image_data(doc_content):
                    doc_content = resize_base64_image(doc_content, size=(1300, 600))
                    b64_images.append(doc_content)
                else:
                    texts.append(doc_content)
            else:
                continue

    return {
        "images": b64_images,
        "texts": texts,
    }


def img_prompt_func(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    chat_history = "\n".join(
        [
            f"Q: {chat['user']}\nA: {chat['ai']}"
            for chat in data_dict["context"]["chat_history"]
        ]
    )

    messages = []

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
            "You are an advanced AI assistant with multimodal capabilities, designed to provide accurate and insightful responses based on given context, previous conversations, and visual information.\n\n"
            "Role and Capabilities:\n"
            "1. Analyze and interpret text, and images (including photographs, graphs, and charts).\n"
            "2. Maintain context from previous conversations to ensure coherent and relevant responses.\n"
            "3. Synthesize information from multiple sources to provide comprehensive answers.\n\n"
            "Instructions:\n"
            "1. Carefully examine all provided information: text, and images.\n"
            "2. Consider the chat history to maintain conversation continuity.\n"
            "3. Provide a well-structured, accurate response that directly addresses the user's question.\n"
            "4. If certain information is missing or unclear, acknowledge this in your response.\n"
            "5. Do not mention anything about the data sources or related information.\n"
            "6. Do not say anything like 'the user's question was' or related to this in the answer.\n"
            "7. If you dont know the answer for the question. Do not answer from the provided content.\n"
            f"User's question: {data_dict['question']}\n\n"
            "Previous conversation:\n"
            f"{chat_history}\n\n"
            "Current context (text and/or tables):\n"
            f"{formatted_texts}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
        ),
    }
    messages.append(text_message)

    return [HumanMessage(content=messages)]


def img_prompt_func_1(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    chat_history = "\n".join(
        [
            f"Q: {chat['user']}\nA: {chat['ai']}"
            for chat in data_dict["context"]["chat_history"]
        ]
    )

    messages = []

    text_message = {
        "type": "text",
        "text": (
            "You are an advanced AI assistant with multimodal capabilities, designed to provide accurate and insightful responses based on given context, previous conversations, and visual information.\n\n"
            "Role and Capabilities:\n"
            "1. Analyze and interpret text, and images (including photographs, graphs, and charts).\n"
            "2. Maintain context from previous conversations to ensure coherent and relevant responses.\n"
            "3. Synthesize information from multiple sources to provide comprehensive answers.\n\n"
            "Instructions:\n"
            "1. Carefully examine all provided information: text, and images.\n"
            "2. Consider the chat history to maintain conversation continuity.\n"
            "3. Provide a well-structured, accurate response that directly addresses the user's question.\n"
            "4. If certain information is missing or unclear, acknowledge this in your response.\n"
            "5. Do not mention anything about the data sources or related information.\n"
            "6. Do not say anything like 'the user's question was' or related to this in the answer.\n"
            "7. If you dont know the answer for the question. Do not answer from the provided content.\n"
            f"User's question: {data_dict['question']}\n\n"
            "Previous conversation:\n"
            f"{chat_history}\n\n"
            "Current context (text and/or tables):\n"
            f"{formatted_texts}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
        ),
    }
    messages.append(text_message)

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(retriever, chatHistory, llm_to_use, llm):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "chat_history": chatHistory,
            "llm": llm,
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


def multi_modal_rag_chain_source_1(retriever, chatHistory, llm):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "chat_history": chatHistory,
        }
        return context

    chain = (
        {
            "context": retriever
            | RunnableLambda(split_image_text_types)
            | RunnableLambda(combined_context),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func_1)
        | llm
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


def process_question(question, chatHistory, permissions, filters, stores, image, llm):
    """Process a question and return the answer"""
    global user_permissions
    user_permissions = permissions.copy()

    if filters:
        retriever = create_retriever(filters, stores)
    else:
        retriever = retriever_gpt if stores == "GPT" else retriever_ollama

    if image:
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

    if image:
        chain = multi_modal_rag_chain_source(retriever, chatHistory, llm_to_use, llm)
    else:
        chain = multi_modal_rag_chain_source_1(retriever, chatHistory, llm_to_use)

    response = chain.invoke(question)

    return response, sources
