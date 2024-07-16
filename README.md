from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

def question_generation(context):
    prompt_text = f"""
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

    Please proceed to generate 20 questions in JSON format with keys Sl_no, Question, Question_Type.
    You need to provide 20 questions
    """

    llm = ChatOllama(model = "llama3-gradient:latest", base_url="http://10.0.0.4:11434", temperature=0, num_ctx=64000, format="json")
    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = prompt | llm | StrOutputParser()
    question = chain.invoke({"element": context})
    return question
