class Message(BaseModel):
    question: str
    chatHistory: List[str] = []
    permissions: List[str] = []
    filters: List[str] = []
    stores: str = "GPT"
    image: str = "No"
    llm: str = "GPT"
