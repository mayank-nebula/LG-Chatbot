import os
import json
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()


def read_json_file(file_path):
    with open(file_path, "r") as file:
        data = json.load(file)
    return data


llm_gpt = AzureChatOpenAI(
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    max_retries=20,
)


def question_generation():
    prompt_text = """
    Instructions:
    1. Assume the persona of a knowledgeable and experienced educator who specializes in generating comprehensive and insightful questions based on provided content.
    2. Read the provided context carefully.
    3. Generate 20 questions based on the context. The questions should cover a range of complexities and types, including but not limited to factual, analytical, summary, explanation, comparison, contrast, application, inference, evaluation, and synthesis.
    4. Ensure that each question is self-explanatory and does not require referring back to the context or any external documents.
    5. The questions can be based on specific parts of the context or across multiple parts of the context or the entire context.

    Context:
    {element}
    Generate the following types of questions:
    1. Factual Questions: Ask about specific details or facts mentioned in the context.
    2. Analytical Questions: Require analyzing information from the context to derive insights or conclusions.
    3. Summary Questions: Require summarizing sections or the entire context.
    4. Explanation Questions: Ask for explanations of concepts, ideas, or processes described in the context.
    5. Comparison Questions: Require comparing elements within the context.
    6. Contrast Questions: Require highlighting differences between elements within the context.
    7. Application Questions: Ask how information from the context can be applied to real-world situations or problems.
    8. Inference Questions: Require drawing inferences or conclusions based on the context.
    9. Evaluation Questions: Require evaluating information or arguments presented in the context.
    10. Synthesis Questions: Require combining elements from the context to form a new idea or perspective.

    Please proceed to generate 10 questions in JSON format with keys Sl_no, Question, Question_Type.
    """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = prompt | llm_gpt | JsonOutputParser()
    return chain


if __name__ == "__main__":
    data = read_json_file("filtered_data.json")
    chain = question_generation()

    # Open the output file in append mode and start with an empty list
    with open("output_documents.json", "w") as output_file:
        json.dump([], output_file)

    for key, value in data.items():
        try:
            question_list = []
            page_content = value["page_content"]
            questions = chain.invoke({"element": page_content})
            for question in questions:
                question_list.append(question["Question"])

            document = {
                "documentName": value['metadata']['Title'],
                "questions": question_list
            }
        
        except Exception as e:
            # If an error occurs, store the document name and the reason
            document = {
                "documentName": value['metadata']['Title'],
                "reason": str(e)
            }

        # Open the file in read mode, load existing data, append new data, and write back to the file
        with open("output_documents.json", "r+") as output_file:
            existing_data = json.load(output_file)
            existing_data.append(document)
            output_file.seek(0)  # Go to the beginning of the file
            json.dump(existing_data, output_file, indent=4)

