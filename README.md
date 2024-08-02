import os
import json
from dotenv import load_dotenv
from langchain.tools import Tool
from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain_openai import AzureChatOpenAI
from langchain.agents import (
    AgentExecutor,
    create_react_agent,
)
from langchain_core.output_parsers import StrOutputParser
from summary_retriver import process_chat
from processing_multi_vector_retriever import process_question
from flask import Flask, request, jsonify

load_dotenv()

app = Flask(__name__)

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
    Give me the answer in markdown with well-defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.
    Conversation history:
    {chat_history}
    User Question:
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
    chat_history,
    llm,
    stores,
):
    try:
        return process_chat(query, chat_history, llm, stores)
    except Exception as e:
        raise ValueError(f"Error processing summary rag tool results: {e}")


def gpt3_5_tool_func(query, chat_history):
    return call_gpt3_5(query, chat_history)


def summary_rag_tool_func(query, chat_history, llm, stores):
    return summary_rag_api(query, chat_history, llm, stores)


def normal_rag_tool_func(query, chat_history, permissions, filters, stores, image, llm, chat_id, reason):
    return normal_rag_api(query, chat_history, permissions, filters, stores, image, llm, chat_id, reason)


GPT3_5Tool = Tool(
    func=gpt3_5_tool_func,
    name="GPT3_5Tool",
    description="Use ONLY when: The user EXPLICITLY requests external knowledge using indicators like '@GK', 'use general knowledge, 'search from external sources', etc.",
)

summary_RAGTool = Tool(
    func=summary_rag_tool_func,
    name="summary_RAGTool",
    description="Use this tool for questions about overall content, main ideas, or summaries of entire documents within the internal knowledge base.",
)

normal_RAGTool = Tool(
    func=normal_rag_tool_func,
    name="normal_RAGTool",
    description="Primary tool for answering questions using the internal knowledge base. Use this tool for all the queries that don't specifically request external information.",
)


tools = [normal_RAGTool, summary_RAGTool, GPT3_5Tool]

instructions = """
AI Assistant Instructions

Role and Primary Task:
You are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and utilize the correct tool to generate informative and relevant responses. Your default source of information is the internal knowledge base.

General Behavior:
1. Respond to greetings warmly.
2. If asked about your identity or capabilities, explain that you're a RAG (Retrieval-Augmented Generation) chatbot with access to an internal knowledge base.
3. Classify user input query intent into one of these categories: greeting/salutation, normal_rag, summary_rag, or external/general knowledge.

Available Tools and Their Usage:

1. normal_RAGTool (DEFAULT TOOL):
   - Purpose: Answering most questions using the internal knowledge base.
   - Use when: The query can be answered using internal information, which covers a wide range of topics including company data, reports, policies, product information, etc.
   - This should be your go-to tool for most queries.

2. summary_RAGTool:
   - Purpose: Addressing questions about overall content, main ideas, or summaries of entire documents from the internal knowledge base.
   - Use when: The query specifically requires a broad understanding or overview of a document's content.
   - Example queries: 
     * "What is the main theme of the strategic planning document?"
     * "Summarize the key points of this document."

3. GPT3_5Tool (USE WITH CAUTION):
   - Purpose: Answering questions that EXPLICITLY request external knowledge.
   - Use ONLY when: The user EXPLICITLY requests external knowledge using indicators like "@GK", "use general knowledge", "search from external sources", etc.
   - Example queries:
     * "What is the capital of France? @GK"
     * "Who is the current CEO of Google? Use general knowledge."
   - DO NOT use this tool unless explicitly requested by the user.

4. Direct Response (No tool use):
   - Purpose: Handling greetings, casual conversation, or very simple queries.
   - Use when: The user input is a greeting, expression of gratitude, or a very simple question that doesn't require accessing any knowledge base.
   - Example queries:
     * "Hello!"
     * "How are you?"
     * "Thank you for your help."

Decision-Making and Response Protocol:
1. Always default to using the normal_RAGTool unless the query clearly falls into another category.
2. Use the summary_RAGTool only when explicitly asked for document summaries or overviews.
3. Use the GPT3_5Tool ONLY when the user explicitly requests external knowledge with clear indicators.
4. Provide the exact same query as the action input to any tool you pick.
5. Respond directly without using any tool for greetings, salutations, and casual conversation.
6. Use each tool no more than twice per input query to avoid loops.
7. If the initial response is unsatisfactory, try the normal_RAGTool if you haven't already, before considering other tools.
8. For any tool responses:
   - Synthesize, process, or extract information from the tool's response to provide the final answer.
   - Do not simply relay raw data or links to the user.

Remember: Your primary source of information is the internal knowledge base accessed through the normal_RAGTool. Always prioritize this over external sources unless explicitly instructed otherwise by the user.
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

prompt = base_prompt.partial(instructions=instructions, tools=tools)

agent = create_react_agent(llm_gpt, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=6,
)


def process_agent(
    agent_executor,
    user_input,
    chat_history,
    chat_id,
    filters,
    stores,
    image,
    llm,
    reason,
    permissions,
):
    response = agent_executor.invoke(
        {
            "input": user_input,
            "chat_history": chat_history,
            "permissions": permissions,
            "filters": filters,
            "stores": stores,
            "image": image,
            "llm": llm,
            "chat_id": chat_id,
            "reason": reason,
        }
    )
    return response["output"]


@app.route("/process", methods=["POST"])
def process():
    data = request.json
    user_input = data.get("question")
    chat_history = data.get("chat_history", [])
    chat_id = data.get("chat_id", "")
    filters = data.get("filters", [])
    stores = data.get("stores", "GPT")
    image = data.get("image", "No")
    llm = data.get("llm", "GPT")
    reason = data.get("reason", "")
    permissions = [
        "HLSConfidential",
        "ADConfidential",
        "USHCConfidential",
        "EGHConfidential",
    ]

    response = process_agent(
        agent_executor,
        user_input,
        chat_history,
        chat_id,
        filters,
        stores,
        image,
        llm,
        reason,
        permissions,
    )

    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
