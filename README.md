import os
import json
import uuid
import shutil
import pickle
import base64
import logging
import time
import concurrent.futures
import io
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from pdfplumber import open as open_pdf
from unstructured.partition.pdf_image import pdf_image_utils
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import CharacterTextSplitter
from unstructured.partition.pdf import partition_pdf
from langchain.retrievers.multi_vector import MultiVectorRetriever
from PIL import Image, ImageFile, UnidentifiedImageError
from langchain.storage import InMemoryStore

# Configure ChromaDB settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file
load_dotenv()

# Load configuration from a JSON file
with open("config.json", "r") as confile_file:
    config = json.load(confile_file)

# Extract base URL and model names from the configuration
base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava3 = config["ollama"]["models"]["llava-34B"]
llama3 = config["ollama"]["models"]["llama3-8B"]

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Initialize ChromaDB client
CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True


def custom_write_image(image, output_image_path):
    max_size = 65500
    try:
        # Check image size
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_size_kb = len(img_byte_arr.getvalue()) / 1024
        
        if img_size_kb < 20:
            return

        width, height = image.size
        if width > max_size or height > max_size:
            print(f"Resizing image from ({width}, {height}) to fit within ({max_size}, {max_size})")
            if width > height:
                new_width = max_size
                new_height = int((max_size / width) * height)
            else:
                new_height = max_size
                new_width = int((max_size / height) * width)
            image = image.resize((new_width, new_height), Image.LANCZOS)
        
        image.save(output_image_path)
    except OSError as e:
        print(f"Failed to save resized image: {e}")
    except UnidentifiedImageError as e:
        print(f"Failed to identify image: {e}")

pdf_image_utils.write_image = custom_write_image

def extract_pdf_elements(path, fname):
    """
    Extract images, tables, and chunk text from a PDF file.

    Args:
        path (str): File path.
        fname (str): File name.

    Returns:
        list: List of extracted elements.
    """

    return partition_pdf(
        filename=os.path.join(path, fname),
        extract_images_in_pdf=True,
        infer_table_structure=True,
        chunking_strategy="by_title",
        max_characters=4000,
        new_after_n_chars=3800,
        combine_text_under_n_chars=2000,
    )


def categorize_elements(raw_pdf_elements):
    """
    Categorize extracted elements from a PDF into tables and texts.

    Args:
        raw_pdf_elements (list): List of extracted elements.

    Returns:
        tuple: Tuple containing lists of texts and tables.
    """
    tables = []
    texts = []
    for element in raw_pdf_elements:
        if isinstance(element, Document):
            element = element.page_content
        if "unstructured.documents.elements.Table" in str(type(element)):
            tables.append(str(element))
        elif "unstructured.documents.elements.CompositeElement" in str(type(element)):
            texts.append(str(element))
    return texts, tables


def generate_text_summaries(texts, tables, summarize_texts=False):
    """
    Summarize text elements.

    Args:
        texts (list): List of text elements.
        tables (list): List of table elements.
        summarize_texts (bool): Flag to indicate whether to summarize text elements.

    Returns:
        tuple: Tuple containing lists of text summaries and table summaries.
    """

    prompt_text = """You are an assistant tasked with summarizing tables and text for retrieval. \
    These summaries will be embedded and used to retrieve the raw text or table elements. \
    Give a concise summary of the table or text that is well optimized for retrieval. Table or text: {element} """
    prompt = ChatPromptTemplate.from_template(prompt_text)

    model = ChatOllama(model=llama3, base_url=base_url, temperature=0)
    summarize_chain = {"element": lambda x: x} | prompt | model | StrOutputParser()

    text_summaries = []
    table_summaries = []

    if texts and summarize_texts:
        text_summaries = summarize_chain.batch(texts, {"max_concurrency": 5})
    elif texts:
        text_summaries = texts

    if tables:
        table_summaries = summarize_chain.batch(tables, {"max_concurrency": 5})

    return text_summaries, table_summaries


def encode_image(image_path):
    """
    Encode image to base64 string.

    Args:
        image_path (str): Path to the image file.

    Returns:
        str: Base64 encoded image string.
    """

    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    """
    Summarize an image using Google Generative AI.

    Args:
        img_base64 (str): Base64 encoded image string.
        prompt (str): Prompt for summarization.

    Returns:
        str: Image summary.
    """

    chat = ChatOllama(model=llava3, base_url=base_url, temperature=0)

    msg = chat.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": img_base64},
                ]
            )
        ]
    )
    return msg.content


def generate_img_summaries():
    """
    Generate image summaries and base64 encoded strings for images.

    Returns:
        tuple: Tuple containing lists of base64 encoded images and their summaries.
    """
    img_base64_list = []
    image_summaries = []
    prompt = """You are an assistant tasked with summarizing images for retrieval. \
    These summaries will be embedded and used to retrieve the raw image. \
    Give a concise summary of the image that is well optimized for retrieval."""
    for img_file in os.listdir("figures"):
        if img_file.endswith(".jpg"):
            img_path = os.path.join("figures", img_file)

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=30)  # Timeout set to 30 seconds
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list.append(base64_image)

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=60)  # Timeout set to 60 seconds
                except concurrent.futures.TimeoutError:
                    return False

            image_summaries.append(summary)
    return img_base64_list, image_summaries


