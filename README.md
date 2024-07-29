from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import (
    ChatOllama,
)
from typing import AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = ChatOllama(base_url="http://10.0.0.4:11434", model="llama3.1:latest")
prompt = ChatPromptTemplate.from_template("generate some content about {topic}")
parser = StrOutputParser()


@app.post("/")
async def generate_content(request: Request):
    body = await request.json()
    topic = body.get("question")

    async def content_generator(topic: str) -> AsyncGenerator[str, None]:
        chain = prompt | model | parser
        async for chunk in chain.astream({"topic": topic}):
            yield f"{chunk}"

    return StreamingResponse(content_generator(topic), media_type="text/markdown")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=6969)
