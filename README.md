from typing import List
import os
import streamlit as st

import requests
from fastapi import FastAPI
from langchain_core.prompts import ChatPromptTemplate
# from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
# from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain.tools import Tool
from langchain_core.messages import HumanMessage, AIMessage

from langchain_community.document_loaders import WebBaseLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import OnlinePDFLoader
from langchain_core.prompts import PromptTemplate
from openai import OpenAI
from groq import Groq

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.tools.retriever import create_retriever_tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.utilities import ArxivAPIWrapper
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_community.utilities import SerpAPIWrapper
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain.chains import LLMMathChain, LLMChain
from langchain.chains.conversation.memory import ConversationBufferWindowMemory

from langchain import hub
from langchain.agents import AgentExecutor, create_tool_calling_agent, create_react_agent

from langchain.globals import set_verbose
set_verbose(True)

from dotenv import load_dotenv
load_dotenv()


os.environ["LANGCHAIN_TRACING_V2"]="true"
os.environ["LANGCHAIN_API_KEY"]=os.getenv("LANGCHAIN_API_KEY")

client_openAI = OpenAI()
client_groq = Groq()
# api_key = os.environ['OPENAI_API_KEY']
# llm = ChatAnthropic(model="claude-3-sonnet-20240229", temperature=0)
# llm_model = ChatOpenAI(api_key= api_key, model="gpt-3.5-turbo", temperature=0)
# llm = ChatOpenAI(api_key= api_key, model="gpt-4o", temperature=0)
# llm_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", apiKey=os.getenv("GOOGLE_API_KEY"),temperature=0)
# model="llama3-8b-8192"
# llm_model = ChatGroq(temperature=0, groq_api_key = os.getenv('GROQ_API_KEY'), model_name=model)
llm_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", apiKey=os.getenv("GOOGLE_API_KEY"),temperature=0)

serpapi = SerpAPIWrapper(serpapi_api_key = os.getenv('SERPAPI_API_KEY'))
tavily_search = TavilySearchResults()
search = GoogleSerperAPIWrapper(serper_api_key=os.getenv('SERPER_API_KEY'))


def call_gpt3_5(query: str):
    response = client_groq.chat.completions.create(
    model="llama3-8b-8192",
    # response = client_openAI.chat.completions.create(
    # model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": query}
    ]
    )
    answer = response.choices[0].message.content
    return answer

def normal_rag_api(query: str):
    try:
        print("Entering api call")
        response = requests.post("http://localhost:8765/normal_ragapi", data={"query": query} )  
        print("Exiting api call")  
        print("response",response)
        # response.raise_for_status()  # Raise an exception for non-2xx responses
        results = response.json()
        print(results)
        return results 
    except Exception as e:  
        raise ValueError(f"Error processing normal rag tool results: {e}")
    
def summary_rag_api(query: str):
    try:
        print("Entering api call")
        response = requests.post("http://localhost:8765/summary_ragapi", data={"query": query} )  
        print("Exiting api call")  
        print("response",response)
        # response.raise_for_status()  # Raise an exception for non-2xx responses
        results = response.json()
        print(results)
        return results 
    except Exception as e:  
        raise ValueError(f"Error processing summary rag tool results: {e}")
    
    
# Registering the tools
normal_RAGTool = Tool(
    func=normal_rag_api,
    name="normal_RAGTool",
    description="Use this normal_RAGTool for answering specific questions about particular parts or details or information within a document.")

summary_RAGTool = Tool(
    func=summary_rag_api,
    name="summary_RAGTool",
    description="Use this summary_RAGTool for addressing questions about the overall content, main ideas, or summary of an entire document.")

GPT3_5Tool = Tool(
    func=call_gpt3_5,
    name="GPT3_5Tool",
    description="Use this GPT3_5Tool for general knowledge questions, creative tasks, or when explicitly requested by the user with '@GK / use external knowledge' or similar indicators.")

Search_tool = Tool.from_function(
    func= search.run,
    name = 'google_search',
    description = 'Search Engine. Use this tool when you need to perform an internet search to find latest information that another tool can not provide.')

