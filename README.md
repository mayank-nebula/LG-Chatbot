import io
import re
import os
import base64
import pickle
import json

import chromadb
from chromadb.config import Settings
from PIL import Image
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableParallel
from langchain_community.vectorstores import Chroma
from langchain.retrievers.multi_vector import MultiVectorRetriever

settings = Settings(anonymized_telemetry=False)
load_dotenv()

with open('config.json', 'r') as confile_file:
    config = json.load(confile_file)

base_url = config['ollama']['base_url']
nomic = config['ollama']['embeddings']['nomic']
llava_llama3 = config['ollama']['models']['llava-llama3-fp16']

current_dir = os.getcwd()
user_permissions = []
sources = set()
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

embeddings = OllamaEmbeddings(base_url = base_url, model=nomic)
vectorstore = Chroma(
    collection_name="GV_Test_MV_1", client=chroma_client, embedding_function=embeddings
)

docstore_path = os.path.join(current_dir, "docstore_1.pkl")

with open(docstore_path, "rb") as f:
    loaded_docstore = pickle.load(f)

retriever = MultiVectorRetriever(
    vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1"
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
            file_permission_list = file_permission.split(';')

            if not file_permission_list or any(element in file_permission_list for element in user_permissions):
                doc_content = doc.page_content
                sources.add(doc.metadata["source"])
                if looks_like_base64(doc_content) and is_image_data(doc_content):
                    doc_content = resize_base64_image(doc_content, size=(1300, 600))
                    b64_images.append(doc_content)
                else:
                    texts.append(doc_content)
            else:
                continue

    hasDocs = len(b64_images) > 0 or len(texts) > 0

    return {
        "images": b64_images,
        "texts": texts,
        "hasDocs": hasDocs
    }


def img_prompt_func(data_dict):
    """Join the context into a single string"""
    if hasDocs:
        formatted_texts = "\n".join(data_dict["context"]["texts"])
        chat_history = "\n".join([f"Q: {chat['user']}\nA: {chat['ai']}"for chat in data_dict["context"]["chat_history"]])

        messages = []

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
                "1. Analyze and interpret text, tables, and images (including photographs, graphs, and charts).\n"
                "2. Maintain context from previous conversations to ensure coherent and relevant responses.\n"
                "3. Synthesize information from multiple sources to provide comprehensive answers.\n\n"

                "Instructions:\n"
                "1. Carefully examine all provided information: text, tables, and images.\n"
                "2. For images:\n"
                "   - Describe key visual elements in detail.\n"
                "   - If charts or graphs are present, extract and interpret the data.\n"
                "   - Explain how the image relates to the text and question.\n"
                "3. Consider the chat history to maintain conversation continuity.\n"
                "4. Provide a well-structured, accurate response that directly addresses the user's question.\n"
                "5. If certain information is missing or unclear, acknowledge this in your response.\n"
                "6. Do not mention anything about the data sources or related information.\n"
                "7. Do not say anything like 'the user\'s question was' or related to this in the answer.\n\n"

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
    else:
        return [HumanMessage(content=f"Please answer this question to the best of your ability: {data_dict['question']}")]


def multi_modal_rag_chain_source(retriever, chatHistory):
    """Multi-modal RAG chain"""
    model = ChatOllama(model=llava_llama3, base_url = base_url)

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "chat_history": chatHistory,
        }
        return context

    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types) | RunnableLambda(combined_context),
            "question": RunnablePassthrough()
        }
        | RunnableLambda(img_prompt_func)
        | model
        | StrOutputParser()
    )

    return chain


def create_retriever(filters):
    if not filters:
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
        )
        return retriever

    if isinstance(filters, list):
        or_conditions = [
            {"Title":v} for v in filters
        ]
        filter_condition = {"$or":or_conditions}
    else:
        filter_condition = {"Title": filters}
    
    search_kwargs = {"filter" : filter_condition}
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
        search_kwargs=search_kwargs
    )
    return retriever

def process_question(question, chatHistory, permissions, filters):
    """Process a question and return the answer"""
    global user_permissions
    user_permissions = permissions.copy()
    retriever = create_retriever(filters)
    chain = multi_modal_rag_chain_source(retriever, chatHistory)
    response = chain.invoke(question)
    return response, list(sources)
