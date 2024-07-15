import os
import subprocess
from pdf2image import convert_from_path, exceptions
import requests
import logging
import time
import json
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FAISS index
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
dimension = embedding_model.get_sentence_embedding_dimension()
# index = faiss.IndexFlatL2(dimension)

# Metadata store
metadata = []

# Document collection
document_collection = []

# API endpoints
chat_api_url = "http://localhost:8182/chat"
table_detection_api_url = "http://localhost:8183/detect-tables"
ollama_url = "http://localhost:11434/api/generate"


def convert_to_pdf(file_path, output_folder):
    pdf_file = os.path.join(
        output_folder,
        os.path.basename(file_path).replace(os.path.splitext(file_path)[1], ".pdf"),
    )
    try:
        subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                output_folder,
                file_path,
            ],
            check=True,
        )
        logger.info(f"PDF saved to {pdf_file}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error during PDF conversion: {e}")
        raise
    return pdf_file


def convert_pdf_to_images(pdf_file, output_folder):
    try:
        images = convert_from_path(pdf_file)
        image_paths = []
        for i, image in enumerate(images):
            image_path = os.path.join(output_folder, f"slide_{i + 1}.png")
            image.save(image_path, "PNG")
            image_paths.append(image_path)
        return image_paths
    except (
        exceptions.PDFInfoNotInstalledError,
        exceptions.PDFPageCountError,
        exceptions.PDFSyntaxError,
    ) as e:
        logger.error(f"Error converting PDF to images: {e}")
        raise


def extract_text_from_image(image_path):
    question = """
        Analyze the given image and provide a detailed textual output based on the content type present in the image. Follow these specific instructions for different content types, focusing on extracting structured text suitable for chunking and vector ingestion.
        
        Content Types:
        Slide (Presentation Slide)
        Table
        Chart/Graph
        Visualization (Infographics, Diagrams, etc.)
        Text Block
        
        General Instructions to be followed for each content type:
        Formatting: Ensure the extracted text retains any original formatting such as bold, italics, or underlining.
        Accuracy: Strive for high accuracy in transcribing the text and data.
        Comprehensive Extraction: Make sure all visible text, symbols, and data points are captured and described in detail.
        Detailed contextual Summary: Provide a detailed contextual summary of the entire document
        Complete Text: Provide detailed text of the entire document (word by word)
        Images/Pictures: Include detailed descriptions of any images, pictures, or visual elements in the content.
        
        Specific Instructions:
        1. Slide (Presentation Slide)
        Title: Extract and provide the main title of the slide.
        Subtitles: Extract any subtitles or secondary headings.
        Bullet Points: List all bullet points or key points.
        Images/Diagrams: Describe any images or diagrams present, including their captions.
        Notes/Annotations: Extract any speaker notes or annotations if visible.
        Additional Elements: Capture any additional elements like timelines, icons, or visual markers with contextual details.
        Detailed contextual Summary: Provide a detailed contextual summary of the entire document
        Complete Text: Provide detailed text of the entire document (word by word)
        
        2. Table
        Table Title: Provide the title of the table.
        Column Headers: List all column headers.
        Row Headers: List all row headers.
        Cell Data: Extract the data from each cell, specifying the corresponding row and column for clarity.
        Footnotes/Annotations: Extract any footnotes or annotations related to the table.
        Images/Pictures: Describe any images or visual elements associated with the table.
        Detailed contextual Summary: Provide a detailed contextual summary of the entire document
        Complete Text: Provide detailed text of the entire document (word by word)
        
        3. Chart/Graph
        Chart Title: Extract the title of the chart or graph.
        Type: Specify the type of chart (e.g., bar chart, pie chart, line graph).
        Axis Titles: Provide the titles of the X and Y axes.
        Legend: Extract the legend entries and their corresponding colors or markers.
        Data Points: List the data points, specifying the values and their corresponding categories or labels.
        Trend Lines/Markers: Describe any trend lines or special markers.
        Notes/Annotations: Extract any notes or annotations related to the chart.
        Images/Pictures: Describe any images or visual elements associated with the chart.
        Detailed contextual Summary: Provide a detailed contextual summary of the entire document
        Complete Text: Provide detailed text of the entire document (word by word)
        
        4. Visualization (Infographics, Diagrams, etc.)
        Title: Extract the main title of the visualization.
        Sections/Subsections: Describe the main sections or subsections of the visualization.
        Key Elements: List and describe key elements, icons, or symbols used.
        Data Points/Statistics: Extract any data points, statistics, or key figures.
        Flow/Hierarchy: Describe any flow or hierarchical structure present.
        Notes/Annotations: Extract any notes or annotations related to the visualization.
        Images/Pictures: Describe any images or visual elements associated with the visualization.
        Detailed contextual Summary: Provide a detailed contextual summary of the entire document
        Complete Text: Provide detailed text of the entire document (word by word)
        
        5. Text Block
        Title: Extract the title of the text block if present.
        Paragraphs: Break down the text into paragraphs and provide each paragraph separately.
        Headings/Subheadings: Extract any headings or subheadings.
        Lists: Extract any ordered or unordered lists, detailing each item.
        Quotes: Identify and extract any quotes or highlighted text.
        Footnotes/Annotations: Extract any footnotes or annotations related to the text block.
        Images/Pictures: Describe any images or visual elements associated with the text block.
        Detailed contextual Summary: Provide a detailed contextual summary of the entire document
        Complete Text: Provide detailed text of the entire document (word by word)
        """
    result = send_infer_request(image_path, question)
    if "error" in result:
        logger.error(f"Error processing {image_path}: {result['error']}")
        return None
    else:
        generated_text = result.get("generated_text", "")
        return generated_text


