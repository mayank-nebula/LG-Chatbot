@app.middleware("https")
async def validate_origins(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin and origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="Access Denied: Invalid Origin")
    response = await call_next(request)
    return


@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI"}


@app.post("/")
async def generate_content(message: Message):
    async def content_generator_summary(question: str) -> AsyncGenerator[str, None]:
