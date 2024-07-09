import os
import re
import io
import csv
import time
import pickle
import base64
import chromadb
import pandas as pd
from PIL import Image
from datetime import datetime, timedelta
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
from dotenv import load_dotenv
from office365.graph_client import GraphClient
import msal

# Load environment variables
load_dotenv()

# Initialize constants and settings
settings = Settings(anonymized_telemetry=False)
CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)
VECTORSTORE_COLLECTION_NAME = "GV_Test_MV_1"
EMBEDDING_MODEL = 'nomic-embed-text:latest'
AZURE_OPENAI_SETTINGS = {
    "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
    "endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
    "api_version": os.getenv("AZURE_OPENAI_API_VERSION"),
    "deployment_name": os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME")
}

# Initialize global variables
global_sources, global_sources_link, global_ids, global_text_chunks, global_image_chunks = [], [], [], [], []

# MSAL authentication details
tenant_id = os.getenv('TENANT_ID')
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')

# SharePoint site URL
site_url = 'https://gatesventures.sharepoint.com/sites/scientia'

# Initialize Azure OpenAI
llm_gpt = AzureChatOpenAI(
    openai_api_version=AZURE_OPENAI_SETTINGS["api_version"],
    azure_deployment=AZURE_OPENAI_SETTINGS["deployment_name"],
    temperature=0
)

