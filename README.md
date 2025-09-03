// create_questions
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from config import config
from ingestion import Question
from prompt_manager import PromptLoader
from utils import AzureManager, get_question_collection


async def question_generation(context: str, llm_gpt: AzureChatOpenAI):
    prompt_text = await PromptLoader.render_prompt(
        filename="ingestion_prompts", prompt_key="question_generation"
    )
    prompt = ChatPromptTemplate.from_template(prompt_text)
    chain = prompt | llm_gpt | JsonOutputParser()

    result = await chain.ainvoke({"element": context})
    return result


async def generate_and_save_questions(title: str, summary: str) -> None:
    question_list = []
    llm_gpt = AzureManager.get_llm(
        deployment_name=config.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME
    )

    questions = await question_generation(context=summary, llm_gpt=llm_gpt)

    for question in questions:
        question_list.append(question["Question"].strip())

    document_question = Question(documentName=title, questions=question_list)

    question_collection = get_question_collection()
    await question_collection.insert_one(document_question.model_dump())



// create_summary
from typing import Dict
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from config import config
from utils import AzureManager
from prompt_manager import PromptLoader


async def create_summary(batch_summary: Dict[str, str]) -> str:
    llm_gpt = AzureManager.get_llm(
        deployment_name=config.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME
    )
    prompt_text = await PromptLoader.render_prompt(
        filename="ingestion_prompts", prompt_key="summary_generation"
    )
    prompt = ChatPromptTemplate.from_template(prompt_text)
    chain = prompt | llm_gpt | StrOutputParser()

    accumulated_value = " ".join(batch_summary.values())

    result = await chain.ainvoke({"element": accumulated_value})
    return result



//file_deletion
from typing import List

from config import config
from logs import get_logger
from utils import ChromaHttpManager, DocStoreSingleton, get_question_collection

cronjob_logger = get_logger(__name__, category="cronjob")


async def delete_from_redis_chroma(file_title_list: List[str]) -> None:
    ids_to_delete = []

    kv_store = DocStoreSingleton.get_instance()
    chroma_client = ChromaHttpManager.get_client()

    collections = {
        config.VECTORSTORE_NORMAL: chroma_client.get_or_create_collection(
            config.VECTORSTORE_NORMAL
        ),
        config.VECTORSTORE_SUMMARY: chroma_client.get_or_create_collection(
            config.VECTORSTORE_SUMMARY
        ),
    }

    question_collection = get_question_collection()
    await question_collection.delete_many({"documentName": {"$in": file_title_list}})

    for key, collection in collections.items():
        results = collection.get(where={"Title": {"$in": file_title_list}})
        if results and "metadatas" in results:
            ids_to_delete.extend(metadata[key] for metadata in results["metadatas"])

    if ids_to_delete:
        kv_store.mdelete(ids_to_delete)
        for collection in collections.values():
            collection.delete(where={"Title": {"$in": file_title_list}})

    cronjob_logger.info(f"{file_title_list} deleted successfully.")


//file_type_decide
import os
import csv
import shutil
import subprocess
from typing import Dict

from pdfplumber import open as open_pdf

from logs import get_logger
from ingestion.ppt_pptx_ingestion import ingest_file_ppt
from ingestion.pdf_doc_docx_ingestion import ingest_file_doc_pdf

cronjob_logger = get_logger(__name__, category="cronjob")


COVERSION_TIMEOUT = 90
OUTPUT_DIRS = ["ingestion/output", "figures"]
FAILED_FILES_CSV = "ingestion/csv/failed_files.csv"


def cleanup_output_dirs():
    for folder in OUTPUT_DIRS:
        if os.path.exists(folder):
            shutil.rmtree(folder)


def convert_file_to_pdf(directory: str, filename: str) -> str:
    pdf_name = os.path.splitext(filename)[0] + ".pdf"
    pdf_path = os.path.join(directory, pdf_name)
    subprocess.run(
        [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            directory,
            os.path.join(directory, filename),
        ],
        timeout=COVERSION_TIMEOUT,
    )

    if os.path.exists(pdf_path):
        return pdf_name, pdf_path

    raise Exception(f"Failed to convert {filename} to pdf.")


def is_really_pdf(directory: str, filename: str) -> bool:
    with open_pdf(os.path.join(directory, filename)) as pdf:
        page_layouts = {(page.width, page.height) for page in pdf.pages}
        aspect_ratios = [w / h for w, h in page_layouts]

        total = len(aspect_ratios)
        landscape = sum(1 for r in aspect_ratios if r > 1)

        if len(page_layouts) == 1:
            return aspect_ratios[0] < 1

        portrait = total - landscape
        ratio = landscape / (portrait or 1)

        if landscape == total and ratio > 0.7:
            return False
        elif portrait == total or ratio < 0.3:
            return True

        return False


