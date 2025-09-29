class QuestionLoader:
    _instance = None
    _lock = asyncio.Lock()
    _data: List[str] = []

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def load(self, filepath: str):
        """Load JSON data once asynchronously."""
        if not self._data:  # load only once
            async with self._lock:  # ensure thread-safety
                if not self._data:  # double-check
                    loop = asyncio.get_event_loop()
                    content = await loop.run_in_executor(
                        None, Path(filepath).read_text
                    )
                    json_data = json.loads(content)
                    self._data = json_data.get("questions", [])
        return self._data

    def get_random_questions(self, n: int = 4) -> List[str]:
        if not self._data:
            raise RuntimeError("Questions not loaded yet. Call load() first.")
        return random.sample(self._data, min(n, len(self._data)))
