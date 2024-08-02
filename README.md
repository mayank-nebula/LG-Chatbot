import os
import json
from dotenv import load_dotenv
from langchain.tools import Tool
from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate
from langchain_openai import AzureChatOpenAI
from langchain.agents import (
    AgentExecutor,
    create_react_agent,
)
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate
from summary_retriver import process_chat
from processing_multi_vector_retriever import process_question

load_dotenv()


with open("config.json", "r") as confile_file:
    config = json.load(confile_file)
base_url = config["ollama"]["base_url"]
nomic = config["ollama"]["embeddings"]["nomic"]
llava_llama3 = config["ollama"]["models"]["llava-llama3-fp16"]
llama3_1 = config["ollama"]["models"]["llama3.1-8B"]

llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
    max_retries=20,
)
llm_ollama = ChatOllama(model=llama3_1, base_url=base_url, temperature=0)


def format_chat_history(chatHistory):
    return "\n".join(
        [f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chatHistory]
    )


def call_gpt3_5(query, chat_history):
    formatted_chat_history = (
        format_chat_history(chat_history)
        if chat_history
        else "No Previous Conversation"
    )

    prompt_text = """
                Please answer the following question based on the given conversation history. \
                Use your own knowledge to answer the question. \
                Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {
            "chat_history": lambda _: formatted_chat_history,
            "question": lambda x: x,
        }
        | prompt
        | llm_gpt
        | StrOutputParser()
    )

    return chain.invoke(query)


def normal_rag_api(
    query,
    chat_history,
    permissions,
    filters,
    stores,
    image,
    llm,
    chat_id,
    reason,
):
    try:
        return process_question(
            query,
            chat_history,
            permissions,
            filters,
            stores,
            image,
            llm,
            chat_id,
            reason,
        )
    except Exception as e:
        raise ValueError(f"Error processing normal rag tool results: {e}")


def summary_rag_api(
    query,
    stores,
    llm,
):
    try:
        return process_chat(query, chat_history, llm, stores)
    except Exception as e:
        raise ValueError(f"Error processing summary rag tool results: {e}")


normal_RAGTool = Tool(
    func=lambda query: normal_rag_api(
        query,
        chat_history,
        permissions,
        filters,
        stores,
        image,
        llm,
        chat_id,
        reason,
    ),
    name="normal_RAGTool",
    description="Use this normal_RAGTool for answering questions.",
)

summary_RAGTool = Tool(
    func=lambda query: summary_rag_api(
        query,
        stores,
        llm,
    ),
    name="summary_RAGTool",
    description="Use this summary_RAGTool for addressing questions about the overall content, main ideas, or summary of an entire document.",
)

GPT3_5Tool = Tool(
    func=lambda query: call_gpt3_5(query, chat_history),
    name="GPT3_5Tool",
    description="Use this GPT3_5Tool when explicitly requested by the user with '@GK / use external knowledge'. otherwise dont use it",
)

tools = [normal_RAGTool, summary_RAGTool, GPT3_5Tool]

instructions = """ You are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and utilize the correct tool to generate informative and relevant responses.
Respond to greetings warmly. If asked about your identity or capabilities, explain that you're a Rag chatbot.
Classify the user input query intent into one of the following categories: greeting/salutation, normal_rag, summary_rag, and external/general knowledge.
Based on the intent of user query you should route the query to the appropriate tool among normal_RAGTool, summary_RAGTool, GPT3_5Tool

1. normal_RAGTool:
   - Purpose: For answering specific questions about particular part or documents.
   - Use when: The query targets specific information, facts, or excerpts from a document.
   - Example queries: " "

2. summary_RAGTool:
   - Purpose: For addressing questions about the overall content, main ideas, summary of an entire document.
   - Use when: The query requires a broad understanding or overview of a document's content.
   - Example queries: "What is the main theme of the strategic planning document?", "Summarize the key points of this document."

3. GPT3_5Tool:
   - Purpose: For answering questiosn but when explicitly requests external knowledge (e.g., using "@GK", "use general knowledge", "search from external sources", etc.)
   - Use when: Only if user explicitly requests external knowledge (e.g., using "@GK", "use general knowledge", "search from external sources", etc.)
   - Example queries: "What is the capital of France? @GK", "Who is the CEO of Google?."

4. Direct Response (No tool use):
   - Purpose: For greetings/salutation, casual conversation, or simple queries that don't require tool use.
   - Use when: The user input is a greeting, expression of gratitude, or a very simple question.
   - Example queries: "Hello!", "How are you?", "Thank you for your help."
   
   
Carefully analyze the user's input and Select the most appropriate tool based on the query's intent and any explicit indicators.
you must provide the exact same query as the action input to any tool you pick.
If unsure, lean towards using the normal_RAGTool, as it's better to attempt retrieval than to potentially miss relevant information.
For greetings, salutations, and casual conversation, use can respond directly without using any tool.
you must only use each tool up to two times per input query. Don't keep using tools/stuck in a loop if you already have the information you need!
If the response is not satisfactory, try a different tool. Don't use the same tool twice in a row.
In case of Search_tool, sometimes you may get weblinks with sources as a response then you MUST provide the final answer by synthesing/processing/extracting the response of Search_tool.
"""

template = """

        {instructions}

        Answer the following questions as best you can. You have access to the following tools:

        {tools}

        To use a tool, please use the following format:

        Thought: Do I need to use a tool? Yes
        Action: the action to take, should be one of [{tool_names}]
        Action Input: the input to the action
        Observation: the result of the action

        When you have a response to say to the Human, or if you do not need to use a tool, you MUST use the format:

        Thought: Do I need to use a tool? No
        Final Answer: [your response here]
        
        Begin!

        Previous conversation history: {chat_history}

        New input: {input}
        Thought:{agent_scratchpad}
        """

base_prompt = PromptTemplate.from_template(template)


prompt = base_prompt.partial(instructions=instructions)


agent = create_react_agent(llm_gpt, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=1,
)


def process_agent(
    agent_executor,
    user_input,
    chat_history,
):
    response = agent_executor.invoke(
        {
            "input": user_input,
            "chat_history": (chat_history if chat_history else []),
        }
    )
    return response["output"]


if __name__ == "__main__":
    user_input = input()
    chat_history = []
    chat_id = ""
    filters = []
    stores = "GPT"
    image = "No"
    llm = "GPT"
    userEmailId = ""
    regenerate = "No"
    feedbackRegenerate = "No"
    reason = ""
    permissions = [
        "HLSConfidential",
        "ADConfidential",
        "USHCConfidential",
        "EGHConfidential",
    ]
    print(
        process_agent(
            agent_executor,
            user_input,
            chat_history,
        )
    )
