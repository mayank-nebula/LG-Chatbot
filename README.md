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








<!DOCTYPE html>
<html>

<head>
    <title>Markdown Generator</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>

<body>
    <h1>Markdown Generator</h1>
    <form id="topic-form">
        <label for="topic">Enter a topic:</label>
        <input type="text" id="topic" name="topic">
        <button type="submit">Generate</button>
    </form>
    <div id="result"></div>
    <script>
        document.getElementById("topic-form").addEventListener("submit", async function (event) {
            event.preventDefault();
            const topic = document.getElementById("topic").value;
            // const response = await fetch('http://localhost:6969', {
            const response = await fetch('http://20.191.112.232:6969', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: topic })
            });
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            const resultDiv = document.getElementById("result");
            let result = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                result += decoder.decode(value);
                resultDiv.innerHTML = marked.parse(result);
            }
        });
    </script>
</body>

</html>
