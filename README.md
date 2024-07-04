import os 
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import ChatOllama
import base64
import os
from langchain_core.messages import HumanMessage
import pickle
import chromadb
from chromadb.config import Settings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import InMemoryStore
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_community.embeddings import OllamaEmbeddings
import io
import re
from IPython.display import HTML, display
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from PIL import Image
from langchain_openai import AzureChatOpenAI


settings = Settings(anonymized_telemetry=False)
CHROMA_CLIENT = chromadb.HttpClient(host="localhost", port=8000, settings=settings)


os.environ["AZURE_OPENAI_API_KEY"] = "1f6a8e246c994010831185febfe6b079"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://hls-scientia-openai-dev-eus.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-02-01"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o-2024-05-13"


llm = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
)


def plt_img_base64(img_base64):
    """Disply base64 encoded string as image"""
    # Create an HTML img tag with the base64 string as the source
    image_html = f'<img src="data:image/jpeg;base64,{img_base64}" />'
    # Display the image by rendering the HTML
    display(HTML(image_html))


def looks_like_base64(sb):
    """Check if the string looks like base64"""
    return re.match("^[A-Za-z0-9+/]+[=]{0,2}$", sb) is not None


def is_image_data(b64data):
    """
    Check if the base64 data is an image by looking at the start of the data
    """
    image_signatures = {
        b"\xff\xd8\xff": "jpg",
        b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "png",
        b"\x47\x49\x46\x38": "gif",
        b"\x52\x49\x46\x46": "webp",
    }
    try:
        header = base64.b64decode(b64data)[:8]  # Decode and get the first 8 bytes
        for sig, format in image_signatures.items():
            if header.startswith(sig):
                return True
        return False
    except Exception:
        return False


def resize_base64_image(base64_string, size=(128, 128)):
    """
    Resize an image encoded as a Base64 string
    """
    # Decode the Base64 string
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))

    # Resize the image
    resized_img = img.resize(size, Image.LANCZOS)

    # Save the resized image to a bytes buffer
    buffered = io.BytesIO()
    resized_img.save(buffered, format=img.format)

    # Encode the resized image to Base64
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def split_image_text_types(docs):
    """
    Split base64-encoded images and texts
    """
    b64_images = []
    texts = []
    for doc in docs:
        # Check if the document is of type Document and extract page_content if so
        if isinstance(doc, Document):
            doc = doc.page_content
        if looks_like_base64(doc) and is_image_data(doc):
            doc = resize_base64_image(doc, size=(1300, 600))
            b64_images.append(doc)
        else:
            texts.append(doc)
    return {"images": b64_images, "texts": texts}


def img_prompt_func(data_dict):
    """
    Join the context into a single string
    """
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    messages = []

    # Adding image(s) to the messages if present
    if data_dict["context"]["images"]:
        for image in data_dict["context"]["images"]:
            image_message = {
                "type": "image_url",
                # "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                "image_url": image
            }
            messages.append(image_message)

    # Adding the text for analysis
    text_message = {
        "type": "text",
        "text": (
            "You are an intelligent chatbot that has the ability to provide the perfect answer to user provided question based on the context given and the previous chat history.\n"
            "You will be given a mixed of text, tables, images (photographs, graphs, charts), and metadata."
            "All the above text, tables, images, and metadata will be retrieved from a vectorstore based on user-input keywords."
            "Please use your extensive knowledge and analytical skills to provide an answer to the question without mentioning about the database and do not mention about image just give response in plain text:\n"
            f"User-provided question: {data_dict['question']}\n\n"
            "Text and / or tables:\n"
            f"{formatted_texts}"
        ),
    }
    messages.append(text_message)
    return [HumanMessage(content=messages)]


def multi_modal_rag_chain(retriever):
    """
    Multi-modal RAG chain
    """

    # Multi-modal LLM
    model = ChatOllama(temperature=0, model="llava-llama3:8b-v1.1-fp16", base_url='http://10.0.0.4:11434')

    # RAG pipeline
    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | model
        | StrOutputParser()
    )

    return chain


embeddings = OllamaEmbeddings(base_url = 'http://10.0.0.4:11434', model='nomic-embed-text:latest')

# The vectorstore to use to index the summaries
vectorstore = Chroma(
    collection_name="GV_Test_MV_1",client= CHROMA_CLIENT, embedding_function=embeddings
)

docstore_path = os.path.join(os.getcwd(), "merged_docstore.pkl")

with open(docstore_path, "rb") as f:
    loaded_docstore = pickle.load(f)

retriever = MultiVectorRetriever(
    vectorstore=vectorstore, docstore=loaded_docstore, id_key="GV_Test_MV_1", search_kwargs = {"filter" : {"Title" : "0623OZ-ARC Evaluation_ARC WA blue book 2019-2021_Strategy document_11092018"}}
)
# Create RAG chain
chain_multimodal_rag = multi_modal_rag_chain(retriever)


question_list = ["What is the purpose of the ARC West Africa's blue book (2019-2021) and who launched it?"]
# "Give me the executive summary of Pentavalent market analysis", "What was geographic area growth in 2011?", "What are the required documents to set up an NGO in Senegal?", "Which three countries will ARC WA have a strong presence in for all five areas of intervention?", "What are the key characteristics of the ARC's approach according to the initial bluebook of the ARC (2015)?"]

for question in question_list:
    print(f"Question - {question}")
    print()
    print(f"Answer - {chain_multimodal_rag.invoke(question)}")
    print()
    # print(f"Documents - {retriever.invoke(question)}")
    docs = retriever.invoke(question)
    for doc in docs:
        plt_img_base64(doc.page_content)
