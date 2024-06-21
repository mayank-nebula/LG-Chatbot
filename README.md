import os
import base64
import shutil
import logging
import pickle
import json
import uuid
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from pdfplumber import open as open_pdf
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import CharacterTextSplitter
from unstructured.partition.pdf import partition_pdf
from langchain.storage import InMemoryStore
from langchain.retrievers.multi_vector import MultiVectorRetriever

settings = Settings(anonymized_telemetry=False)
load_dotenv()

with open('config.json', 'r') as confile_file:
    config = json.load(confile_file)

base_url = config['ollama']['base_url']
nomic = config['ollama']['embeddings']['nomic']
llava3 = config['ollama']['models']['llava-34B']
llama3 = config['ollama']['models']['llama3-8B']

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Constants
CHROMA_CLIENT = chromadb.HttpClient(host="localhost", port=8000, settings=settings)


def extract_pdf_elements(path, fname):
    """
    Extract images, tables, and chunk text from a PDF file.

    Args:
        path (str): File path.
        fname (str): File name.

    Returns:
        list: List of extracted elements.
    """
    try:
        return partition_pdf(
            filename=os.path.join(path, fname),
            extract_images_in_pdf=True,
            infer_table_structure=True,
            chunking_strategy="by_title",
            max_characters=4000,
            new_after_n_chars=3800,
            combine_text_under_n_chars=2000,
        )
    except Exception as e:
        logging.error(f"Error extracting PDF elements: {e}")
        return []


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
    try:
        prompt_text = """You are an assistant tasked with summarizing tables and text for retrieval. \
        These summaries will be embedded and used to retrieve the raw text or table elements. \
        Give a concise summary of the table or text that is well optimized for retrieval. Table or text: {element} """
        prompt = ChatPromptTemplate.from_template(prompt_text)

        model = ChatOllama(model=llama3, base_url = base_url, temperature = 0)
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
    except Exception as e:
        logging.error(f"Error generating text summaries: {e}")
        return [], []


def encode_image(image_path):
    """
    Encode image to base64 string.

    Args:
        image_path (str): Path to the image file.

    Returns:
        str: Base64 encoded image string.
    """
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        logging.error(f"Error encoding image: {e}")
        return ""


def image_summarize(img_base64, prompt):
    """
    Summarize an image using Google Generative AI.

    Args:
        img_base64 (str): Base64 encoded image string.
        prompt (str): Prompt for summarization.

    Returns:
        str: Image summary.
    """
    try:
        chat = ChatOllama(model=llava3, base_url = base_url, temperature=0)

        msg = chat.invoke(
            [
                HumanMessage(
                    content=[
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": img_base64
                        },
                    ]
                )
            ]
        )
        return msg.content
    except Exception as e:
        logging.error(f"Error summarizing image: {e}")
        return ""


def generate_img_summaries():
    """
    Generate image summaries and base64 encoded strings for images.

    Returns:
        tuple: Tuple containing lists of base64 encoded images and their summaries.
    """
    try:
        img_base64_list = []
        image_summaries = []
        prompt = """You are an assistant tasked with summarizing images for retrieval. \
        These summaries will be embedded and used to retrieve the raw image. \
        Give a concise summary of the image that is well optimized for retrieval."""
        for img_file in (os.listdir("figures")):
            if img_file.endswith(".jpg"):
                img_path = os.path.join("figures", img_file)
                base64_image = encode_image(img_path)
                img_base64_list.append(base64_image)
                image_summaries.append(image_summarize(base64_image, prompt))
                # print(f"{img_file} done")
        return img_base64_list, image_summaries
    except Exception as e:
        logging.error(f"Error generating image summaries: {e}")
        return [], []


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
    deliverables_list_metadata
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

    """
    try:
        current_dir = os.getcwd()
        docstore_path = os.path.join(current_dir, "docstore.pkl")
        existing_store = load_docstore(docstore_path)

        store = existing_store if existing_store else InMemoryStore()

        id_key = "GV_Test_MV"
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore, docstore=store, id_key=id_key
        )

        def add_documents(retriever, doc_summaries, doc_contents):
            doc_ids = [str(uuid.uuid4()) for _ in doc_contents]
            summary_docs = [
                Document(page_content=s, metadata={id_key: doc_ids[i], "id": file_metadata['ID'], "source":file_metadata['WebUrl'], "permission":deliverables_list_metadata['DeliverablePermissions'], "deliverables_list_metadata":f'{deliverables_list_metadata}'})
                for i, s in enumerate(doc_summaries)
            ]
            retriever.vectorstore.add_documents(summary_docs)
            full_docs = [
                Document(page_content=s, metadata={id_key: doc_ids[i], "id": file_metadata['ID'], "source":file_metadata['WebUrl'], "permission":deliverables_list_metadata['DeliverablePermissions'], "deliverables_list_metadata":f'{deliverables_list_metadata}'})
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
    except Exception as e:
        logging.error(f"Error creating multi-vector retriever: {e}")
        return None


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

        raw_pdf_elements = extract_pdf_elements(fpath, fname)
        texts, tables = categorize_elements(raw_pdf_elements)

        text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=4000, chunk_overlap=0
        )
        joined_texts = " ".join(texts)
        texts_4k_token = text_splitter.split_text(joined_texts)
        text_summaries, table_summaries = generate_text_summaries(
            texts_4k_token, tables, summarize_texts=True
        )
        img_base64_list, image_summaries = generate_img_summaries()
        shutil.rmtree("figures")
        embeddings = OllamaEmbeddings(base_url = base_url, model=nomic)
        vectorstore = Chroma(
            collection_name="GV_Test_MV",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        create_multi_vector_retriever(
            vectorstore,text_summaries,texts,table_summaries,tables,image_summaries,img_base64_list,file_metadata, deliverables_list_metadata
        )
    except Exception as e:
        logging.error(f"Error in PDF ingestion: {e}")
