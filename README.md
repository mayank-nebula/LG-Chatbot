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
from dotenv import load_dotenv
from office365.graph_client import GraphClient
import msal
import csv
from datetime import datetime, timedelta

load_dotenv()

settings = Settings(anonymized_telemetry=False)
CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)
global_sources = []
global_sources_link = []
global_ids = []

tenant_id = os.getenv('TENANT_ID')
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')

# SharePoint site URL
site_url = 'https://gatesventures.sharepoint.com/sites/scientia'

os.environ["AZURE_OPENAI_API_KEY"] = "1f6a8e246c994010831185febfe6b079"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://hls-scientia-openai-dev-eus.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-02-01"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o-2024-05-13"

llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    temperature = 0
)

def acquire_token_func():
    """
    Acquire token via MSAL
    """
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


# Acquire token once and create Graph client
token, token_expires_at = acquire_token_func()
client = GraphClient(lambda: token)

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
    global global_sources
    global global_sources_link
    global global_ids
    b64_images = []
    texts = []
    sources = set()
    sources_link = set()
    sources_ids = set()
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
    return {"images": b64_images, "texts": texts}

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
                "6. Do not say anything like 'the user\'s question was' or related to this in the answer.\n"
                "7. If you dont know the answer for the question. Do not answer from the provided content.\n"
                "8. If the answer is not coming from provided context, just respond with 'I dont know'. \n\n"
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
                "6. Do not say anything like 'the user\'s question was' or related to this in the answer.\n"
                "7. If you dont know the answer for the question. Do not answer from the provided content.\n"
                "8. If the answer is not coming from provided context, just respond with 'I dont know'. \n\n"
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

def stream_file_content(site_id, drive_id, file_id, files_metadata):
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    target_folder = 'Files'
    file_name = files_metadata[file_id]['Name']

    response = client.sites[site_id].drives[drive_id].items['015EOPAMMLHBZWOORUCFG2DFOJFACSXRIS'].get_content().execute_query()

    if not os.path.exists(os.path.join(target_folder, file_name)):
        with open(os.path.join(target_folder, file_name), 'wb') as file:
            file.write(response.value)

def load_existing_csv_data(csv_filename, colName):
    if not os.path.isfile(csv_filename):
        return {}
    with open(csv_filename, mode='r', encoding='utf-8') as in_file:
        reader = csv.DictReader(in_file)
        return {row[colName]: row for row in reader}

    
embeddings = OllamaEmbeddings(base_url='http://10.0.0.4:11434', model='nomic-embed-text:latest')

vectorstore = Chroma(
    collection_name="GV_Test_MV_1", client=CHROMA_CLIENT, embedding_function=embeddings
)

current_directory = os.getcwd()
parent_directory = os.path.dirname(current_directory)
docstore_path = os.path.join(parent_directory, "GV_Test", "docstore_1.pkl")

with open(docstore_path, "rb") as f:
    loaded_docstore = pickle.load(f)

retriever = MultiVectorRetriever(
    vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1",
)

# Chains
chain_multimodal_rag_gpt = multi_modal_rag_chain_gpt(retriever)
chain_multimodal_rag_llava = multi_modal_rag_chain_llava(retriever)
files_metadata = load_existing_csv_data('files_metadata.csv', 'ID')

if __name__ == "__main__":
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
        global_sources = []
        global_sources_link = []
        global_ids = []
        start_time_gpt = time.time()
        answer_gpt = chain_multimodal_rag_gpt.invoke(question)
        sources_gpt = global_sources.copy()
        sources_gpt_link = global_sources_link.copy()
        end_time_gpt = time.time()
        time_gpt = end_time_gpt - start_time_gpt
        for id in global_ids:
            stream_file_content(site_id="gatesventures.sharepoint.com,5985bb5c-53b9-4ebb-ac6f-9a940041edf7,3c8c6e37-ed49-4214-b950-874194e56289", drive_id="b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO", file_id=id, files_metadata=files_metadata)
    
    
        # # Timing and invoke for LLaVA
        global_sources = []
        global_sources_link = []
        global_ids = []
        start_time_llava = time.time()
        answer_llava = chain_multimodal_rag_llava.invoke(question)
        sources_llava = global_sources.copy()
        sources_llava_link = global_sources_link.copy()
        end_time_llava = time.time()
        time_llava = end_time_llava - start_time_llava
        for id in global_ids:
            stream_file_content(site_id="gatesventures.sharepoint.com,5985bb5c-53b9-4ebb-ac6f-9a940041edf7,3c8c6e37-ed49-4214-b950-874194e56289", drive_id="b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO", file_id=id, files_metadata=files_metadata)
    
        # Collect results
        results.append({
            "question": question,
            "answer_gpt": answer_gpt,
            "answer_llava": answer_llava,
            "sources_gpt": sources_gpt,
            "sources_gpt_link":sources_gpt_link,
            "sources_llava": sources_llava,
            "sources_llava_link":sources_llava_link,
            "time_gpt": time_gpt,
            "time_llava": time_llava
        })
    
    df = pd.DataFrame(results)
    
    if os.path.exists(output_csv):
        df.to_csv(output_csv, mode='a', header=False, index=False)
    else:
        df.to_csv(output_csv, mode='w', header=True, index=False)
    