def log_failed_files(file_information: Dict[str, str], ingestion_error: str) -> None:
    write_header = (
        not os.path.exists(FAILED_FILES_CSV) or os.stat(FAILED_FILES_CSV).st_size == 0
    )

    with open(FAILED_FILES_CSV, "a", newline="") as csvfile:
        writer = csv.writer(csvfile)
        if write_header:
            writer.writerow(
                [
                    "ID",
                    "Name",
                    "Path",
                    "WebUrl",
                    "CreatedDateTime",
                    "ModifiedDateTime",
                    "IngestioError",
                ]
            )

        writer.writerow(
            [
                file_information.get("ID"),
                file_information.get("Name"),
                file_information.get("Path"),
                file_information.get("WebUrl"),
                file_information.get("CreatedDateTime"),
                file_information.get("ModifiedDateTime"),
                ingestion_error,
            ]
        )


async def ingest_files(
    filename: str, file_information: Dict[str, str], file_metadata: Dict[str, str]
) -> None:
    pdf_path = None
    file_summary = None
    ingest_dir = "ingestion/files_to_ingest"
    file_path = os.path.join(ingest_dir, filename)

    base_name, ext = os.path.splitext(filename)
    lower_ext = ext.lower()
    normalized_file = base_name + lower_ext
    normalized_path = os.path.join(ingest_dir, normalized_file)

    file_renamed = False
    if ext.isupper():
        os.rename(file_path, normalized_path)
        file_renamed = True

    try:
        if lower_ext == ".pdf":
            if is_really_pdf(directory=ingest_dir, filename=normalized_file):
                file_summary = await ingest_file_doc_pdf(
                    file_metadata=file_metadata,
                    filename=normalized_file,
                    file_information=file_information,
                )
            else:
                file_summary = await ingest_file_ppt(
                    file_information=file_information,
                    file_metadata=file_metadata,
                    filename=normalized_file,
                )
        elif lower_ext in (".doc", ".docx"):
            pdf_name, pdf_path = convert_file_to_pdf(ingest_dir, normalized_file)
            file_summary = await ingest_file_doc_pdf(
                file_metadata=file_metadata,
                filename=pdf_name,
                file_information=file_information,
            )
        elif lower_ext in (".ppt", ".pptx"):
            pdf_name, pdf_path = convert_file_to_pdf(ingest_dir, normalized_file)
            file_summary = await ingest_file_ppt(
                file_information=file_information,
                file_metadata=file_metadata,
                filename=pdf_name,
            )

    except Exception as e:
        cleanup_output_dirs()
        log_failed_files(file_information=file_information, ingestion_error=str(e))
        cronjob_logger.exception(f"Failed to ingest file: {filename}")

        return None
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

        if file_renamed:
            os.rename(normalized_path, file_path)

    return file_summary


//graph_token_manager
import time
from typing import Dict

import msal


class GraphTokenManager:
    _instance = None
    _token = None
    _expires_at = 0

    @classmethod
    def get_token(
        cls,
        client_id: str,
        client_secret: str,
        tenant_id: str,
    ) -> Dict[str,str]:
        if cls._instance is None:
            cls._instance = msal.ConfidentialClientApplication(
                client_id=client_id,
                client_credential=client_secret,
                authority=f"https://login.microsoftonline.com/{tenant_id}",
            )
            cls._scope = ["https://graph.microsoft.com/.default"]

        if cls._token is None or time.time() > cls._expires_at - 60:
            result = cls._instance.acquire_token_for_client(scopes=cls._scope)

            if "access_token" in result:
                cls._token = result
                cls._expires_at = time.time() + result["expires_in"]
            else:
                raise Exception("Failed to acquire token for ingestion.")

        return cls._token



//pdf_doc_docx_ingestion
import os
import io
import json
import uuid
import shutil
import base64
from typing import Dict, Tuple

from PIL import Image, ImageFile
from langchain_chroma import Chroma
from pdf2image import convert_from_path
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from unstructured.partition.pdf import partition_pdf
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from unstructured.partition.pdf_image import pdf_image_utils
from langchain.retrievers.multi_vector import MultiVectorRetriever

from config import config
from logs import get_logger
from prompt_manager import PromptLoader
from ingestion.create_summary import create_summary
from ingestion.create_questions import generate_and_save_questions
from utils import ChromaHttpManager, AzureManager, DocStoreSingleton

cronjob_logger = get_logger(__name__, category="cronjob")

output_path = "ingestion/output"

embeddings_gpt = AzureManager.get_embeddings()
llm_gpt = AzureManager.get_llm(config.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME)

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True


def create_output_directory():
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(filepath: str) -> None:
    create_output_directory()

    images = convert_from_path(filepath)

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")


