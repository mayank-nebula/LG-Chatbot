import os
import base64
import shutil
import concurrent.futures

import chromadb
from dotenv import load_dotenv
from langchain_chroma import Chroma
from chromadb.config import Settings
from pdf2image import convert_from_path
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from create_summary import create_summary

# Set up ChromaDB settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file
load_dotenv()

# Define paths for storing output
output_path = os.path.join(os.getcwd(), "output")

# Initialize ChromaDB client
CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)

# Initialize LLM
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
    """Creates the output directory if it doesn't exist."""
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    """Converts a PDF file into images for each page and saves them to the output directory."""
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))
    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")


def encode_image(image_path):
    """Encodes an image to a base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    """Summarizes the content of an image using a GPT model."""
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


def generate_img_summaries(path):
    """
    Generates summaries for images in a directory and returns them along with their base64 encodings.
    """
    image_summaries = {}
    img_base64_list = {}
    prompt = "use this image to extract and analyze the information thoroughly"

    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)

            # Concurrently encode the image
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            # Concurrently generate summaries
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=120)
                except concurrent.futures.TimeoutError:
                    return False

            image_summaries[img_name] = f"Summary : {summary}"

    # Sort summaries based on image order (assuming names like slide_1, slide_2, etc.)
    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


def create_retriever(
    fname,
    vectorstore,
    vectorstore_summary,
    image_summaries,
    file_metadata,
    batch_size=75,
):

    combined_summaries = image_summaries if image_summaries else {}

    doc_keys = list(combined_summaries.keys())
    total_docs = len(doc_keys)

    all_document_summaries = []

    # Generate summaries in batches
    for start_idx in range(0, total_docs, batch_size):
        end_idx = min(start_idx + batch_size, total_docs)
        batch_keys = doc_keys[start_idx:end_idx]
        batch_summaries = {key: combined_summaries[key] for key in batch_keys}

        summary = create_summary(batch_summaries)

        if summary:
            all_document_summaries.append(summary)
        else:
            raise GeneratingError("Summary Generation Failed")

    final_summary = " ".join(all_document_summaries) if len(all_document_summaries) > 1 else all_document_summaries[0]

    # Add documents to vectorstore
    def add_documents(vectorstore, doc_summaries):
        for start_idx in range(0, total_docs, batch_size):
            end_idx = min(start_idx + batch_size, total_docs)
            batch_keys = doc_keys[start_idx:end_idx]
            batch_summaries = {key: doc_summaries[key] for key in batch_keys}

            summary_docs = [
                Document(
                    page_content=s,
                    metadata={"Title": fname},
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            vectorstore.add_documents(summary_docs)

    add_documents(vectorstore, combined_summaries)

    # Store final summary
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the file {fname} - {final_summary}",
            metadata={"Title": fname},
        )
    ]
    vectorstore_summary.add_documents(summary_docs_summaryRetriever)


def pdf_ppt_ingestion_MV(fpath, fname, file_metadata):
    """Ingests PDFs or PPTs by converting them to images and summarizing content."""
    try:
        pdf_to_images(fpath, fname)

        result = generate_img_summaries(output_path)

        if result is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree(output_path)

        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large", api_key=os.environ["OPENAI_API_KEY"]
        )

        vectorstore = Chroma(
            collection_name="EmailAssistant",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        vectorstore_summary = Chroma(
            collection_name="EmailAssistant_Summary",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        create_retriever(fname, vectorstore, vectorstore_summary, image_summaries, file_metadata)
        return True, None

    except Exception as e:
        shutil.rmtree(output_path, ignore_errors=True)
        return False, str(e)