# Function to acquire MSAL token
def acquire_token():
    authority_url = f'https://login.microsoftonline.com/{tenant_id}'
    app = msal.ConfidentialClientApplication(
        authority=authority_url,
        client_id=client_id,
        client_credential=client_secret,
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if 'access_token' in token_response:
        token_expires_at = datetime.now() + timedelta(seconds=token_response['expires_in'])
        return token_response, token_expires_at
    else:
        raise Exception("Failed to acquire token", token_response.get('error'), token_response.get('error_description'))

# Acquire initial token and create Graph client
token, token_expires_at = acquire_token()
client = GraphClient(lambda: token)

# Helper functions
def looks_like_base64(sb):
    return re.match("^[A-Za-z0-9+/]+[=]{0,2}$", sb) is not None

def is_image_data(b64data):
    image_signatures = {
        b"\xff\xd8\xff": "jpg",
        b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "png",
        b"\x47\x49\x46\x38": "gif",
        b"\x52\x49\x46": "webp",
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
    global global_sources, global_sources_link, global_ids, global_text_chunks, global_image_chunks
    b64_images, texts = [], []
    sources, sources_link, sources_ids = set(), set(), set()
    for doc in docs:
        if isinstance(doc, Document):
            sources.add(doc.metadata['Title'])
            sources_link.add(doc.metadata['source'])
            sources_ids.add(doc.metadata['id'])
            doc = doc.page_content
        if looks_like_base64(doc) and is_image_data(doc):
            doc = resize_base64_image(doc, size=(1300, 600))
            b64_images.append(doc)
        else:
            texts.append(doc)
    global_sources = list(sources)
    global_sources_link = list(sources_link)
    global_ids = list(sources_ids)
    global_text_chunks = texts
    global_image_chunks = b64_images
    return {"images": b64_images, "texts": texts}

def create_img_prompt_gpt(data_dict):
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    messages = [{"type": "text", "text": (
        "You are an advanced AI assistant with multimodal capabilities, designed to provide accurate and insightful responses based on given context, previous conversations, and visual information.\n\n"
        "Role and Capabilities:\n"
        "1. Analyze and interpret text, tables, and images (including photographs, graphs, and charts).\n"
        "2. Maintain context from previous conversations to ensure coherent and relevant responses.\n"
        "3. Synthesize information from multiple sources to provide comprehensive answers.\n\n"
        "Instructions:\n"
        "1. Carefully examine all provided information: text, tables, and images.\n"
        "2. Consider the chat history to maintain conversation continuity.\n"
        "3. Provide a well-structured, accurate response that directly addresses the user's question.\n"
        "4. If certain information is missing or unclear, acknowledge this in your response.\n"
        "5. Do not mention anything about the data sources or related information.\n"
        "6. Do not say anything like 'the user's question was' or related to this in the answer.\n"
        "7. If you don't know the answer to the question, do not answer from the provided content.\n"
        "8. If the answer is not coming from provided context, just respond with 'I don't know'.\n\n"
        f"User-provided question: {data_dict['question']}\n\n"
        "Text and/or tables:\n"
        f"{formatted_texts}"
    )}]
    if data_dict["context"]["images"]:
        for image in data_dict["context"]["images"]:
            image_message = {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}}
            messages.append(image_message)
    return [HumanMessage(content=messages)]

def create_img_prompt_llava(data_dict):
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    messages = [{"type": "text", "text": (
        "You are an advanced AI assistant with multimodal capabilities, designed to provide accurate and insightful responses based on given context, previous conversations, and visual information.\n\n"
        "Role and Capabilities:\n"
        "1. Analyze and interpret text, tables, and images (including photographs, graphs, and charts).\n"
        "2. Maintain context from previous conversations to ensure coherent and relevant responses.\n"
        "3. Synthesize information from multiple sources to provide comprehensive answers.\n\n"
        "Instructions:\n"
        "1. Carefully examine all provided information: text, tables, and images.\n"
        "2. Consider the chat history to maintain conversation continuity.\n"
        "3. Provide a well-structured, accurate response that directly addresses the user's question.\n"
        "4. If certain information is missing or unclear, acknowledge this in your response.\n"
        "5. Do not mention anything about the data sources or related information.\n"
        "6. Do not say anything like 'the user's question was' or related to this in the answer.\n"
        "7. If you don't know the answer to the question, do not answer from the provided content.\n"
        "8. If the answer is not coming from provided context, just respond with 'I don't know'.\n\n"
        f"User-provided question: {data_dict['question']}\n\n"
        "Text and/or tables:\n"
        f"{formatted_texts}"
    )}]
    if data_dict["context"]["images"]:
        for image in data_dict["context"]["images"]:
            image_message = {"type": "image_url", "image_url": image}
            messages.append(image_message)
    return [HumanMessage(content=messages)]

def create_multi_modal_chain_gpt(retriever):
    return (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(create_img_prompt_gpt)
        | llm_gpt
        | StrOutputParser()
    )

def create_multi_modal_chain_llava(retriever):
    llava_model = ChatOllama(temperature=0, model="llava:34b", base_url='http://10.0.0.4:11434')
    return (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(create_img_prompt_llava)
        | llava_model
        | StrOutputParser()
    )

def stream_file_content(site_id, drive_id, file_id, files_metadata):
    global token, token_expires_at, client
    if token_expires_at < datetime.now() + timedelta(minutes=5):
        token, token_expires_at = acquire_token()
        client = GraphClient(lambda: token)
    target_folder = 'Files'
    file_name = files_metadata[file_id]['Name']
    response = client.sites[site_id].drives[drive_id].items[file_id].get_content().execute_query()
    os.makedirs(target_folder, exist_ok=True)
    file_path = os.path.join(target_folder, file_name)
    if not os.path.exists(file_path):
        with open(file_path, 'wb') as file:
            file.write(response.value)

def load_csv_data(csv_filename, col_name):
    if not os.path.isfile(csv_filename):
        return {}
    with open(csv_filename, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        return {row[col_name]: row for row in reader}

# Initialize embeddings and vectorstore
embeddings = OllamaEmbeddings(base_url='http://10.0.0.4:11434', model=EMBEDDING_MODEL)
vectorstore = Chroma(collection_name=VECTORSTORE_COLLECTION_NAME, client=CHROMA_CLIENT, embedding_function=embeddings)

# Load document store
current_directory = os.getcwd()
parent_directory = os.path.dirname(current_directory)
docstore_path = os.path.join(parent_directory, "GV_Test", "docstore_1.pkl")
with open(docstore_path, "rb") as file:
    loaded_docstore = pickle.load(file)

# Initialize retriever and chains
retriever = MultiVectorRetriever(vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1")
chain_gpt = create_multi_modal_chain_gpt(retriever)
chain_llava = create_multi_modal_chain_llava(retriever)
files_metadata = load_csv_data('files_metadata.csv', 'ID')

if __name__ == "__main__":
    input_csv = "question.csv"
    output_csv = "answer.csv"
    
    with open(input_csv, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        questions = [row["question"] for row in reader]
    
    results = []
    
    for idx, question in enumerate(questions, start=1):
        print(f"Processing question: {question}")
    
        global_sources, global_sources_link, global_ids = [], [], []
        
        start_time_gpt = time.time()
        answer_gpt = chain_gpt.invoke(question)
        end_time_gpt = time.time()
        time_gpt = end_time_gpt - start_time_gpt
        
        for file_id in global_ids:
            stream_file_content(site_id="gatesventures.sharepoint.com,5985bb5c-53b9-4ebb-ac6f-9a940041edf7,3c8c6e37-ed49-4214-b950-874194e56289", drive_id="b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO", file_id=file_id, files_metadata=files_metadata)
        
        global_sources, global_sources_link, global_ids = [], [], []
        
        start_time_llava = time.time()
        answer_llava = chain_llava.invoke(question)
        end_time_llava = time.time()
        time_llava = end_time_llava - start_time_llava
        
        for file_id in global_ids:
            stream_file_content(site_id="gatesventures.sharepoint.com,5985bb5c-53b9-4ebb-ac6f-9a940041edf7,3c8c6e37-ed49-4214-b950-874194e56289", drive_id="b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO", file_id=file_id, files_metadata=files_metadata)
        
        results.append({
            "question": question,
            "answer_gpt": answer_gpt,
            "answer_llava": answer_llava,
            "sources_gpt": global_sources.copy(),
            "sources_gpt_link": global_sources_link.copy(),
            "sources_llava": global_sources.copy(),
            "sources_llava_link": global_sources_link.copy(),
            "time_gpt": time_gpt,
            "time_llava": time_llava
        })
    
    df = pd.DataFrame(results)
    
    if os.path.exists(output_csv):
        df.to_csv(output_csv, mode='a', header=False, index=False)
    else:
        df.to_csv(output_csv, mode='w', header=True, index=False)
