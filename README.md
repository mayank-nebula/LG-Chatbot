import os
import io
import json
import uuid
import shutil
import pickle
import base64
import logging
import concurrent.futures

import requests
import chromadb
from dotenv import load_dotenv
from PIL import Image, ImageFile
from chromadb.config import Settings
from pdfplumber import open as open_pdf
from pdf2image import convert_from_path
from langchain.storage import InMemoryStore
from langchain_openai import AzureChatOpenAI
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_core.prompts import PromptTemplate
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from unstructured.partition.pdf import partition_pdf
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from unstructured.partition.pdf_image import pdf_image_utils
from concurrent.futures import ThreadPoolExecutor, as_completed
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

max_retries = 5
url_text = "http://10.0.0.4:8181/infer-file"
url_table = "http://10.0.0.4:8183/detect-tables"
output_path = os.path.join(os.getcwd(), "output")
output_path_table = os.path.join(os.getcwd(), "table")
CHROMA_CLIENT = chromadb.HttpClient(host="10.225.1.6", port=8000, settings=settings)


llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    max_retries=20,
)

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True


def extract_text_using_ocr(image_path):
    structured_text = {}
    prompt = (
        """use this image to do the OCR and extract the text in structured format"""
    )
    for img_file in os.listdir(image_path):
        img_name, _ = os.path.splitext(img_file)
        img_path = os.path.join(image_path, img_file)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(encode_image, img_path)
            try:
                base64_image = future.result(timeout=30)
            except concurrent.futures.TimeoutError:
                return False

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(image_summarize, base64_image, prompt)
            try:
                text = future.result(timeout=60)
            except concurrent.futures.TimeoutError:
                return False

        structured_text[img_name] = text
        sorted_structured_text = {
            key: structured_text[key]
            for key in sorted(structured_text, key=lambda x: int(x.split("_")[1]))
        }
    return sorted_structured_text


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


def is_valid_image(file_path):
    with Image.open(file_path) as img:
        img.verify()
    return True


def send_infer_request(image_path):
    task_prompt = "<OCR>"
    for attempt in range(max_retries):
        try:
            with open(image_path, "rb") as file:
                files = {"files": file}
                data = {"task_prompt": task_prompt}
                logging.info(f"Sending request for {image_path}")
                response = requests.post(url_text, files=files, data=data)
                logging.info(f"Response status code: {response.status_code}")
                if response.status_code != 200:
                    logging.error(f"Response content: {response.content}")
                response.raise_for_status()
                return response.json()
        except requests.RequestException as e:
            logging.error(
                f"Request failed for {image_path} on attempt {attempt + 1}/{max_retries}: {e}"
            )
    return {"error": f"Failed to process {image_path} after {max_retries} attempts"}


def parallel_inferencing(image_paths, max_workers=3):
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_image = {
            executor.submit(send_infer_request, path): path for path in image_paths
        }
        for future in as_completed(future_to_image):
            image_path = future_to_image[future]
            try:
                result = future.result()
                results.append((image_path, result))
            except Exception as exc:
                logging.error(f"{image_path} generated an exception: {exc}")
    return results


def structure_ocr_with_llm(ocr_text):
    prompt = PromptTemplate(
        input_variables=["ocr_text"],
        template="""
        Extract well-structured text from OCR text of a scanned page, ensuring no loss of detail, accurate formatting, and proper handling of tabular data.

        Instructions:

        Extract Complete Text:
            Extract all text from the raw OCR output without truncating or losing any details.

        Preserve Structure:
            Retain the original structure of the text, including paragraphs, headings, bullet points, and any other formatting elements.

        Handle Tabular Data:
            If the scanned page contains tabular data, format it into a clear and readable table format with proper rows and columns.

        Ensure Accuracy:
            Ensure that the extracted text is accurate and free of errors.

        Maintain Original Formatting:
            Maintain the original font styles (bold, italics, underlined) and other text attributes as much as possible.

        Present Comprehensive Content:
            Ensure that the returned text includes all information from the scanned page, preserving the context and details.

        Things to avoid:
        1. Dont add any introductory text or closing text like "here is the well structured text" or "hope this is fine" etc
        2. Dont add anyhting from your knowledge but only from provided content
        3. Dont think adn interact verbally and give the final output directly without adding any salutation / conversation / closing statements
        Here is the OCR text:
        4. Dont add any text like 'Here is the well-structured text extracted from the OCR output:' in the final output
        {ocr_text}
        """,
    )

    chain = prompt | llm_gpt | StrOutputParser()
    structured_ocr = chain.invoke(ocr_text)

    return structured_ocr


