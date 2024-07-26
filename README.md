from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
from test_1 import process_question
import pandas as pd
import uvicorn

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

permission_df = pd.read_csv(
    "/home/Mayank.Sharma/GV_Test/backend/fast/users_permission.csv"
)
user_permissions = permission_df[permission_df["UserLookupId"] == 194]
permission_str = user_permissions.iloc[0]["Permissions"]
permissions = permission_str.split(";")


@app.get("/generate/{topic}")
async def generate_content(topic: str):
    ans = ""
    async def content_generator(topic: str) -> AsyncGenerator[str, None]:
        global ans
        chain = process_question(
            topic,
            [],
            permissions,
            [],
            "GPT",
            "Yes",
            "GPT",
        )
        async for chunk in chain.astream(topic):
            ans += chunk
            yield f"{chunk}"
    print(ans)
    return StreamingResponse(content_generator(topic), media_type="text/markdown")


if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=6969)
