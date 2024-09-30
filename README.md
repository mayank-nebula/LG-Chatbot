import os
import logging

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from langchain.chains.summarize import load_summarize_chain


load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    timeout=None,
    max_retries=2,
    max_tokens=1024,
    api_key=os.environ["OPENAI_API_KEY"],
)


map_prompt_template = """
                      Write a detailed and elaborated summary of the following text that includes the main points and any important details.
                      Aim for a summary length of approximately 500 words
                      {text}
                      """

map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])


combine_prompt_template = """
                      Write a comprehensive summary of the following text delimited by triple backquotes.
                      Aim for a summary length of approximately 250 words with out missing the important information the text.
                      ```{text}```
                      COMPREHENSIVE SUMMARY:
                      """

combine_prompt = PromptTemplate(
    template=combine_prompt_template, input_variables=["text"]
)


summary_chain = load_summarize_chain(
    llm,
    chain_type="map_reduce",
    map_prompt=map_prompt,
    combine_prompt=combine_prompt,
)


def create_summary(batch_summary):
    try:
        accumulated_value = " ".join(batch_summary.values())
        doc = Document(page_content=accumulated_value)
        summary_result = summary_chain.invoke([doc])
        logging.info("Summary created successfully.")
        return summary_result["output_text"]
    except Exception as e:
        logging.error(f"Failed to create summary. {e}")
        return None