def generate_text_summaries(texts, deliverables_list_metadata, summarize=False):
    prompt_text = """
        System Instructions:

        Generate a concise and accurate summary from the provided well-structured text. The summary will be used for query matching in a RAG system.
        
        Preserve Key Information:
            Identify and include all key points and important details from the well-structured text.
        
        Maintain Clarity:
            Ensure the summary is clear and easy to understand, using complete sentences and proper grammar.
        
        Conciseness:
            Keep the summary brief while covering all significant aspects of the original text.
        
        Context Preservation:
            Ensure the context and meaning of the original text are preserved in the summary.
        
        Avoid Redundancy:
            Avoid repetition of information and ensure the summary is free of redundant details.
        
        Things to avoid:
        1. Dont add any introductory text or closing text like "here is the well structured text" or "hope this is fine" etc
        2. Dont add anyhting from your knowledge but only from provided content
        3. Dont think adn interact verbally and give the final output directly without adding any salutation / conversation / closing statements
        4. Dont add any text like 'Here is a concise and accurate summary of the provided text' in the final output
        Here is the well structured text: 

        {element}
    """
    prompt = ChatPromptTemplate.from_template(prompt_text)

    summarize_chain = {"element": lambda x: x} | prompt | llm_gpt | StrOutputParser()

    text_summaries = {}

    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
    abstract = deliverables_list_metadata["Abstract"]

    if summarize:
        for key, value in texts.items():
            summarized_value = summarize_chain.invoke({"element": value})
            text_summaries[key] = (
                f"Title : {title}\nAbstract : {abstract}\nSummary : {summarized_value}"
            )

    return text_summaries


def send_image_for_detection(api_url, image_path, output_dir):
    with open(image_path, "rb") as image_file:
        files = {"file": image_file}
        data = {"output_dir": output_dir}
        response = requests.post(api_url, files=files, data=data)
        response.raise_for_status()
        return response.json()


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
            print(
                f"Resizing image from ({width}, {height}) to fit within ({max_size}, {max_size})"
            )
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


def extract_pdf_elements(path, fname):

    return partition_pdf(
        filename=os.path.join(path, fname),
        extract_images_in_pdf=True,
        infer_table_structure=True,
        chunking_strategy="by_title",
        max_characters=4000,
        new_after_n_chars=3800,
        combine_text_under_n_chars=2000,
    )


def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    text_summaries,
    texts,
    table_summaries,
    tables,
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

    if text_summaries:
        combined_summaries.update(text_summaries)
        combined_contents.update(texts)

    if table_summaries:
        combined_summaries.update(table_summaries)
        combined_contents.update(tables)

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


def pdf_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")

        pdf_to_images(fpath, fname)

        # delete from here
        # unstructured_text = {}

        # image_paths = [
        #     os.path.join(output_path, file)
        #     for file in os.listdir(output_path)
        #     if file.endswith((".png", ".jpg", ".jpeg"))
        #     and is_valid_image(os.path.join(output_path, file))
        # ]

        # results_inferencing = parallel_inferencing(image_paths)

        # for image_path, result in results_inferencing:
        #     file_name_with_ext = os.path.basename(image_path)
        #     page_number, _ = os.path.splitext(file_name_with_ext)

        #     unstructured_text[page_number] = result["results"][0]["<OCR>"]
        #     unstructured_text = {
        #         key: unstructured_text[key]
        #         for key in sorted(unstructured_text, key=lambda x: int(x.split("_")[1]))
        #     }

        # structured_text = {}

        # for i, (img_name, s) in enumerate(unstructured_text.items()):
        #     result = structure_ocr_with_llm(s)
        #     structured_text[img_name] = result

        structured_text = extract_text_using_ocr(output_path)

        text_summaries = generate_text_summaries(
            structured_text, deliverables_list_metadata, summarize=True
        )

        logging.info("Text Summary Done")

        for file in os.listdir(output_path):
            response = send_image_for_detection(
                url_table, os.path.join(output_path, file), output_path_table
            )

        tables, table_summaries = generate_img_summaries(
            "table", deliverables_list_metadata
        )

        logging.info("Table Summary Done")

        extract_pdf_elements(fpath, fname)

        files = sorted(os.listdir("figures"))

        for index, filename in enumerate(files, start=1):
            file_ext = os.path.splitext(filename)[1]
            new_file = f"figure_{index}{file_ext}"
            os.rename(
                os.path.join("figures", filename), os.path.join("figures", new_file)
            )

        base64_image, summary_image = generate_img_summaries(
            "figures", deliverables_list_metadata
        )

        shutil.rmtree(output_path)
        shutil.rmtree(output_path_table)
        shutil.rmtree("figures")

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
            text_summaries,
            structured_text,
            table_summaries,
            tables,
            summary_image,
            base64_image,
            file_metadata,
            deliverables_list_metadata,
        )
        return True
    except Exception as e:
        logging.error(f"Error in PDF ingestion: {e}")
        return False
