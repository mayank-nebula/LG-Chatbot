import io
import re
import os 
import csv
import time
import pickle
import base64
import chromadb
import pandas as pd
from PIL import Image
from chromadb.config import Settings
from langchain_openai import AzureChatOpenAI
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

settings = Settings(anonymized_telemetry=False)
CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)

os.environ["AZURE_OPENAI_API_KEY"] = "1f6a8e246c994010831185febfe6b079"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://hls-scientia-openai-dev-eus.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-02-01"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o-2024-05-13"

llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
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
        b"\x52\x49\x46": "webp",
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
    """Split base64-encoded images and texts"""
    b64_images = []
    texts = []
    sources = set()
    for doc in docs:
        if isinstance(doc, Document):
            sources.add(doc.metadata['Title'])
            doc = doc.page_content
        if looks_like_base64(doc) and is_image_data(doc):
            doc = resize_base64_image(doc, size=(1300, 600))
            b64_images.append(doc)
        else:
            texts.append(doc)
    return {"images": b64_images, "texts": texts, "sources": list(sources)}

def img_prompt_func_gpt(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    messages = []

    if data_dict["context"]["images"]:
        for image in data_dict["context"]["images"]:
            image_message = {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image}"},
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
            "Text and / or tables:\n"
            f"{formatted_texts}"
        ),
    }
    messages.append(text_message)
    return [HumanMessage(content=messages)]

def img_prompt_func_llava(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    messages = []

    if data_dict["context"]["images"]:
        for image in data_dict["context"]["images"]:
            image_message = {
                "type": "image_url",
                "image_url": image
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
            "Text and / or tables:\n"
            f"{formatted_texts}"
        ),
    }
    messages.append(text_message)
    return [HumanMessage(content=messages)]

def multi_modal_rag_chain_gpt(retriever):
    """Multi-modal RAG chain"""
    llm_gpt = AzureChatOpenAI(
        openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    )   
    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func_gpt)
        | llm_gpt
        | StrOutputParser()
    )
    return chain

def multi_modal_rag_chain_llava(retriever):
    """Multi-modal RAG chain"""
    model = ChatOllama(temperature=0, model="llava:34b", base_url='http://10.0.0.4:11434')
    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func_llava)
        | model
        | StrOutputParser()
    )
    return chain

embeddings = OllamaEmbeddings(base_url='http://10.0.0.4:11434', model='nomic-embed-text:latest')

vectorstore = Chroma(
    collection_name="GV_Test_MV_1", client=CHROMA_CLIENT, embedding_function=embeddings
)

current_directory = os.getcwd()
parent_directory = os.path.dirname(current_directory)
docstore_path = os.path.join(parent_directory, "docstore_1.pkl")

with open(docstore_path, "rb") as f:
    loaded_docstore = pickle.load(f)

retriever = MultiVectorRetriever(
    vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
)

# Chains
chain_multimodal_rag_gpt = multi_modal_rag_chain_gpt(retriever)
# chain_multimodal_rag_llava = multi_modal_rag_chain_llava(retriever)


# Read questions from CSV
input_csv = "question.csv"
output_csv = "answer.csv"

with open(input_csv, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    questions = [row["question"] for row in reader]

# Initialize results list
results = []

# Process each question
for idx, question in enumerate(questions, start=1):
    print(f"Processing question: {question}")

    # Timing and invoke for GPT
    start_time_gpt = time.time()
    output_gpt = chain_multimodal_rag_gpt.invoke(question)
    # answer_gpt = output_gpt["answer"]
    # sources_gpt = output_gpt["sources"]
    end_time_gpt = time.time()
    time_gpt = end_time_gpt - start_time_gpt

    print(output_gpt)

    # # Timing and invoke for LLaVA
    # start_time_llava = time.time()
    # answer_llava = chain_multimodal_rag_llava.invoke(question)
    # end_time_llava = time.time()
    # time_llava = end_time_llava - start_time_llava

    # retrieved_docs = retriever.invoke(question)
    # for retrieved_doc in retrieved_docs:
    #     metadata = retrieved_doc.metadata
    #     sources.add(metadata['Title'])

    # Collect results
#     results.append({
#         "index": idx,
#         "question": question,
#         "answer_gpt": answer_gpt,
#         "answer_llava": answer_llava,
#         "sources": sources
#         "time_gpt": time_gpt,
#         "time_llava": time_llava
#     })

# df = pd.DataFrame(results)
# df.to_csv(output_csv, index=False)
