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

# Initialize Chroma settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables
load_dotenv()

# Initialize Chroma client
CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)

# Initialize Azure OpenAI Chat GPT-4 (O)
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
        # Load prompts
        prompts = load_prompts()

        # Extract email body
        email_metadata = extract_msg.Message(file_path)
        email_body = email_metadata.body

        # Create prompt for summarization
        prompt = ChatPromptTemplate.from_template(prompts["email_summary"])
        chain = {"email_body": lambda x: x} | prompt | llm_gpt
        email_body_summary = chain.invoke(email_body)
        email_body_summary_content = email_body_summary.content

        # Initialize Azure OpenAI Embeddings
        embeddings = AzureOpenAIEmbeddings(
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING"],
        )

        # Initialize Chroma vector stores
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

        # Prepare documents for retrieval
        email_body_summaryRetriever = [
            Document(
                page_content=f"Summary of email {metadata['filename']} - {email_body_summary_content}",
                metadata=metadata,
            )
        ]

        email_body_retriever = [
            Document(
                page_content=f"Full email conversation {metadata['filename']} - {email_body}",
                metadata=metadata,
            )
        ]

        # Add documents to vector stores
        vectorstore.add_documents(email_body_retriever)
        vectorstore_summary.add_documents(email_body_summaryRetriever)

        return True, None
    except Exception as e:
        return False, str(e)
