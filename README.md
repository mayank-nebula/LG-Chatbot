import os
import logging

from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain_openai import AzureChatOpenAI
from langchain.docstore.document import Document
from langchain.chains.summarize import load_summarize_chain

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    max_retries=20,
)

map_prompt_template = """
                      Write a detailed and elaborated summary of the following text that includes the main points and any important details.
                      Aim for a summary length of approximately 1500 words
                      {text}
                      """

map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])


combine_prompt_template = """
                      Write a comprehensive summary of the following text delimited by triple backquotes.
                      Aim for a summary length of approximately 800 words with out missing the important information the text.
                      ```{text}```
                      COMPREHENSIVE SUMMARY:
                      """

combine_prompt = PromptTemplate(
    template=combine_prompt_template, input_variables=["text"]
)


summary_chain = load_summarize_chain(
    llm_gpt,
    chain_type="map_reduce",
    map_prompt=map_prompt,
    combine_prompt=combine_prompt,
)


def create_summary(batch_summary):
    try:
        accumulated_value = " ".join(batch_summary.values())
        doc = Document(page_content=accumulated_value)
        summary_result = summary_chain.invoke([doc])

        return summary_result
    except Exception as e:
        logging.error("Failed to create summary. {e}")
