import os
import json
import logging
import mailparser
import extract_msg
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from utils.chromadb_utils import initialize_chroma_client
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings


load_dotenv()

CHROMA_CLIENT = initialize_chroma_client()

PROMPTS_JSON_FILE = "json/prompts.json"

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
    with open(PROMPTS_JSON_FILE, "r") as file:
        return json.load(file)


async def email_ingestion(file_path: str, metadata: dict, id: str):
    try:
        prompts = load_prompts()
        metadata.update({"attachment": "No", "id": id})

        if os.path.splitext(file_path)[1] == ".msg":
            email_metadata = extract_msg.Message(file_path)
            email_body = email_metadata.body
        else:
            parsed_email = mailparser.parse_from_file(file_path)
            email_body = parsed_email.text_plain[0]

        if email_body:
            prompt = ChatPromptTemplate.from_template(prompts["email_summary"])
            chain = {"email_body": lambda x: x} | prompt | llm_gpt
            email_body_summary = chain.invoke(email_body)
            email_body_summary_content = email_body_summary.content

            embeddings = AzureOpenAIEmbeddings(
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ[
                    "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING"
                ],
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

            email_body_retriever = [
                Document(
                    page_content=f"Full email conversation {metadata['filename']} - {email_body}",
                    metadata=metadata,
                )
            ]

            vectorstore.add_documents(email_body_retriever)
            vectorstore_summary.add_documents(email_body_summaryRetriever)

        return True, None
    except Exception as e:
        logging.error(f"Failed to ingest email: {str(e)}")
        return False, (e)
