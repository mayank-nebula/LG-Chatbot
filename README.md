import aiosqlite
from typing import Optional

class AsyncDatabaseConnection:
    _shared_instance: Optional["AsyncDatabaseConnection"] = None

    def __init__(self, db_path: str = "combined.db", **connect_kwargs):
        self._db_path = db_path
        self._conn: Optional[aiosqlite.Connection] = None
        self._connect_kwargs = connect_kwargs

    async def connect(self) -> aiosqlite.Connection:
        if self._conn is None:
            self._conn = await aiosqlite.connect(self._db_path, **self._connect_kwargs)
            AsyncDatabaseConnection._shared_instance = self
        return self._conn

    async def disconnect(self) -> None:
        if self._conn:
            await self._conn.close()
            self._conn = None
            if AsyncDatabaseConnection._shared_instance is self:
                AsyncDatabaseConnection._shared_instance = None

    @classmethod
    def get_instance(cls) -> "AsyncDatabaseConnection":
        inst = cls._shared_instance
        if inst is None:
            raise RuntimeError("Database not initialized. Call .connect() first.")
        return inst
