def create_output_directory():
    """
    Creates the output directory if it doesn't exist.
    """
    ...

def pdf_to_images(fpath, fname):
    """
    Converts a PDF file into images for each page and saves them to the output directory.
    """
    ...

def encode_image(image_path):
    """
    Encodes an image to a base64 string.

    Args:
        image_path (str): Path to the image file.
    """
    ...

def image_summarize(img_base64, prompt):
    """
    Summarizes the content of an image using a GPT model.

    Args:
        img_base64 (str): Base64 encoded image string.
        prompt (str): Prompt for the model to generate the summary.
    """
    ...

def generate_img_summaries(path, deliverables_list_metadata):
    """
    Generates summaries for images in a directory and returns them along with their base64 encodings.

    Args:
        path (str): Path to the directory containing images.
        deliverables_list_metadata (dict): Metadata associated with the deliverables.
    """
    ...

def save_docstore(docstore, path):
    """
    Saves a document store to a pickle file.

    Args:
        docstore (InMemoryStore): The document store to save.
        path (str): Path where the pickle file will be saved.
    """
    ...

def save_array_to_text(file_path, data_to_save):
    """
    Saves an array of data to a text file in JSON format.

    Args:
        file_path (str): Path to the text file.
        data_to_save (list): List of data to save.
    """
    ...

def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
    batch_size=75,
):
    """
    Creates a MultiVectorRetriever for normal and summary RAG, and saves document stores.

    Args:
        vectorstore (Chroma): Chroma vector store for full documents.
        vectorstore_summary (Chroma): Chroma vector store for summary documents.
        image_summaries (dict): Summaries of the images.
        images (dict): Base64 encoded images.
        file_metadata (dict): Metadata of the file being processed.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
        batch_size (int, optional): Number of documents to process in each batch. Defaults to 75.
    """
    ...

def pdf_ppt_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    """
    Ingests a PDF or PPT file, extracts content, and creates vector stores for retrieval.

    Args:
        fname (str): Name of the file to ingest.
        file_metadata (dict): Metadata of the file.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
    """
    ...










import os
import uuid
import json
import base64
import shutil
import pickle
import logging
import concurrent.futures

import chromadb
from dotenv import load_dotenv
from chromadb.config import Settings
from pdf2image import convert_from_path
from langchain.storage import InMemoryStore
from langchain_openai import AzureChatOpenAI
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.retrievers.multi_vector import MultiVectorRetriever

from create_summary import create_summary
from question_generation import generate_and_save_questions

# Set up ChromaDB settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file
load_dotenv()

# Set up logging configuration to log to both a file and the console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Define paths for storing output and text files
summary_text_path = "summary_text.txt"
full_docs_text_path = "full_docs_text.txt"
output_path = os.path.join(os.getcwd(), "output")

# Initialize ChromaDB client
CHROMA_CLIENT = chromadb.HttpClient(host="10.225.1.6", port=8000, settings=settings)

# Initialize Azure OpenAI GPT model for image summarization
llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    max_retries=20,
)

# Function to create the output directory if it doesn't exist
def create_output_directory():
    if not os.path.exists(output_path):
        os.makedirs(output_path)

# Convert a PDF to images and save them in the output directory
def pdf_to_images(fpath, fname):
    create_output_directory()
    images = convert_from_path(os.path.join(fpath, fname))
    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")
    logging.info("Slides extracted")

# Encode an image file to base64 format
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Summarize an image using Azure OpenAI GPT
def image
