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

settings = Settings(anonymized_telemetry=False)
load_dotenv()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

summary_text_path = "summary_text.txt"
full_docs_text_path = "full_docs_text.txt"
output_path = os.path.join(os.getcwd(), "output")
CHROMA_CLIENT = chromadb.HttpClient(host="10.225.1.6", port=8000, settings=settings)

llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    max_retries=20,
)


def create_output_directory():
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")

    logging.info("Slides extracted")


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    msg = llm_gpt.invoke(
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


def generate_img_summaries(path, deliverables_list_metadata):
    image_summaries = {}
    img_base64_list = {}
    prompt = """use this image to extract and analyze the information thoroughly"""
    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)
            title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
            abstract = deliverables_list_metadata["Abstract"]

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=30)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False
            image_summaries[img_name] = (
                f"Title : {title}\nAbstract : {abstract}\nSummary : {summary}"
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
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def save_array_to_text(file_path, data_to_save):
    with open(file_path, "a") as f:
        for item in data_to_save:
            text_data = json.dumps(item)
            f.write(text_data + "\n")


def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
    batch_size=75,
):
    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])

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

    def add_documents(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, total_docs, batch_size):
            document_summary_list = []

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
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": key,
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
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

            document_summary_list.append(create_summary(batch_summaries))

        return document_summary_list

    all_document_summaries = add_documents(
        retriever, combined_summaries, combined_contents
    )

    if len(all_document_summaries) > 1:
        combined_summary = " ".join(all_document_summaries)
    else:
        combined_summary = all_document_summaries[0] if all_document_summaries else ""

    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "ContentTags": deliverables_list_metadata["ContentTags"],
                "Abstract": deliverables_list_metadata["Abstract"],
                "Region": deliverables_list_metadata["Region"],
                "StrategyArea": deliverables_list_metadata["StrategyArea"],
                "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                "Country": deliverables_list_metadata["Country"],
                "Country_x003a_CountryFusionID": deliverables_list_metadata[
                    "Country_x003a_CountryFusionID"
                ],
                "ContentTypes": deliverables_list_metadata["ContentTypes"],
                "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                "DeliverablePermissions": deliverables_list_metadata[
                    "DeliverablePermissions"
                ],
                "source": file_metadata["WebUrl"],
                "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
    full_docs_summaryRetriever = [
        Document(
            page_content=json.dumps(
                {
                    "summary": f"Summary of the document - {title} - is {combined_summary}",
                    "content": f"Summary of the document - {title} - is {combined_summary}",
                }
            ),
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "ContentTags": deliverables_list_metadata["ContentTags"],
                "Abstract": deliverables_list_metadata["Abstract"],
                "Region": deliverables_list_metadata["Region"],
                "StrategyArea": deliverables_list_metadata["StrategyArea"],
                "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                "Country": deliverables_list_metadata["Country"],
                "Country_x003a_CountryFusionID": deliverables_list_metadata[
                    "Country_x003a_CountryFusionID"
                ],
                "ContentTypes": deliverables_list_metadata["ContentTypes"],
                "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                "DeliverablePermissions": deliverables_list_metadata[
                    "DeliverablePermissions"
                ],
                "source": file_metadata["WebUrl"],
                "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.docstore.mset(
        list(zip(doc_id_summary, full_docs_summaryRetriever))
    )

    generate_and_save_questions(title, combined_summary)

    save_docstore(retriever.docstore, docstore_path_normal)
    save_docstore(retriever_summary.docstore, docstore_path_summary)

    logging.info(f"Ingestion Done {file_metadata['Name']}")


def pdf_ppt_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")

        pdf_to_images(fpath, fname)

        result = generate_img_summaries(output_path, deliverables_list_metadata)

        if result is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree(output_path)

        embeddings = AzureOpenAIEmbeddings(
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_EMBEDDINGS_MODEL"],
        )
        vectorstore = Chroma(
            collection_name="GatesVentures_Scientia",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        vectorstore_summary = Chroma(
            collection_name="GatesVentures_Scientia_Summary",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        create_multi_vector_retriever(
            vectorstore,
            vectorstore_summary,
            image_summaries,
            img_base64_list,
            file_metadata,
            deliverables_list_metadata,
        )
        return True
    except Exception as e:
        logging.error(f"Error in PowerPoint ingestion: {e}")
        return False
