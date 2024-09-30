import os
import uuid
import json
import base64
import shutil
import pickle
import logging
import concurrent.futures

import tiktoken
import chromadb
from dotenv import load_dotenv
from chromadb.config import Settings
from pdf2image import convert_from_path
from langchain.storage import InMemoryStore
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever

from create_summary import create_summary
from question_generation import generate_and_save_questions

# from langchain_groq import ChatGroq
# from langchain_openai import ChatOpenAI, OpenAIEmbeddings
# from langchain_google_genai import GoogleGenerativeAIEmbeddings

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

# Define paths for storing output
output_path = os.path.join(os.getcwd(), "output")

# Initialize ChromaDB client
CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)

# Initialize Azure OpenAI GPT model for image summarization
# llm = ChatGroq(
#     model="llava-v1.5-7b-4096-preview",
#     temperature=0,
#     max_tokens=None,
#     timeout=None,
#     max_retries=2,
#     api_key=os.environ["GROQ_API_KEY"],
# )
# llm = ChatGoogleGenerativeAI(
#     model="gemini-1.5-pro",
#     temperature=0,
#     max_tokens=None,
#     timeout=None,
#     max_retries=2,
#     api_key=os.environ["GEMINI_API_KEY"],
# )

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    timeout=None,
    max_retries=2,
    api_key=os.environ["OPENAI_API_KEY"],
    max_tokens=1024,
)


class GeneratingError(Exception):
    pass


def create_output_directory():
    """
    Creates the output directory if it doesn't exist.
    """
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    """
    Converts a PDF file into images for each page and saves them to the output directory.
    """
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")

    logging.info("Slides extracted")


