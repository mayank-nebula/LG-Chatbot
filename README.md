import mysql.connector
from typing import Optional


class DatabaseConnection:
    _shared_instance: Optional["DatabaseConnection"] = None

    def __init__(
        self,
        host: str = "localhost",
        port: int = 3306,
        user: str = "root",
        password: str = "",  # default empty
        database: str = "mydb",
        **connect_kwargs,
    ):
        """MySQL database connection manager (singleton style)."""
        self._db_config = {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "database": database,
            **connect_kwargs,
        }
        self._conn: Optional[mysql.connector.MySQLConnection] = None

    def connect(self) -> mysql.connector.MySQLConnection:
        """Open a connection and register this instance as the shared one."""
        if self._conn is None:
            self._conn = mysql.connector.connect(**self._db_config)
            DatabaseConnection._shared_instance = self
        return self._conn

    def disconnect(self) -> None:
        """Close connection and clear shared instance if it points to this instance."""
        if self._conn:
            self._conn.close()
            self._conn = None
            if DatabaseConnection._shared_instance is self:
                DatabaseConnection._shared_instance = None

    @classmethod
    def get_connection(cls) -> mysql.connector.MySQLConnection:
        """Get the live connection anywhere in the app."""
        inst = cls._shared_instance
        if inst is None or inst._conn is None:
            raise RuntimeError("Database not initialized. Call .connect() at startup.")
        return inst._conn

    @classmethod
    def get_instance(cls) -> "DatabaseConnection":
        """Return the instance that performed connect()."""
        inst = cls._shared_instance
        if inst is None:
            raise RuntimeError("Database not initialized. Call .connect() at startup.")
        return inst
