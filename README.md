import os
import base64
import shutil
import pickle
import json
import time
import concurrent.futures
import uuid
import logging
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from pdf2image import convert_from_path
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import InMemoryStore
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import Chroma

settings = Settings(anonymized_telemetry=False)
load_dotenv()

with open("config.json", "r") as confile_file:
    config = json.load(confile_file)

base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava3 = config["ollama"]["models"]["llava-34B"]
llama3 = config["ollama"]["models"]["llama3-8B"]

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Constants
output_path = os.path.join(os.getcwd(), "output")
CHROMA_CLIENT = chromadb.HttpClient(host="10.1.0.4", port=8000, settings=settings)


def create_output_directory():
    """Create the output directory if it doesn't exist."""
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    """Convert PowerPoint to images."""
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")

    logging.info("Slides extracted")


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


def generate_img_summaries(path):
    """
    Generate image summaries and base64 encoded strings for images.

    Returns:
        tuple: Tuple containing lists of base64 encoded images and their summaries.
    """
    img_base64_list = []
    image_summaries = []
    # image_summaries = {}
    # img_base64_list = {}
    prompt = """You are an assistant tasked with summarizing images for retrieval. \
    These summaries will be embedded and used to retrieve the raw image. \
    Give a concise summary of the image that is well optimized for retrieval."""
    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_path = os.path.join(path, img_file)

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=30)  # Timeout set to 30 seconds
                except concurrent.futures.TimeoutError:
                    return False

            # img_base64_list[img_file] = base64_image
            img_base64_list.append(base64_image)

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=60)  # Timeout set to 60 seconds
                except concurrent.futures.TimeoutError:
                    return False
            # image_summaries[img_file] = summary
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
    vectorstore, image_summaries, images, file_metadata, deliverables_list_metadata
):
    """
    Create a multi-vector retriever.

    Args:
        vectorstore (Vectorstore): Vectorstore object.
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

    if image_summaries:
        add_documents(retriever, image_summaries, images)

    save_docstore(retriever.docstore, docstore_path)

    logging.info(f"Ingestion Done {file_metadata['Name']}")


def pdf_ppt_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    """
    Ingest PowerPoint file.

    Args:
        fname (str): PowerPoint file name.
    """
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")

        pdf_to_images(fpath, fname)

        result = generate_img_summaries(output_path)

        if result is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree(output_path)

        # img_base64_list, image_summaries = generate_img_summaries(output_path)
        # shutil.rmtree(output_path)

        embeddings = OllamaEmbeddings(base_url=base_url, model=nomic)
        vectorstore = Chroma(
            collection_name="GV_Test_MV_1",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        create_multi_vector_retriever(
            vectorstore,
            image_summaries,
            img_base64_list,
            file_metadata,
            deliverables_list_metadata,
        )
        return True
    except Exception as e:
        logging.error(f"Error in PowerPoint ingestion: {e}")
        return False
