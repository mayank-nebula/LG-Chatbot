/home/Mayank.Sharma/anaconda3/envs/EmailAssistant/lib/python3.11/site-packages/langchain_core/_api/deprecation.py:139: LangChainDeprecationWarning: The class `LLMChain` was deprecated in LangChain 0.1.17 and will be removed in 0.3.0. Use RunnableSequence, e.g., `prompt | llm` instead.
  warn_deprecated(


import os
from dotenv import load_dotenv

# from logs.logger_config import get_logger
from langchain.chains.llm import LLMChain
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from langchain.chains.combine_documents.stuff import StuffDocumentsChain

load_dotenv()
# logger = get_logger(__name__)


llm = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
)

prompt_template = """
    Write a comprehensive summary of the following text delimited by triple backquotes.
    Aim for a summary length of approximately 250 words without missing important information from the text.
    ```{text}```
    COMPREHENSIVE SUMMARY:
"""

prompt = PromptTemplate.from_template(prompt_template)

llm_chain = LLMChain(llm=llm, prompt=prompt)
stuff_chain = StuffDocumentsChain(llm_chain=llm_chain, document_variable_name="text")


def create_summary(batch_summary):
    try:
        # accumulated_value = " ".join(batch_summary.values())
        doc = Document(page_content=batch_summary)
        summary_result = stuff_chain.invoke([doc])
        return summary_result["output_text"]
    except Exception as e:
        # logger.error(f"Failed to create summary. {str(e)}")
        return None


if __name__ == "__main__":
    print(
        create_summary(
            "A large language modelis a type of artificial intelligence algorithm that applies neural network techniques with lots of parameters to process and understand human languages or text using self-supervised learning techniques."
        )
    )
