from langchain.agents import AgentExecutor, create_react_agent, Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain.memory import SQLChatMessageHistory, ConversationSummaryMemory



tools = [
    Tool(name="extract_text", func=extract_text, description="Extract text from a PDF"),
    Tool(name="store_embeddings", func=store_embeddings, description="Store embeddings for text"),
    Tool(name="search_db", func=search_db, description="Search the vector DB"),
]

# --- LLM ---
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# --- Persistent DB-backed history ---
db_url = "sqlite:///chat_memory.db"
user_id = "user123"
thread_id = "thread1"
session_id = f"{user_id}:{thread_id}"

history = SQLChatMessageHistory(session_id=session_id, connection_string=db_url)

# --- Summarized memory ---
memory = ConversationSummaryMemory(
    llm=llm,
    chat_memory=history,   # raw history still saved in DB
    return_messages=True,
    memory_key="chat_history"
)

# --- Custom Prompt ---
prompt = ChatPromptTemplate.from_messages([
    ("system", 
     "You are a helpful assistant that can use tools. "
     "Always extract text before storing embeddings. "
     "Summarize past chats concisely. "
     "Respond clearly and politely."),
    MessagesPlaceholder("chat_history"),   # memory slot
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),  # reasoning scratchpad
])

# --- Create ReAct Agent ---
react_agent = create_react_agent(llm, tools, prompt)

# --- Wrap in executor with memory ---
agent_executor = AgentExecutor(
    agent=react_agent,
    tools=tools,
    memory=memory,
    verbose=True
)

# --- Example conversation ---
print(agent_executor.invoke({"input": "Please extract text from ./docs/sample.pdf"}))
print(agent_executor.invoke({"input": "Now store embeddings for that text"}))
print(agent_executor.invoke({"input": "Search for climate change"}))
