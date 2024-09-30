import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from langchain.chains.summarize import load_summarize_chain

# Load environment variables
load_dotenv()

# Initialize the ChatOpenAI model
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    timeout=None,
    max_retries=2,
    max_tokens=1024,
    api_key=os.environ["OPENAI_API_KEY"],
)

# Define prompt templates
map_prompt_template = """
    Write a detailed and elaborated summary of the following text that includes the main points and any important details.
    Aim for a summary length of approximately 500 words.
    {text}
"""
map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])

combine_prompt_template = """
    Write a comprehensive summary of the following text delimited by triple backquotes.
    Aim for a summary length of approximately 250 words without missing important information from the text.
    ```{text}```
    COMPREHENSIVE SUMMARY:
"""
combine_prompt = PromptTemplate(template=combine_prompt_template, input_variables=["text"])

# Load the summarization chain
summary_chain = load_summarize_chain(
    llm,
    chain_type="map_reduce",
    map_prompt=map_prompt,
    combine_prompt=combine_prompt,
)

def create_summary(batch_summary):
    """
    Create a comprehensive summary of the batch summary text.

    Args:
        batch_summary (dict): Dictionary containing multiple text parts to summarize.

    Returns:
        str: The comprehensive summary, or None if an error occurs.
    """
    try:
        # Combine the values of the batch summary into a single string
        accumulated_value = " ".join(batch_summary.values())
        
        # Create a Document object with the accumulated content
        doc = Document(page_content=accumulated_value)
        
        # Invoke the summarization chain on the document
        summary_result = summary_chain.invoke([doc])
        
        # Return the summary text
        return summary_result["output_text"]
    except Exception as e:
        # Handle any exceptions and return None if something goes wrong
        raise RuntimeError(f"Failed to create summary: {e}")