def save_docstore(docstore, path):
    """Save the docstore to the specified path."""
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def load_docstore(path):
    """Load the docstore from the specified path."""
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return None


def create_multi_vector_retriever(
    vectorstore,
    text_summaries,
    texts,
    table_summaries,
    tables,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
):
    """
    Create a multi-vector retriever.

    Args:
        vectorstore (Vectorstore): Vectorstore object.
        text_summaries (List[str]): Summaries of text elements.
        texts (List[str]): Text elements.
        table_summaries (List[str]): Summaries of table elements.
        tables (List[str]): Table elements.
        image_summaries (List[str]): Summaries of image elements.
        images (List[str]): Image elements.
        file_metadata (dict): Metadata for the file.
        deliverables_list_metadata (dict): Deliverables list metadata

    """

    current_dir = os.getcwd()
    docstore_path = os.path.join(current_dir, "docstore_1.pkl")
    existing_store = load_docstore(docstore_path)

    store = existing_store if existing_store else InMemoryStore()

    id_key = "GV_Test_MV_1"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store, id_key=id_key
    )

    def add_documents(retriever, doc_summaries, doc_contents):
        doc_ids = [str(uuid.uuid4()) for _ in doc_contents]
        summary_docs = [
            Document(
                page_content=s,
                metadata={
                    id_key: doc_ids[i],
                    "id": file_metadata["ID"],
                    "Title": deliverables_list_metadata["Title"],
                    "ContentTags": deliverables_list_metadata["ContentTags"],
                    "Abstract": deliverables_list_metadata["Abstract"],
                    "Region": deliverables_list_metadata["Region"],
                    "StrategyArea": deliverables_list_metadata["StrategyArea"],
                    "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                    "Country": deliverables_list_metadata["Country"],
                    "Country_x003a_CountryFusionID": deliverables_list_metadata["Country_x003a_CountryFusionID"],
                    "ContentTypes": deliverables_list_metadata["ContentTypes"],
                    "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                    "DeliverablePermissions": deliverables_list_metadata["DeliverablePermissions"],
                    "source": file_metadata["WebUrl"],
                    "deliverables_list_metadata": f"{deliverables_list_metadata}",
                },
            )
            for i, s in enumerate(doc_summaries)
        ]
        retriever.vectorstore.add_documents(summary_docs)
        full_docs = [
            Document(
                page_content=s,
                metadata={
                    id_key: doc_ids[i],
                    "id": file_metadata["ID"],
                    "Title": deliverables_list_metadata["Title"],
                    "ContentTags": deliverables_list_metadata["ContentTags"],
                    "Abstract": deliverables_list_metadata["Abstract"],
                    "Region": deliverables_list_metadata["Region"],
                    "StrategyArea": deliverables_list_metadata["StrategyArea"],
                    "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                    "Country": deliverables_list_metadata["Country"],
                    "Country_x003a_CountryFusionID": deliverables_list_metadata["Country_x003a_CountryFusionID"],
                    "ContentTypes": deliverables_list_metadata["ContentTypes"],
                    "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                    "DeliverablePermissions": deliverables_list_metadata["DeliverablePermissions"],
                    "source": file_metadata["WebUrl"],
                    "deliverables_list_metadata": f"{deliverables_list_metadata}",
                },
            )
            for i, s in enumerate(doc_contents)
        ]
        retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    if text_summaries:
        add_documents(retriever, text_summaries, texts)
    if table_summaries:
        add_documents(retriever, table_summaries, tables)
    if image_summaries:
        add_documents(retriever, image_summaries, images)

    save_docstore(retriever.docstore, docstore_path)

    logging.info(f"Ingestion Done {file_metadata['Name']}")


def pdf_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    """
    Process PDF file for ingestion.

    Args:
        fname (str): PDF file name.
    """
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")

        # Extract raw PDF elements
        raw_pdf_elements = extract_pdf_elements(fpath, fname)

        # Categorize texts and tables from raw PDF elements
        texts, tables = categorize_elements(raw_pdf_elements)

        text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=4000, chunk_overlap=0
        )
        joined_texts = " ".join(texts)
        texts_4k_token = text_splitter.split_text(joined_texts)

        # Get the summary of texts and tables
        text_summaries, table_summaries = generate_text_summaries(
            texts_4k_token, tables, summarize_texts=True
        )

        # Get the image summaries

        result = generate_img_summaries()

        if result is False:
            shutil.rmtree("figures")
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree("figures")

        # Initialize embeddings using the Ollama embeddings model
        embeddings = OllamaEmbeddings(base_url=base_url, model=nomic)

        # Initialize the vector store using ChromaDB and the embeddings function
        vectorstore = Chroma(
            collection_name="GV_Test_MV_1",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        # Creating multi vector retriever
        create_multi_vector_retriever(
            vectorstore,
            text_summaries,
            texts,
            table_summaries,
            tables,
            image_summaries,
            img_base64_list,
            file_metadata,
            deliverables_list_metadata,
        )
        return True
    except Exception as e:
        logging.error(f"Error in PDF ingestion: {e}")
        return False
