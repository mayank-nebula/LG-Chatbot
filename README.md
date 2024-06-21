import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
import json

# Configure ChromaDB settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file
load_dotenv()

# Load configuration from a JSON file
with open('config.json', 'r') as confile_file:
    config = json.load(confile_file)

# Extract base URL and model names from the configuration
base_url = config['ollama']['base_url']
nomic = config['ollama']['embeddings']['nomic']
llama3 = config['ollama']['models']['llama3-8B']

# Initialize ChromaDB client
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

# Initialize embeddings using the Ollama embeddings model
embeddings = OllamaEmbeddings(base_url=base_url, model=nomic)

# Initialize the vector store using ChromaDB and the embeddings function
vectorstore = Chroma(
    collection_name="GV_Test_MV", client=chroma_client, embedding_function=embeddings
)

def convert_chat_history(chat_history):
    """
    Convert chat history into a list of HumanMessage and AIMessage objects.
    
    Parameters:
    - chat_history (list): List of dictionaries containing user and AI messages.

    Returns:
    - converted_chat_history (list): List of HumanMessage and AIMessage objects.
    """
    converted_chat_history = []
    for chat in chat_history:
        question = chat["user"]
        answer = chat["ai"]
        converted_chat_history.extend(
            [HumanMessage(content=question), AIMessage(content=answer)]
        )
    return converted_chat_history

def process_question(question, chatHistory):
    """
    Process a user question and return an answer based on the chat history and relevant information.

    Parameters:
    - question (str): The user's question.
    - chatHistory (list): The chat history containing previous user and AI messages.

    Returns:
    - response["answer"] (str): The answer to the user's question.
    """
    # Convert the chat history into the appropriate format
    converted_chat_history = convert_chat_history(chatHistory)
    
    # Initialize a retriever from the vector store
    retriever = vectorstore.as_retriever()

    # Initialize the chat model with specific parameters
    model = ChatOllama(model=llama3, base_url=base_url, temperature=0)

    # Define the system prompt for contextualizing questions
    contextualize_q_system_prompt = """Given a chat history and the latest user question \
    which might reference context in the chat history, formulate a standalone question \
    which can be understood without the chat history. Do NOT answer the question, \
    just reformulate it if needed and otherwise return it as is."""
    
    # Create the prompt template for contextualizing questions
    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    
    # Create a history-aware retriever
    history_aware_retriever = create_history_aware_retriever(
        model, retriever, contextualize_q_prompt
    )

    # Define the system prompt for answering questions
    qa_system_prompt = """You are a highly capable question answering assistant backed by relevant information retriened from a large corpus \
    Provide clear, concise answer to questions based solely on the provided context passages. \
    If there is not enough information in the context to answer simply say "I don't have enought information to say" or related to these lines. \
    Do not refer to how the context was retrieved or stored. Focus on giving the best possible answer using only the given context within the specified length.\
    Just give the answer directly without referring to the word context.

    {context}"""
    
    # Create the prompt template for answering questions
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    # Create a question-answering chain
    question_answer_chain = create_stuff_documents_chain(model, qa_prompt)
    
    # Create a retrieval-augmented generation (RAG) chain
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    # Get the response from the RAG chain
    response = rag_chain.invoke(
        {"input": question, "chat_history": converted_chat_history}
    )
    
    # Return the answer from the response
    return response["answer"]
