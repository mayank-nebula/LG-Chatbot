import base64
from IPython.display import HTML, display
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from PIL import Image
from langchain.llms import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import StrOutputParser
from langchain.schema import HumanMessage
from langchain.document_loaders import Document

def plt_img_base64(img_base64):
    """Display base64 encoded string as image"""
    image_html = f'<img src="data:image/jpeg;base64,{img_base64}" />'
    display(HTML(image_html))

def looks_like_base64(sb):
    """Check if the string looks like base64"""
    return re.match("^[A-Za-z0-9+/]+[=]{0,2}$", sb) is not None

def is_image_data(b64data):
    """Check if the base64 data is an image by looking at the start of the data"""
    image_signatures = {
        b"\xff\xd8\xff": "jpg",
        b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "png",
        b"\x47\x49\x46\x38": "gif",
        b"\x52\x49\x46\x46": "webp",
    }
    try:
        header = base64.b64decode(b64data)[:8]
        for sig, format in image_signatures.items():
            if header.startswith(sig):
                return True
        return False
    except Exception:
        return False

def resize_base64_image(base64_string, size=(128, 128)):
    """Resize an image encoded as a Base64 string"""
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    resized_img = img.resize(size, Image.LANCZOS)
    buffered = io.BytesIO()
    resized_img.save(buffered, format=img.format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def split_image_text_types(docs):
    """Split base64-encoded images and texts"""
    b64_images = []
    texts = []
    for doc in docs:
        if isinstance(doc, Document):
            doc = doc.page_content
        if looks_like_base64(doc) and is_image_data(doc):
            doc = resize_base64_image(doc, size=(1300, 600))
            b64_images.append(doc)
        else:
            texts.append(doc)
    return {"images": b64_images, "texts": texts}

def img_prompt_func(data_dict, chat_history):
    """Join the context into a single string and include chat history"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    messages = []

    # Adding chat history to the messages
    for msg in chat_history:
        messages.append(HumanMessage(content=msg["content"], additional_kwargs={"role": msg["role"]}))

    # Adding image(s) to the messages if present
    if data_dict["context"]["images"]:
        for image in data_dict["context"]["images"]:
            image_message = {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image}"},
            }
            messages.append(image_message)

    # Adding the text for analysis
    text_message = {
        "type": "text",
        "text": (
            "You are a financial analyst tasked with providing investment advice.\n"
            "You will be given a mix of text, tables, and image(s) usually of charts or graphs.\n"
            "Use this information to provide investment advice related to the user question. \n"
            f"User-provided question: {data_dict['question']}\n\n"
            "Text and / or tables:\n"
            f"{formatted_texts}"
        ),
    }
    messages.append(text_message)
    return messages

def multi_modal_rag_chain_with_history(retriever, chat_history):
    """Multi-modal RAG chain with chat history"""

    model = ChatOpenAI(temperature=0, model="gpt-4-vision-preview", max_tokens=1024)

    chain = (
        {
            "context": retriever | RunnableLambda(split_image_text_types),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(lambda data_dict: img_prompt_func(data_dict, chat_history))
        | model
        | StrOutputParser()
    )

    return chain

# Initialize chat history
chat_history = []

# Create RAG chain with chat history
chain_multimodal_rag = multi_modal_rag_chain_with_history(retriever_multi_vector_img, chat_history)

# Example function to update chat history after each interaction
def update_chat_history(user_input, model_response):
    chat_history.append({"role": "user", "content": user_input})
    chat_history.append({"role": "assistant", "content": model_response})