def send_infer_request(image_path, question):
    try:
        with open(image_path, "rb") as file:
            files = {"file": file}
            data = {"question": question}
            start_time = time.time()
            response = requests.post(chat_api_url, files=files, data=data)
            end_time = time.time()
            duration = end_time - start_time
            logger.info(f"Response status code: {response.status_code}")
            logger.info(f"Inferencing time for {image_path}: {duration:.2f} seconds")
            if response.status_code != 200:
                logger.error(f"Response content: {response.content}")
            response.raise_for_status()
            return response.json()
    except requests.RequestException as e:
        logger.error(f"Request failed for {image_path}: {e}")
        return {"error": f"Failed to process {image_path}"}


def generate_questions(extracted_text, image_metadata):
    question_prompt = """
        Based on the following content, generate a list of 3 questions along with their answers. 
        Make sure the questions are fully contextualized so that even if someone does not have any context, they should be able to understand the question in fully qualified and contextualized manner. 
        All questions must not assume any pre knowledge. it should be in the question itself.
        No mcqs whatsoever.  
        the format of the questiosn shoudl be  in tabular format: Sl No, question type, Question, Answer.  \n\n"
    """
    question_prompt += extracted_text
    question_prompt += "\n\nProvide the questions and answers in a simple text format."

    result = send_question_request(question_prompt)
    if "error" in result:
        logger.error(f"Error generating questions: {result['error']}")
        return ""
    else:
        return result.get("response", "")


def send_question_request(question_prompt):
    try:
        headers = {"Content-Type": "application/json"}
        data = {"model": "llama3:latest", "prompt": question_prompt, "stream": False}
        response = requests.post(ollama_url, headers=headers, data=json.dumps(data))

        if response.status_code != 200:
            logger.error(f"Response content: {response.content}")
        response.raise_for_status()

        # Try to parse JSON response
        try:
            return response.json()
        except json.JSONDecodeError as json_err:
            logger.error(f"JSON decode error: {json_err}")
            logger.error(f"Response content: {response.text}")
            return {"error": "Failed to parse JSON response"}

    except requests.RequestException as e:
        logger.error(f"Request failed: {e}")
        return {"error": "Failed to generate questions"}


def save_questions_to_text(questions, text_file_path):
    with open(text_file_path, "a") as file:
        file.write(questions + "\n\n")
    logger.info(f"Questions saved to {text_file_path}")


def process_file(file_path, output_folder, collection_file_path):
    try:
        pdf_file = convert_to_pdf(file_path, output_folder)
        return process_pdf(pdf_file, output_folder, collection_file_path)
    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        raise


