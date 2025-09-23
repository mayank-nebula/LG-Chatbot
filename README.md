import sqlite3
from typing import Optional

class DatabaseConnection:
    # Holds the instance that actually performed connect()
    _shared_instance: Optional["DatabaseConnection"] = None

    def __init__(self, db_path: str = "combined.db", **connect_kwargs):
        self._db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
        self._connect_kwargs = connect_kwargs

    def connect(self) -> sqlite3.Connection:
        """
        Open a connection and register this instance as the shared one.
        Call this at app startup on the instance you create.
        """
        if self._conn is None:
            self._conn = sqlite3.connect(self._db_path, **self._connect_kwargs)
            DatabaseConnection._shared_instance = self
        return self._conn

    def disconnect(self) -> None:
        """
        Close connection and clear shared instance if it points to this instance.
        """
        if self._conn:
            self._conn.close()
            self._conn = None
            if DatabaseConnection._shared_instance is self:
                DatabaseConnection._shared_instance = None

    @classmethod
    def get_connection(cls) -> sqlite3.Connection:
        """
        Classmethod used anywhere in the app to obtain the live sqlite3.Connection.
        Raises RuntimeError if the app didn't create an instance and call connect() at startup.
        """
        inst = cls._shared_instance
        if inst is None or inst._conn is None:
            raise RuntimeError(
                "Database not initialized. Create an instance and call .connect() at startup."
            )
        return inst._conn

    @classmethod
    def get_instance(cls) -> "DatabaseConnection":
        """
        Return the instance that performed connect(). Useful for shutdown/disconnect.
        """
        inst = cls._shared_instance
        if inst is None:
            raise RuntimeError("Database not initialized. Create an instance and call .connect() at startup.")
        return inst
