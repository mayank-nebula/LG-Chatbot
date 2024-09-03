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
