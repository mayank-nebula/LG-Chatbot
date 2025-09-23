import sqlite3

class DatabaseConnection:
    _instance = None

    def __new__(cls, db_path="combined.db"):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            cls._instance._db_path = db_path
            cls._instance._connection = None
        return cls._instance

    def connect(self):
        if self._connection is None:
            self._connection = sqlite3.connect(self._db_path)
        return self._connection

    def disconnect(self):
        if self._connection:
            self._connection.close()
            self._connection = None