async def image_interpreter(img_base64: str, prompt: str) -> None:
    msg = await llm_gpt.ainvoke(
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


async def extract_text_using_ocr(output_path: str) -> Dict[str, str]:
    structured_text = {}
    prompt_text = await PromptLoader.render_prompt(
        filename="ingestion_prompts", prompt_key="extract_text_using_ocr"
    )
    image_list = [
        img for img in os.listdir(output_path) if img.lower().endswith((".jpg", ".png"))
    ]

    error_count = 0
    skipped_pages = 0
    max_allowed = max(1, int(0.05 * len(image_list)))
    for image in image_list:
        try:
            image_path = os.path.join(output_path, image)
            img_name, _ = os.path.splitext(image)

            base64_image = encode_image(image_path)
            text = await image_interpreter(base64_image, prompt_text)

            structured_text[img_name] = text
        except Exception as e:
            error_message = str(e).lower()
            if "content" in error_message:
                skipped_pages += 1
            else:
                error_count += 1

            if (error_count + skipped_pages) > max_allowed:
                return False

            continue

        structured_text[img_name] = text

    sorted_structured_text = {
        key: structured_text[key]
        for key in sorted(structured_text, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_structured_text


async def generate_text_summaries(
    structured_text: Dict[str, str], file_metadata: Dict[str, str]
):
    text_summaries = {}
    prompt_text = await PromptLoader.render_prompt(
        filename="ingestion_prompts", prompt_key="generate_text_summaries"
    )
    prompt = ChatPromptTemplate.from_template(prompt_text)

    summarize_chain = prompt | llm_gpt | StrOutputParser()

    title, _ = os.path.splitext(file_metadata["FileLeafRef"])

    for key, value in structured_text.items():
        summarized_value = await summarize_chain.ainvoke({"element": value})
        text_summaries[key] = f"Title : {title}\nSummary : {summarized_value}"

    return text_summaries


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


async def generate_img_summaries(
    image_output: str, file_metadata: Dict[str, str]
) -> Tuple[Dict[str, str], Dict[str, str]]:
    image_list = [
        img
        for img in os.listdir(image_output)
        if img.lower().endswith((".jpg", ".png"))
    ]
    error_count = 0
    skipped_pages = 0
    max_allowed = max(1, int(0.05 * len(image_list)))

    image_summaries = {}
    img_base64_list = {}

    title, _ = os.path.splitext(file_metadata["FileLeafRef"])

    prompt = await PromptLoader.render_prompt(
        filename="ingestion_prompts", prompt_key="generate_img_summaries"
    )
    for image in image_list:
        try:
            image_path = os.path.join(image_output, image)
            img_name, _ = os.path.splitext(image)

            base64_image = encode_image(image_path)
            summary = await image_interpreter(base64_image, prompt)

            if summary:
                img_base64_list[img_name] = base64_image
                image_summaries[img_name] = f"Title : {title}\nSummary : {summary}"
        except Exception as e:
            error_message = str(e).lower()
            if "content" in error_message:
                skipped_pages += 1
            else:
                error_count += 1

            if (error_count + skipped_pages) > max_allowed:
                return False

            continue

    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


def custom_write_image(image, output_image_path):
    max_size = 65500
    try:
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format="JPEG")
        img_size_kb = len(img_byte_arr.getvalue()) / 1024

        if img_size_kb < 20:
            return

        width, height = image.size
        if width > max_size or height > max_size:
            if width > height:
                new_width = max_size
                new_height = int((max_size / width) * height)
            else:
                new_height = max_size
                new_width = int((max_size / height) * width)
            image = image.resize((new_width, new_height), Image.LANCZOS)

        image.save(output_image_path)
    except Exception as e:
        print(f"Failed to process image: {e}")


pdf_image_utils.write_image = custom_write_image


def extract_pdf_elements(file_path: str):
    return partition_pdf(
        filename=file_path,
        extract_images_in_pdf=True,
        infer_table_structure=True,
        chunking_strategy="by_title",
        max_characters=4000,
        new_after_n_chars=3800,
        combine_text_under_n_chars=2000,
    )


async def create_multi_vector_retriever(
    vectorstore: Chroma,
    vectorstore_summary: Chroma,
    text_summaries: Dict[str, str],
    texts: Dict[str, str],
    image_summaries: Dict[str, str],
    images: Dict[str, str],
    file_metadata: Dict[str, str],
    web_url: str,
    batch_size=75,
) -> str:
    title, _ = os.path.splitext(file_metadata["FileLeafRef"])
    store = DocStoreSingleton.get_instance()

    id_key_normal = config.VECTORSTORE_NORMAL
    id_key_summary = config.VECTORSTORE_SUMMARY

    combined_summaries = {}
    combined_contents = {}

    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store, id_key=id_key_normal
    )
    retriever_summary = MultiVectorRetriever(
        vectorstore=vectorstore_summary, docstore=store, id_key=id_key_summary
    )

    if text_summaries:
        combined_summaries.update(text_summaries)
        combined_contents.update(texts)

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

        summary = await create_summary(batch_summary=batch_summaries)
        all_document_summaries.append(summary)

    if len(all_document_summaries) > 1:
        final_summary = " ".join(all_document_summaries)
    else:
        final_summary = all_document_summaries[0]

    await generate_and_save_questions(
        title=title,
        summary=final_summary,
    )

    cronjob_logger.info(f"Questions created for: {title}")

    def add_documents(
        retriever: MultiVectorRetriever,
        doc_summaries: Dict[str, str],
        doc_contents: Dict[str, str],
    ):
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
                        "Country": file_metadata["Country"],
                        "Region": file_metadata["Region"],
                        "StrategyArea": file_metadata["StrategyArea"],
                        "Title": title,
                        "deliverables_list_metadata": f"{file_metadata}",
                        "source": web_url,
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                {
                    "page_content": s,
                    "summary": doc_summaries[key],
                    "metadata": {
                        id_key_normal: doc_ids[i],
                        "Country": file_metadata["Country"],
                        "Region": file_metadata["Region"],
                        "StrategyArea": file_metadata["StrategyArea"],
                        "Title": title,
                        "deliverables_list_metadata": f"{file_metadata}",
                        "source": web_url,
                        "slide_number": key,
                    },
                }
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            full_docs_byte = [json.dumps(item).encode("utf-8") for item in full_docs]
            retriever.docstore.mset(list(zip(doc_ids, full_docs_byte)))

    add_documents(
        retriever=retriever,
        doc_summaries=combined_summaries,
        doc_contents=combined_contents,
    )

    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
            metadata={
                id_key_summary: doc_id_summary[0],
                "Country": file_metadata["Country"],
                "Region": file_metadata["Region"],
                "StrategyArea": file_metadata["StrategyArea"],
                "Title": title,
                "deliverables_list_metadata": f"{file_metadata}",
                "source": web_url,
            },
        )
    ]
    retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
    full_docs_summaryRetriever = [
        {
            "page_content": f"Summary of the document - {title} - is {final_summary}",
            "summary": f"Summary of the document - {title} - is {final_summary}",
            "metadata": {
                id_key_summary: doc_id_summary[0],
                "Country": file_metadata["Country"],
                "Region": file_metadata["Region"],
                "StrategyArea": file_metadata["StrategyArea"],
                "Title": title,
                "deliverables_list_metadata": f"{file_metadata}",
                "source": web_url,
            },
        }
    ]
    full_docs_summaryRetriever_byte = [
        json.dumps(item).encode("utf-8") for item in full_docs_summaryRetriever
    ]
    retriever_summary.docstore.mset(
        list(zip(doc_id_summary, full_docs_summaryRetriever_byte))
    )

    return final_summary