tavily_tool = Tool.from_function(
    func=tavily_search.invoke,
    name='tavily',
    description='search engine. Use this tool when you need to perform an internet search to find latest information that another tool can not provide.')


def process_agent(agent_executor, user_input):
    print("User: " + user_input)
    response = agent_executor.invoke(
        {
            "input": user_input,
            "chat_history": agent_executor.memory.chat_memory.messages if agent_executor.memory else []
        }
    )
    print(f"response1: {response}")
    return response['output']

# tools = [normal_RAGTool, summary_RAGTool, GPT3_5Tool]
tools = [normal_RAGTool, summary_RAGTool, GPT3_5Tool, Search_tool]

# Conversational memory
conversational_memory = ConversationBufferWindowMemory(memory_key='chat_history', k=5, return_messages=True)


instructions = """ You are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and utilize the correct tool to generate informative and relevant responses.
Respond to greetings warmly. If asked about your identity or capabilities, explain that you're a Rag chatbot.
Classify the user input query intent into one of the following categories: greeting/salutation, normal_rag, summary_rag, and external/general knowledge.
Based on the intent of user query you should route the query to the appropriate tool among normal_RAGTool, summary_RAGTool, GPT3_5Tool, Search_tool

1. normal_RAGTool:
   - Purpose: For answering specific questions about particular parts or details within a document.
   - Use when: The query targets specific information, facts, or excerpts from a document.
   - Example queries: " "

2. summary_RAGTool:
   - Purpose: For addressing questions about the overall content, main ideas, or summary of an entire document.
   - Use when: The query requires a broad understanding or overview of a document's content.
   - Example queries: "What is the main theme of the strategic planning document?", "Summarize the key points of this document."

3. GPT3_5Tool:
   - Purpose: For general knowledge questions, creative tasks, or queries outside the scope of the provided documents.
   - Use when: Only if user explicitly requests external knowledge (e.g., using "@GK", "use general knowledge", "search from external sources", etc.)
   - Example queries: "What is the capital of France? @GK", "Who is the CEO of Google?."

4. Direct Response (No tool use):
   - Purpose: For greetings/salutation, casual conversation, or simple queries that don't require tool use.
   - Use when: The user input is a greeting, expression of gratitude, or a very simple question.
   - Example queries: "Hello!", "How are you?", "Thank you for your help."
   
5. Search_tool:
   - Purpose: Search Engine. Use this tool when you need to perform an internet search to find latest information that another tool can not provide..
   - Use when: The user input is a search query or a web search to find latest information.
   - Example queries: "Who won the mens T20I world cup 2024?", "what is todays date?", "What is the weather in London?",
   
   
Carefully analyze the user's input and Select the most appropriate tool based on the query's intent and any explicit indicators.
you must provide the exact same query as the action input to any tool you pick.
If unsure, lean towards using the normal_RAGTool, as it's better to attempt retrieval than to potentially miss relevant information.
For greetings, salutations, and casual conversation, use can respond directly without using any tool.
you must only use each tool up to two times per input query. Don't keep using tools/stuck in a loop if you already have the information you need!
If the response is not satisfactory, try a different tool. Don't use the same tool twice in a row.
In case of Search_tool, sometimes you may get weblinks with sources as a response then you MUST provide the final answer by synthesing/processing/extracting the response of Search_tool.
"""


template= '''

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
        '''
base_prompt = PromptTemplate.from_template(template)

# base_prompt = hub.pull('hwchase17/react')
# base_prompt = hub.pull("langchain-ai/react-agent-template")
prompt = base_prompt.partial(instructions=instructions)
prompt.pretty_print()


agent = create_react_agent(llm_model, tools, prompt)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True, memory= conversational_memory, max_iterations=6)

if __name__ == "__main__":
    
    while True:
        user_input = input("you: ")

        if user_input.lower() == "exit":
            break
                
        
        response = process_agent(agent_executor, user_input)
        print(f"response: {response}")
