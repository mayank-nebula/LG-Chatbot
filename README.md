import json
import os
import extract_msg
import chromadb
from dotenv import load_dotenv
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

settings = Settings(anonymized_telemetry=False)

load_dotenv()

CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)


llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)


def load_prompts():
    """
    Load prompts from a JSON file.
    """
    with open("prompts.json", "r") as file:
        return json.load(file)


async def email_ingestion(file_path: str, metadata: dict):
    try:
        prompts = load_prompts()

        email_metadata = extract_msg.Message(file_path)
        email_body = email_metadata.body

        prompt = ChatPromptTemplate.from_template(prompts["email_summary"])
        chain = {"email_body": lambda x: x} | prompt | llm_gpt
        email_body_summary = chain.invoke(email_body)

        email_body_summary_content = email_body_summary.content

        embeddings = AzureOpenAIEmbeddings(
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING"],
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

        email_body_summaryRetriever = [
            Document(
                page_content=f"Summary of email {metadata['filename']} - {email_body_summary_content}",
                metadata=metadata,
            )
        ]

        email_body_retriver = [
            Document(
                page_content=f"Full email conversation {metadata['filename']} - {email_body}",
                metadata=metadata,
            )
        ]

        vectorstore.add_documents(email_body_retriver)
        vectorstore_summary.add_documents(email_body_summaryRetriever)

        return True, None
    except Exception as e:
        return False, str(e)