async def ingest_file_doc_pdf(
    filename: str, file_metadata: Dict[str, str], file_information: Dict[str, str]
) -> str:
    ingest_dir = "ingestion/files_to_ingest"
    image_output = "figures"
    file_path = os.path.join(ingest_dir, filename)

    pdf_to_images(file_path)

    structured_text = await extract_text_using_ocr(output_path=output_path)

    if structured_text is False:
        shutil.rmtree(output_path)
        raise Exception("Failed to generate OCR.")

    cronjob_logger.info(f"OCR text extracted for document: {filename}")

    text_summaries = await generate_text_summaries(
        structured_text=structured_text, file_metadata=file_metadata
    )

    cronjob_logger.info(f"Text summaries created for document: {filename}")

    extract_pdf_elements(file_path)

    extracted_images = sorted(os.listdir(image_output))

    for index, filename in enumerate(extracted_images, start=1):
        file_ext = os.path.splitext(filename)[1]
        new_file = f"figure_{index}{file_ext}"
        os.rename(
            os.path.join(image_output, filename),
            os.path.join(image_output, new_file),
        )

    result_image = await generate_img_summaries(
        image_output=image_output, file_metadata=file_metadata
    )

    if result_image is False:
        shutil.rmtree(image_output)
        raise Exception("Failed to generate image summaries.")

    cronjob_logger.info(f"Image/table summaries created for document: {filename}")

    base64_image, summary_image = result_image

    shutil.rmtree(output_path)
    shutil.rmtree("figures")

    vectorstore = ChromaHttpManager.get_vectorstore(
        collection_name=config.VECTORSTORE_NORMAL
    )
    vectorstore_summary = ChromaHttpManager.get_vectorstore(
        collection_name=config.VECTORSTORE_SUMMARY
    )

    file_summary = await create_multi_vector_retriever(
        vectorstore=vectorstore,
        vectorstore_summary=vectorstore_summary,
        text_summaries=text_summaries,
        texts=structured_text,
        image_summaries=summary_image,
        images=base64_image,
        file_metadata=file_metadata,
        web_url=file_information.get("WebUrl"),
    )

    return file_summary