def process_pdf(pdf_file, output_folder, collection_file_path):
    try:
        image_paths = convert_pdf_to_images(
            pdf_file, os.path.join(output_folder, "images")
        )
        all_text = []
        csv_file_path = os.path.join(output_folder, "questions.txt")
        for slide_index, image_path in enumerate(image_paths):
            logger.info(f"Processing slide {slide_index + 1}...")
            extracted_text = extract_text_from_image(image_path)
            if extracted_text:
                all_text.append(f"Slide {slide_index + 1}:\n{extracted_text}")
                save_extracted_text(
                    f"Slide {slide_index + 1}:\n{extracted_text}",
                    os.path.join(output_folder, "text"),
                )

                # Store document in collection
                document = {
                    "metadata": {
                        "source": os.path.basename(pdf_file),
                        "page": slide_index + 1,
                    },
                    "page_content": extracted_text,
                }
                document_collection.append(document)
                save_document_collection(document_collection, collection_file_path)

                # Generate questions
                questions = generate_questions(
                    extracted_text,
                    {"source": os.path.basename(pdf_file), "page": slide_index + 1},
                )
                questions_with_metadata = f"Document: {os.path.basename(pdf_file)}, Page: {slide_index + 1}\n{questions}"
                save_questions_to_text(questions_with_metadata, csv_file_path)

        return "\n\n".join(all_text)
    except Exception as e:
        logger.error(f"Error processing PDF {pdf_file}: {e}")
        raise


def save_extracted_text(content, output_folder):
    try:
        output_file = os.path.join(output_folder, "extracted_text.txt")
        with open(output_file, "a") as text_file:
            text_file.write(content + "\n\n")
        logger.info(f"Text has been extracted to {output_file}")
    except Exception as e:
        logger.error(f"Error saving extracted text: {e}")
        raise


def save_document_collection(collection, collection_file_path):
    with open(collection_file_path, "w") as f:
        json.dump(collection, f)
    logger.info(f"Document collection saved to {collection_file_path}")


def load_document_collection(collection_file_path):
    with open(collection_file_path, "r") as f:
        return json.load(f)


def chunk_and_index_documents(document_collection):
    for doc in document_collection:
        metadata = doc["metadata"]
        content = doc["page_content"]

        # Generate embeddings and store in FAISS
        embeddings = embedding_model.encode([content])
        # index.add(np.array(embeddings))
        metadata.append(
            {"source": metadata["source"], "page": metadata["page"], "content": content}
        )


def save_faiss_index(index, index_file_path):
    faiss.write_index(index, index_file_path)
    logger.info(f"FAISS index saved to {index_file_path}")


def save_metadata(metadata, metadata_file_path):
    with open(metadata_file_path, "w") as f:
        json.dump(metadata, f)
    logger.info(f"Metadata saved to {metadata_file_path}")


def main():
    current_directory = os.getcwd()
    print(current_directory)
    input_folder = os.path.join(
        current_directory, "files_to_ingest"
    )  # Ensure this is the correct input folder
    output_base_folder = os.path.join(current_directory, "output_extraction")

    if not os.path.exists(input_folder):
        logger.error(f"The input folder '{input_folder}' does not exist.")
        return
    print(os.listdir(input_folder))

    os.makedirs(output_base_folder, exist_ok=True)

    # Initialize and save the document collection file
    global document_collection  # Ensure document_collection is properly referenced
    collection_file_path = os.path.join(output_base_folder, "document_collection.json")
    save_document_collection(document_collection, collection_file_path)

    for filename in os.listdir(input_folder):
        file_path = os.path.join(input_folder, filename)
        if filename.lower().endswith((".pptx", ".ppt", ".docx", ".doc", ".pdf")):
            file_output_folder = os.path.join(
                output_base_folder, os.path.splitext(filename)[0]
            )
            os.makedirs(file_output_folder, exist_ok=True)
            os.makedirs(os.path.join(file_output_folder, "images"), exist_ok=True)
            os.makedirs(os.path.join(file_output_folder, "text"), exist_ok=True)

            try:
                if filename.lower().endswith((".pptx", ".ppt", ".docx", ".doc")):
                    content = process_file(
                        file_path, file_output_folder, collection_file_path
                    )
                elif filename.lower().endswith(".pdf"):
                    content = process_pdf(
                        file_path, file_output_folder, collection_file_path
                    )
                save_extracted_text(content, os.path.join(file_output_folder, "text"))
            except Exception as e:
                logger.error(f"An error occurred while processing {filename}: {e}")

    # Load document collection and chunk/index
    document_collection = load_document_collection(collection_file_path)
    chunk_and_index_documents(document_collection)

    # Save FAISS index and metadata
    # index_file_path = os.path.join(output_base_folder, "faiss_index.index")
    # save_faiss_index(index, index_file_path)
    metadata_file_path = os.path.join(output_base_folder, "metadata.json")
    save_metadata(metadata, metadata_file_path)


if __name__ == "__main__":
    main()
