import json
import os
from langchain.chains.summarize import load_summarize_chain
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
from langchain.docstore.document import Document
import logging

load_dotenv()


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def read_json_file(file_path):
    with open(file_path, "r") as file:
        data = [json.loads(line) for line in file]
    return data


def append_to_dict(dict, key, value, metadata):
    unique_key = f"{key}_{metadata['id']}"
    dict[unique_key] = {"page_content": value, "metadata": metadata}
    with open("final_summary.txt", "a") as f:
        f.write(json.dumps(dict) + "\n")


if __name__ == "__main__":
    data = read_json_file("summary_text_output.txt")

    llm_gpt = AzureChatOpenAI(
        azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
        openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
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

    try:
        for individual_data in data[:3]:
            logging.info(
                f"Generating Summary of file {individual_data[metadata]['id']}"
            )
            summarized_docs = {}
            summarized_docs_list = []
            title = individual_data["metadata"]["Title"]
            page_content = individual_data["page_content"]
            metadata = individual_data["metadata"]
            for individual_batch_key, individual_batch_value in page_content.items():
                doc = Document(page_content=individual_batch_value)
                summary_result = summary_chain.invoke([doc])
                summary = summary_result["output_text"]
                summarized_docs_list.append(summary)

            if len(summarized_docs_list) > 1:
                final_summary = " ".join(summarized_docs_list)
            else:
                final_summary = summarized_docs_list[0]

            append_to_dict(summarized_docs, title, final_summary, metadata)
    except Exception as e:
        logging.error(f"Failed to generate summary of the file {e}")