//ppt_pptx_ingestion
import os
import uuid
import json
import shutil
import base64
from typing import Dict, Tuple

from langchain_chroma import Chroma
from pdf2image import convert_from_path
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain.retrievers.multi_vector import MultiVectorRetriever

from config import config
from logs import get_logger
from prompt_manager import PromptLoader
from ingestion.create_summary import create_summary
from ingestion.create_questions import generate_and_save_questions
from utils import ChromaHttpManager, AzureManager, DocStoreSingleton

cronjob_logger = get_logger(__name__, category="cronjob")

output_path = "ingestion/output"

embeddings_gpt = AzureManager.get_embeddings()
llm_gpt = AzureManager.get_llm(config.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME)


def create_output_directory():
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(filepath: str) -> None:
    create_output_directory()

    images = convert_from_path(filepath)

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


async def image_interpreter(img_base64, prompt):
    msg = await llm_gpt.ainvoke(
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


async def generate_img_summaries(
    image_output: str, file_metadata: Dict[str, str]
) -> Tuple[Dict[str, str], Dict[str, str]]:
    image_list = [
        img
        for img in os.listdir(image_output)
        if img.lower().endswith((".jpg", ".png"))
    ]
    error_count = 0
    skipped_pages = 0
    max_allowed = max(1, int(0.05 * len(image_list)))

    image_summaries = {}
    img_base64_list = {}

    title, _ = os.path.splitext(file_metadata["FileLeafRef"])

    prompt = await PromptLoader.render_prompt(
        filename="ingestion_prompts", prompt_key="generate_img_summaries"
    )
    for image in image_list:
        try:
            image_path = os.path.join(image_output, image)
            img_name, _ = os.path.splitext(image)

            base64_image = encode_image(image_path)
            summary = await image_interpreter(base64_image, prompt)

            if summary:
                img_base64_list[img_name] = base64_image
                image_summaries[img_name] = f"Title : {title}\nSummary : {summary}"
        except Exception as e:
            error_message = str(e).lower()
            if "content" in error_message:
                skipped_pages += 1
            else:
                error_count += 1

            if (error_count + skipped_pages) > max_allowed:
                return False

            continue

    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


async def create_multi_vector_retriever(
    vectorstore: Chroma,
    vectorstore_summary: Chroma,
    image_summaries: Dict[str, str],
    images: Dict[str, str],
    file_metadata: Dict[str, str],
    web_url: str,
    batch_size=75,
) -> str:
    title, _ = os.path.splitext(file_metadata["FileLeafRef"])
    store = DocStoreSingleton.get_instance()

    id_key_normal = config.VECTORSTORE_NORMAL
    id_key_summary = config.VECTORSTORE_SUMMARY

    combined_summaries = {}
    combined_contents = {}

    if image_summaries:
        combined_summaries.update(image_summaries)
        combined_contents.update(images)

    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store, id_key=id_key_normal
    )
    retriever_summary = MultiVectorRetriever(
        vectorstore=vectorstore_summary, docstore=store, id_key=id_key_summary
    )

    doc_keys = list(combined_contents.keys())
    total_docs = len(doc_keys)
    all_document_summaries = []

    for start_idx in range(0, total_docs, batch_size):
        end_idx = min(start_idx + batch_size, total_docs)
        batch_keys = doc_keys[start_idx:end_idx]

        batch_summaries = {key: combined_summaries[key] for key in batch_keys}

        summary = await create_summary(batch_summary=batch_summaries)
        all_document_summaries.append(summary)

    if len(all_document_summaries) > 1:
        final_summary = " ".join(all_document_summaries)
    else:
        final_summary = all_document_summaries[0]

    await generate_and_save_questions(
        title=title,
        summary=final_summary,
    )

    cronjob_logger.info(f"Questions created for: {title}")

    def add_documents(
        retriever: MultiVectorRetriever,
        doc_summaries: Dict[str, str],
        doc_contents: Dict[str, str],
    ):
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
                        "Country": file_metadata["Country"],
                        "Region": file_metadata["Region"],
                        "StrategyArea": file_metadata["StrategyArea"],
                        "Title": title,
                        "deliverables_list_metadata": f"{file_metadata}",
                        "source": web_url,
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                {
                    "page_content": s,
                    "summary": doc_summaries[key],
                    "metadata": {
                        id_key_normal: doc_ids[i],
                        "Country": file_metadata["Country"],
                        "Region": file_metadata["Region"],
                        "StrategyArea": file_metadata["StrategyArea"],
                        "Title": title,
                        "deliverables_list_metadata": f"{file_metadata}",
                        "source": web_url,
                        "slide_number": key,
                    },
                }
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            full_docs_byte = [json.dumps(item).encode("utf-8") for item in full_docs]
            retriever.docstore.mset(list(zip(doc_ids, full_docs_byte)))

    add_documents(
        retriever=retriever,
        doc_summaries=combined_summaries,
        doc_contents=combined_contents,
    )

    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
            metadata={
                id_key_summary: doc_id_summary[0],
                "Country": file_metadata["Country"],
                "Region": file_metadata["Region"],
                "StrategyArea": file_metadata["StrategyArea"],
                "Title": title,
                "deliverables_list_metadata": f"{file_metadata}",
                "source": web_url,
            },
        )
    ]
    retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
    full_docs_summaryRetriever = [
        {
            "page_content": f"Summary of the document - {title} - is {final_summary}",
            "summary": f"Summary of the document - {title} - is {final_summary}",
            "metadata": {
                id_key_summary: doc_id_summary[0],
                "Country": file_metadata["Country"],
                "Region": file_metadata["Region"],
                "StrategyArea": file_metadata["StrategyArea"],
                "Title": title,
                "deliverables_list_metadata": f"{file_metadata}",
                "source": web_url,
            },
        }
    ]
    full_docs_summaryRetriever_byte = [
        json.dumps(item).encode("utf-8") for item in full_docs_summaryRetriever
    ]
    retriever_summary.docstore.mset(
        list(zip(doc_id_summary, full_docs_summaryRetriever_byte))
    )

    return final_summary


