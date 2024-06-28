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
chat_history = []
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

embeddings = OllamaEmbeddings(base_url = base_url, model=nomic)
vectorstore = Chroma(
    collection_name="GV_Test_MV", client=chroma_client, embedding_function=embeddings
)

docstore_path = os.path.join(current_dir, "docstore.pkl")

with open(docstore_path, "rb") as f:
    loaded_docstore = pickle.load(f)

retriever = MultiVectorRetriever(
    vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV"
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
            doc_content = doc.page_content
        else:
            doc_content = doc
        if looks_like_base64(doc_content) and is_image_data(doc_content):
            doc_content = resize_base64_image(doc_content, size=(1300, 600))
            b64_images.append(doc_content)
        else:
            texts.append(doc_content)

    return {
        "images": b64_images,
        "texts": texts,
    }


def img_prompt_func(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    # chats = "\n".join(
    #     [
    #         f"Q: {chat['user']}\nA: {chat['ai']}"
    #         for chat in data_dict["context"]["chat_history"]
    #     ]
    # )

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
            "You are an intelligent chatbot that has the ability to provide the perfect answer to user provided question based on the context given and the previous chat history.\n"
            "You will be given a mixed of text, tables, images (photographs, graphs, charts), and metadata."
            "All the above text, tables, images, and metadata will be retrieved from a vectorstore based on user-input keywords."
            "Please use your extensive knowledge and analytical skills to provide an answer to the question without mentioning about the database and do not mention about image just give response in plain text:\n"
            f"User-provided question: {data_dict['question']}\n\n"
            "Take the previous chats into consideration while answering the questions. The chats are given below:\n"
            # f"{chats}\n\n"
            "Current Text and/or tables context:\n"
            f"{formatted_texts}\n\n"
        ),
    }
    messages.append(text_message)

    return [HumanMessage(content=messages)]

# def img_prompt_func(data_dict):
#     """
#     Join the context into a single string
#     """
#     formatted_texts = "\n".join(data_dict["context"]["texts"])
#     chat_history = "\n".join([f"Q: {chat['query']}\nA: {chat['response']}" for chat in data_dict["context"]["chat_history"]])
#     messages = []


#     # Adding image(s) to the messages if present
#     if data_dict["context"]["images"]:
#         for image in data_dict["context"]["images"]:
#             image_message = {
#                 "type": "image_url",
                # "image_url": image,
#             }
#             messages.append(image_message)

#     # Adding the text for analysis
#     text_message = {
    #     "type": "text",
    #     "text":  (
    #         "You are an intelligent chatbot that has the ability to provide the perfect answer to user provided question based on the context given and the prevoius chat history .\n"
    #         "You will be given a mixed of text, tables, and images(photographs, graphs, charts)."
    #         "All the above text, tables, images will be retrieved from a vectorstore based on user-input keywords."
    #         "Please use your extensive knowledge and analytical skills to provide a comprehensive summary that includes:\n"
    #         "- A detailed description of the visual elements in the image.\n"
    #         "- Any insights and statistics, if they are charts and graphs.\n"
    #         "- Connections between the image and the related text.\n\n"
    #         f"User-provided question: {data_dict['question']}\n\n"
    #         "Previous chat Conversation context:\n"
    #         f"{chat_history}\n\n"
    #         "Current Text and / or tables context:\n"
    #         f"{formatted_texts}"
    #     ),
    # }
    # messages.append(text_message)

    # return [HumanMessage(content=messages)]



def multi_modal_rag_chain_source(retriever):
    """Multi-modal RAG chain"""
    model = ChatOllama(model=llava_llama3, base_url = base_url)

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "chat_history": chat_history,
        }
        return context

    # chain_from_docs = (
    #     RunnablePassthrough.assign(
    #         context=(lambda x: combined_context(split_image_text_types(x["context"])))
    #     )
    #     | RunnableLambda(img_prompt_func)
    #     | model
    #     | StrOutputParser()
    # )

    # chain_with_source = RunnableParallel(
    #     {
    #         "context": retriever,
    #         "question": RunnablePassthrough(),
    #     }
    # ).assign(answer=chain_from_docs)

    # return chain_with_source

    # chain = (
    #     {
    #         "context": retriever | RunnableLambda(split_image_text_types) | RunnableLambda(combined_context),
    #         "question": RunnablePassthrough()
    #     }
    #     | RunnableLambda(img_prompt_func)
    #     | model
    #     | StrOutputParser()
    # )

    # return chain

    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | model
        | StrOutputParser()
    )

    return chain


def process_question(question, chatHistory):
    """Process a question and return the answer"""
    # global chat_history
    # chat_history = chatHistory.copy()
    chain = multi_modal_rag_chain_source(retriever)
    response = chain.invoke(question)
    return response["answer"]
