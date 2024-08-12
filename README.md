app = FastAPI()

allowed_origins = [
    "https://evalueserveglobal.sharepoint.com",
    "https://gatesventures.sharepoint.com/sites/scientia/_layouts/15/workbench.aspx",
    "https://gatesventures.sharepoint.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client["GV_Test"]
collection_user = db["users"]
collection_chat = db["chats"]


class Message(BaseModel):
    question: str
    chatId: str = ""
    chatHistory: List[Any] = []
    filters: List[str] = []
    stores: str = "GPT"
    image: str = "Yes"
    llm: str = "GPT"
    userEmailId: str = ""
    regenerate: str = "No"
    feedbackRegenerate: str = "No"
    reason: str = ""
    userLookupId: int = 194
    filtersMetadata: List[Dict[str, List[str]]] = None

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