async def ingest_file_ppt(
    filename: str, file_metadata: Dict[str, str], file_information: Dict[str, str]
):
    ingest_dir = "ingestion/files_to_ingest"
    file_path = os.path.join(ingest_dir, filename)

    pdf_to_images(file_path)

    result = await generate_img_summaries(output_path, file_metadata)

    if result is False:
        shutil.rmtree(output_path)
        raise Exception("Failed to generate Image Summaries")

    img_base64_list, image_summaries = result
    shutil.rmtree(output_path)

    cronjob_logger.info(f"Slide summaries created for document: {filename}")

    vectorstore = ChromaHttpManager.get_vectorstore(
        collection_name=config.VECTORSTORE_NORMAL
    )
    vectorstore_summary = ChromaHttpManager.get_vectorstore(
        collection_name=config.VECTORSTORE_SUMMARY
    )

    file_summary = await create_multi_vector_retriever(
        vectorstore=vectorstore,
        vectorstore_summary=vectorstore_summary,
        image_summaries=image_summaries,
        images=img_base64_list,
        file_metadata=file_metadata,
        web_url=file_information.get("WebUrl"),
    )
    return file_summary


//sharepoint_file_acquisition
import os
import csv
import shutil
from typing import Dict, List

import pandas as pd
from ingestion import GraphTokenManager
from office365.graph_client import GraphClient

from config import config
from logs import get_logger
from ingestion.file_type_decide import ingest_files
from ingestion.file_deletion import delete_from_redis_chroma

cronjob_logger = get_logger(__name__, category="cronjob")

BASE_DIR = "ingestion"
FAILED_FILES_PATH = "ingestion/csv/failed_files.csv"
FOLDERS_TO_CREATE = [
    "csv",
    "csv/structured_rag_csv",
    "files_to_ingest",
]

ALLOWED_DOC_EXTENSIONS = {".doc", ".docx", ".ppt", ".pptx", ".pdf"}
COLUMN_MAP_ACCESSIBLE_DOCUMENTS = {
    "Filename": "FileLeafRef",
    "Topic": "StrategyArea",
    "Region": "Region",
    "Country": "Country",
}
COLUMN_MAP_STRUCTURED_RAG = {
    "Filename": "Filename",
    "Topic": "Topic_or_Folder",
    "Region": "Region",
    "Country": "Country",
    "Acronym_FullForm": "Acronym_FullForm",
}

if os.path.isdir(BASE_DIR):
    for folder in FOLDERS_TO_CREATE:
        folder_path = os.path.join(BASE_DIR, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path, exist_ok=True)


def get_site_id(client: GraphClient, site_url: str) -> str:
    site = client.sites.get_by_url(site_url).execute_query()
    return site.id


def load_existing_metadata(path: str):
    metadata = {}

    if not os.path.exists(path):
        return metadata

    with open(path, mode="r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["ID"]: row for row in reader}

    return metadata


def download_csv(file_id: str, site_id: str, filename: str):
    access_token = GraphTokenManager.get_token(
        client_id=config.AZURE_CLIENT_ID,
        client_secret=config.AZURE_CLIENT_SECRET,
        tenant_id=config.AZURE_TENANT_ID,
    )

    client = GraphClient(lambda: access_token)

    if filename.startswith("metadata"):
        response = (
            client.sites[site_id]
            .drives[config.SHAREPOINT_DRIVE_ID]
            .items[file_id]
            .get_content()
            .execute_query()
        )

        output_dir = "ingestion/csv/structured_rag_csv"
        os.makedirs(output_dir, exist_ok=True)

        with open(os.path.join(output_dir, filename), "wb") as file:
            file.write(response.value)


def scrape_folder(
    client: GraphClient,
    folder: str,
    path: str,
    existing_metadata: Dict[str, Dict[str, str]],
    doc_new_files: List,
    doc_updated_files: List,
    site_id,
):
    current_file_ids = []

    folder_children = (
        client.sites[site_id]
        .drives[config.SHAREPOINT_DRIVE_ID]
        .items[folder]
        .children.get()
        .execute_query()
    )
    for item in folder_children:
        item_path = f"{path}/{item.name}"
        if item_path.startswith("/EGH_Chatbot"):
            if item.is_folder:
                sub_file_ids = scrape_folder(
                    client=client,
                    folder=item.id,
                    path=item_path,
                    existing_metadata=existing_metadata,
                    doc_new_files=doc_new_files,
                    doc_updated_files=doc_updated_files,
                    site_id=site_id,
                )
                current_file_ids.extend(sub_file_ids)
            else:
                _, ext = os.path.splitext(item.name.lower())

                metadata = {
                    "ID": item.id,
                    "Name": item.name,
                    "Path": item_path,
                    "WebUrl": item.web_url,
                    "CreatedDateTime": item.created_datetime.isoformat(),
                    "ModifiedDateTime": item.last_modified_datetime.isoformat(),
                }

                existing = existing_metadata.get(item.id)
                is_new = not existing
                is_updated = (
                    existing
                    and metadata["ModifiedDateTime"] > existing["ModifiedDateTime"]
                )

                if ext == ".csv":
                    download_csv(
                        file_id=metadata["ID"],
                        site_id=site_id,
                        filename=metadata["Name"],
                    )
                elif ext in ALLOWED_DOC_EXTENSIONS:
                    if is_new:
                        doc_new_files.append(metadata)
                    elif is_updated:
                        doc_updated_files.append(metadata)

                    current_file_ids.append(item.id)

    return current_file_ids


def merge_csv_data(base_folder: str, column_map: str, file_save_path: str):
    dataframes = []

    if os.path.isdir(base_folder):
        for filename in os.listdir(base_folder):
            file_path = os.path.join(base_folder, filename)
            df = pd.read_csv(file_path)

            selected_columns = {
                col: column_map[col] for col in df.columns if col in column_map
            }

            if selected_columns:
                df_filtered = df[list(selected_columns.keys())].rename(
                    columns=selected_columns
                )
                dataframes.append(df_filtered)

        if dataframes:
            masted_df = pd.concat(dataframes, ignore_index=True)
            masted_df.to_csv(file_save_path, index=False)


def write_information_to_csv(
    metadata_dict: Dict[str, Dict[str, str]],
    output_file: str,
    category: str = "file_information",
):
    if category == "file_information":
        fieldnames = [
            "ID",
            "Name",
            "Path",
            "WebUrl",
            "CreatedDateTime",
            "ModifiedDateTime",
        ]
    elif category == "structured_rag_exist":
        fieldnames = [
            "Filename",
            "Topic_or_Folder",
            "Region",
            "Country",
            "Acronym_FullForm",
            "Summary_of_file",
        ]
    elif category == "file_metadata":
        fieldnames = ["FileLeafRef", "StrategyArea", "Region", "Country"]

    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in metadata_dict.values():
            writer.writerow(item)


def load_existing_csv_data(filepath: str, column_name: str):
    if not os.path.isfile(filepath):
        return {}
    with open(filepath, mode="r", encoding="utf-8") as in_file:
        reader = csv.DictReader(in_file)
        return {row[column_name]: row for row in reader}


async def stream_file_content(
    file_id: str,
    filename: str,
    site_id: str,
    file_information: Dict[str, str],
    file_metadata: Dict[str, str],
):
    access_token = GraphTokenManager.get_token(
        client_id=config.AZURE_CLIENT_ID,
        client_secret=config.AZURE_CLIENT_SECRET,
        tenant_id=config.AZURE_TENANT_ID,
    )

    client = GraphClient(lambda: access_token)

    response = (
        client.sites[site_id]
        .drives[config.SHAREPOINT_DRIVE_ID]
        .items[file_id]
        .get_content()
        .execute_query()
    )

    with open(os.path.join("ingestion/files_to_ingest", filename), "wb") as file:
        file.write(response.value)

    cronjob_logger.info(f"Processing File: {filename}")
    summary_of_file = await ingest_files(
        file_information=file_information,
        file_metadata=file_metadata,
        filename=filename,
    )
    os.remove(f"ingestion/files_to_ingest/{filename}")
    cronjob_logger.info(f"File {filename} Finished Processing.")
    return summary_of_file


async def start_ingestion():
    doc_new_files = []
    doc_new_files_ids = []

    doc_updated_files = []
    doc_updated_files_ids = []

    file_ids_to_process = []
    file_title_to_delete = []

    access_token = GraphTokenManager.get_token(
        client_id=config.AZURE_CLIENT_ID,
        client_secret=config.AZURE_CLIENT_SECRET,
        tenant_id=config.AZURE_TENANT_ID,
    )

    client = GraphClient(lambda: access_token)
    site_id = get_site_id(client, config.SHAREPOINT_SITE_URL)

    existing_file_information = load_existing_metadata(
        "ingestion/csv/files_information.csv"
    )
    root = (
        client.sites[site_id]
        .drives[config.SHAREPOINT_DRIVE_ID]
        .root.get()
        .execute_query()
        .id
    )

    current_file_ids = scrape_folder(
        client=client,
        folder=root,
        path="",
        existing_metadata=existing_file_information,
        doc_new_files=doc_new_files,
        doc_updated_files=doc_updated_files,
        site_id=site_id,
    )

    merge_csv_data(
        base_folder="ingestion/csv/structured_rag_csv",
        column_map=COLUMN_MAP_ACCESSIBLE_DOCUMENTS,
        file_save_path="ingestion/csv/accessible_documents_unfiltered.csv",
    )
    merge_csv_data(
        base_folder="ingestion/csv/structured_rag_csv",
        column_map=COLUMN_MAP_STRUCTURED_RAG,
        file_save_path="ingestion/csv/structured_rag_unfiltered.csv",
    )
    shutil.rmtree(
        "ingestion/csv/structured_rag_csv",
    )

    structured_rag_files_existing = load_existing_csv_data(
        filepath="utils/csv/structured_rag.csv",
        column_name="Filename",
    )
    file_metadata = load_existing_csv_data(
        filepath="ingestion/csv/accessible_documents_unfiltered.csv",
        column_name="FileLeafRef",
    )
    structured_rag_files_new = load_existing_csv_data(
        filepath="ingestion/csv/structured_rag_unfiltered.csv",
        column_name="Filename",
    )

    existing_file_ids_set = set(existing_file_information.keys())
    current_file_ids_set = set(current_file_ids)
    deleted_file_ids = existing_file_ids_set - current_file_ids_set

    for file_id_to_delete in deleted_file_ids:
        filename = existing_file_information[file_id_to_delete]["Name"]
        file_title_to_delete.append(os.path.splitext(filename)[0])
        del structured_rag_files_existing[filename]
        del existing_file_information[file_id_to_delete]

    for doc_new_file in doc_new_files:
        doc_new_files_ids.append(doc_new_file["ID"])

    for doc_updated_file in doc_updated_files:
        filename = existing_file_information[doc_updated_file]["Name"]
        file_title_to_delete.append(os.path.splitext(filename)[0])
        doc_updated_files_ids.append(doc_updated_file["ID"])
        del structured_rag_files_existing[filename]
        del existing_file_information[doc_updated_file["ID"]]

    for item in doc_new_files + doc_updated_files:
        existing_file_information[item["ID"]] = item

    file_ids_to_process = doc_new_files_ids + doc_updated_files

    write_information_to_csv(
        metadata_dict=existing_file_information,
        output_file="ingestion/csv/files_information.csv",
    )

    file_information = load_existing_csv_data(
        filepath="ingestion/csv/files_information.csv", column_name="ID"
    )

    if file_title_to_delete:
        await delete_from_redis_chroma(file_title_list=file_title_to_delete)

    for file_id_to_process in file_ids_to_process:
        filename = file_information[file_id_to_process]["Name"]
        summary_of_file = await stream_file_content(
            filename=filename,
            file_id=file_id_to_process,
            site_id=site_id,
            file_metadata=file_metadata[filename],
            file_information=file_information[file_id_to_process],
        )

        if summary_of_file:
            new_data_dict = structured_rag_files_new[filename]
            structured_rag_files_existing[filename] = {
                **new_data_dict,
                "Summary_of_file": summary_of_file,
            }

    if os.path.exists(FAILED_FILES_PATH):
        failed_files_csv = pd.read_csv(FAILED_FILES_PATH)
        fileids_to_remove = failed_files_csv["ID"].dropna().unique().tolist()

        for fileid_to_remove in fileids_to_remove:
            name = file_information[fileid_to_remove]["Name"]
            del file_metadata[name]

    write_information_to_csv(
        metadata_dict=structured_rag_files_existing,
        output_file="utils/csv/structured_rag.csv",
        category="structured_rag_exist",
    )
    write_information_to_csv(
        metadata_dict=file_metadata,
        output_file="utils/csv/accessible_documents.csv",
        category="file_metadata",
    )







// question_model
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Question(BaseModel):
    documentName: str = Field(..., description="Name of the document.")
    questions: List[str] = Field(..., description="Questions generated for the document.")
    createdAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp for creation of questions.",
    )
    updatedAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp for the last update of questions.",
    )

