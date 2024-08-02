import os
import json
import chromadb
from dotenv import load_dotenv
from chromadb.config import Settings
from langchain_community.vectorstores import Chroma
from langchain.schema import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_history_aware_retriever, create_retrieval_chain

load_dotenv()

settings = Settings(anonymized_telemetry=False)
current_dir = os.getcwd()

chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

with open("config.json", "r") as confile_file:
    config = json.load(confile_file)
base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava_llama3 = config["ollama"]["models"]["llava-llama3-fp16"]
llama3_1 = config["ollama"]["models"]["llama3.1-8B"]

embeddings_ollama = OllamaEmbeddings(base_url=base_url, model=nomic)
embeddings_gpt = AzureOpenAIEmbeddings(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment="text-embedding-3-large-1",
)

vectorstore_ollama = Chroma(
    collection_name="GV_Test_OCR_50_ollama_summary",
    client=chroma_client,
    embedding_function=embeddings_ollama,
)
vectorstore_gpt = Chroma(
    collection_name="GV_Test_OCR_50_GPT_summary",
    client=chroma_client,
    embedding_function=embeddings_gpt,
)

retriever_ollama = vectorstore_ollama.as_retriever()
retriever_gpt = vectorstore_gpt.as_retriever()

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
    max_retries=20,
)
llm_ollama = ChatOllama(model=llama3_1, base_url=base_url, temperature=0)


def format_chat_history(chatHistory):
    chat_history = []
    for chat in chatHistory:
        chat_history.append(HumanMessage(content=chat["user"]))
        chat_history.append(AIMessage(content=chat["user"]))


def summary_rag_chain(llm):
    llm_to_use = llm_gpt if llm == "GPT" else llm_ollama
    retriever_to_use = retriever_gpt if llm == "GPT" else retriever_ollama

    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. Give very comprehensive answer, giving your best output"
        "\n\n"
        "{context}"
    )

    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    chain = create_stuff_documents_chain(llm=llm_to_use, prompt=qa_prompt)

    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
    )

    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    history_aware_retriever = create_history_aware_retriever(
        llm_to_use, retriever_to_use, contextualize_q_prompt
    )

    rag_chain = create_retrieval_chain(history_aware_retriever, chain)

    return rag_chain


def process_chat(question, chat_history, llm):
    chain = summary_rag_chain(llm)
    response = chain.invoke({"chat_history": chat_history, "input": question})
    return response["answer"]
