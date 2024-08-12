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