def encode_image(image_path):
    """
    Encodes an image to a base64 string.

    Args:
        image_path (str): Path to the image file.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    """
    Summarizes the content of an image using a GPT model.

    Args:
        img_base64 (str): Base64 encoded image string.
        prompt (str): Prompt for the model to generate the summary.
    """
    msg = llm.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"},
                    },
                ]
            )
        ]
    )
    return msg.content


def generate_img_summaries(
    path,
    #    deliverables_list_metadata
):
    """
    Generates summaries for images in a directory and returns them along with their base64 encodings.

    Args:
        path (str): Path to the directory containing images.
        deliverables_list_metadata (dict): Metadata associated with the deliverables.
    """
    image_summaries = {}
    img_base64_list = {}
    prompt = """use this image to extract and analyze the information thoroughly"""
    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)
            # title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
            # abstract = deliverables_list_metadata["Abstract"]

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=120)
                except concurrent.futures.TimeoutError:
                    return False
            image_summaries[img_name] = (
                # f"Title : {title}\nAbstract : {abstract}\n
                f"Summary : {summary}"
            )
    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


def save_docstore(docstore, path):
    """
    Saves a document store to a pickle file.

    Args:
        docstore (InMemoryStore): The document store to save.
        path (str): Path where the pickle file will be saved.
    """
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def save_array_to_text(file_path, data_to_save):
    """
    Saves an array of data to a text file in JSON format.

    Args:
        file_path (str): Path to the text file.
        data_to_save (list): List of data to save.
    """
    with open(file_path, "a") as f:
        for item in data_to_save:
            text_data = json.dumps(item)
            f.write(text_data + "\n")


def trim_summary_to_token_limit(text, token_limit=1000, encoding_name="o200k_base"):
    """
    Trims the provided text to fit within the specified token limit.

    Args:
        text (str): The full summary or text that needs to be trimmed.
        token_limit (int): The maximum number of tokens allowed. Defaults to 100k tokens.
        encoding_name (str): The encoding to use for tokenization. Defaults to 'o200k_base'.

    Returns:
        str: The trimmed text within the token limit.
    """
    # Get the encoding
    encoding = tiktoken.get_encoding(encoding_name)

    # Encode the text into tokens
    tokens = encoding.encode(text)

    # If token count exceeds the limit, trim the tokens
    if len(tokens) > token_limit:
        tokens = tokens[:token_limit]

    # Decode the trimmed tokens back into a string
    trimmed_text = encoding.decode(tokens)

    return trimmed_text


def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    image_summaries,
    images,
    file_metadata,
    # deliverables_list_metadata,
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
    # title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
    title, _ = os.path.splitext(file_metadata["Name"])

    current_dir = os.getcwd()
    docstore_path_normal = os.path.join(
        current_dir,
        "docstores_normal_rag",
        f"{file_metadata['ID']}.pkl",
    )
    docstore_path_summary = os.path.join(
        current_dir,
        "docstores_summary_rag",
        f"{file_metadata['ID']}.pkl",
    )

    store_normal = InMemoryStore()
    id_key_normal = "GatesVentures_Scientia"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store_normal, id_key=id_key_normal
    )

    store_summary = InMemoryStore()
    id_key_summary = "GatesVentures_Scientia_Summary"
    retriever_summary = MultiVectorRetriever(
        vectorstore=vectorstore_summary, docstore=store_summary, id_key=id_key_summary
    )

    combined_summaries = {}
    combined_contents = {}

    if image_summaries:
        combined_summaries.update(image_summaries)
        combined_contents.update(images)

    doc_keys = list(combined_contents.keys())
    total_docs = len(doc_keys)

    all_document_summaries = []

    for start_idx in range(0, total_docs, batch_size):
        end_idx = min(start_idx + batch_size, total_docs)
        batch_keys = doc_keys[start_idx:end_idx]

        batch_summaries = {key: combined_summaries[key] for key in batch_keys}

        summary = create_summary(batch_summaries)

        if summary:
            all_document_summaries.append(summary)
        else:
            raise GeneratingError("Summary Generation Failed")

    if len(all_document_summaries) > 1:
        final_summary = " ".join(all_document_summaries)
    else:
        final_summary = all_document_summaries[0]

    questions_generation = generate_and_save_questions(
        title,
        final_summary,
        # deliverables_list_metadata["DeliverablePermissions"]
    )

    if not questions_generation:
        raise GeneratingError("Summary Generation Failed")

    def add_documents(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, total_docs, batch_size):
            end_idx = min(start_idx + batch_size, total_docs)
            batch_keys = doc_keys[start_idx:end_idx]

            batch_summaries = {key: doc_summaries[key] for key in batch_keys}
            batch_contents = {key: doc_contents[key] for key in batch_keys}

            doc_ids = [str(uuid.uuid4()) for _ in batch_contents]
            summary_docs = [
                Document(
                    page_content=s,
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "source": file_metadata["WebUrl"],
                        "slide_number": key,
                        # "ContentTags": deliverables_list_metadata["ContentTags"],
                        # "Abstract": deliverables_list_metadata["Abstract"],
                        # "Region": deliverables_list_metadata["Region"],
                        # "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        # "StrategyAreaTeam": deliverables_list_metadata[
                        #     "StrategyAreaTeam"
                        # ],
                        # "Country": deliverables_list_metadata["Country"],
                        # "Country_x003a_CountryFusionID": deliverables_list_metadata[
                        #     "Country_x003a_CountryFusionID"
                        # ],
                        # "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        # "Country_x003a_ID": deliverables_list_metadata[
                        #     "Country_x003a_ID"
                        # ],
                        # "DeliverablePermissions": deliverables_list_metadata[
                        #     "DeliverablePermissions"
                        # ],
                        # "deliverables_list_metadata": f"{deliverables_list_metadata}",
                    },
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                Document(
                    page_content=json.dumps(
                        {"summary": doc_summaries[key], "content": s}
                    ),
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "source": file_metadata["WebUrl"],
                        "slide_number": key,
                        # "ContentTags": deliverables_list_metadata["ContentTags"],
                        # "Abstract": deliverables_list_metadata["Abstract"],
                        # "Region": deliverables_list_metadata["Region"],
                        # "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        # "StrategyAreaTeam": deliverables_list_metadata[
                        #     "StrategyAreaTeam"
                        # ],
                        # "Country": deliverables_list_metadata["Country"],
                        # "Country_x003a_CountryFusionID": deliverables_list_metadata[
                        #     "Country_x003a_CountryFusionID"
                        # ],
                        # "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        # "Country_x003a_ID": deliverables_list_metadata[
                        #     "Country_x003a_ID"
                        # ],
                        # "DeliverablePermissions": deliverables_list_metadata[
                        #     "DeliverablePermissions"
                        # ],
                        # "deliverables_list_metadata": f"{deliverables_list_metadata}",
                    },
                )
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    add_documents(retriever, combined_summaries, combined_contents)

    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "source": file_metadata["WebUrl"],
                # "ContentTags": deliverables_list_metadata["ContentTags"],
                # "Abstract": deliverables_list_metadata["Abstract"],
                # "Region": deliverables_list_metadata["Region"],
                # "StrategyArea": deliverables_list_metadata["StrategyArea"],
                # "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                # "Country": deliverables_list_metadata["Country"],
                # "Country_x003a_CountryFusionID": deliverables_list_metadata[
                #     "Country_x003a_CountryFusionID"
                # ],
                # "ContentTypes": deliverables_list_metadata["ContentTypes"],
                # "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                # "DeliverablePermissions": deliverables_list_metadata[
                #     "DeliverablePermissions"
                # ],
                # "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
    full_docs_summaryRetriever = [
        Document(
            page_content=json.dumps(
                {
                    "summary": f"Summary of the document - {title} - is {final_summary}",
                    "content": f"Summary of the document - {title} - is {final_summary}",
                }
            ),
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "source": file_metadata["WebUrl"],
                # "ContentTags": deliverables_list_metadata["ContentTags"],
                # "Abstract": deliverables_list_metadata["Abstract"],
                # "Region": deliverables_list_metadata["Region"],
                # "StrategyArea": deliverables_list_metadata["StrategyArea"],
                # "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                # "Country": deliverables_list_metadata["Country"],
                # "Country_x003a_CountryFusionID": deliverables_list_metadata[
                #     "Country_x003a_CountryFusionID"
                # ],
                # "ContentTypes": deliverables_list_metadata["ContentTypes"],
                # "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                # "DeliverablePermissions": deliverables_list_metadata[
                #     "DeliverablePermissions"
                # ],
                # "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.docstore.mset(
        list(zip(doc_id_summary, full_docs_summaryRetriever))
    )

    save_docstore(retriever.docstore, docstore_path_normal)
    save_docstore(retriever_summary.docstore, docstore_path_summary)

    logging.info(f"Ingestion Done {file_metadata['Name']}")


def pdf_ppt_ingestion_MV(
    fname,
    file_metadata,
    #  deliverables_list_metadata
):
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")
        # Extract individual slides as images
        pdf_to_images(fpath, fname)

        # Generate image summaries
        result = generate_img_summaries(
            output_path,
            #  deliverables_list_metadata
        )

        if result is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree(output_path)

        # Initialize the Azure OpenAI embeddings
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large", api_key=os.environ["OPENAI_API_KEY"]
        )

        # Vectorstore for a collections
        vectorstore = Chroma(
            collection_name="Nebula9_be",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        vectorstore_summary = Chroma(
            collection_name="Nebula9_be_Summary",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        # Creating multivector retriever
        create_multi_vector_retriever(
            vectorstore,
            vectorstore_summary,
            image_summaries,
            img_base64_list,
            file_metadata,
            # deliverables_list_metadata,
        )
        return True, None
    except Exception as e:
        logging.error(f"Error in PowerPoint ingestion: {e}")
        return False, str(e)
