from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama  # Ensure you have this import correctly set up
from typing import AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize the Ollama model
model = ChatOllama(base_url="http://localhost:11434", model="llama3.1:latest")  # Adjust this based on your actual setup
# Initialize the prompt and parser
prompt = ChatPromptTemplate.from_template("generate some content about {topic}")
parser = StrOutputParser()

@app.get("/generate/{topic}")
async def generate_content(topic: str):
    async def content_generator(topic: str) -> AsyncGenerator[str, None]:
        chain = prompt | model | parser
        async for chunk in chain.astream({"topic": topic}):
            yield f"{chunk}"

    return StreamingResponse(content_generator(topic), media_type="text/markdown")

# if _name_ == "_main_":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=6969)
