from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from config import env_config


class SQLDatabaseConnection:
    _shared_instance: Optional["SQLDatabaseConnection"] = None

    def __init__(self, *args, **kwargs):
        self._user = env_config.MYSQL_USER
        self._password = env_config.MYSQL_PASSWORD
        self._host = env_config.MYSQL_HOST
        self._db = env_config.MYSQL_DATABASE
        self._engine: Optional[Engine] = None

    def connect(self) -> Engine:
        """
        Open a connection and register this instance as the shared one.
        Call this at app startup on the instance you create.
        """
        if self._engine is None:
            conn_string = f"mysql+mysqlconnector://{self._user}:{self._password}@{self._host}/{self._db}"
            self._engine = create_engine(conn_string)
            SQLDatabaseConnection._shared_instance = self
        return self._engine

    def disconnect(self) -> None:
        """
        Close connection and clear shared instance if it points to this instance.
        """
        if self._engine:
            self._engine.dispose()
            self._engine = None
            if SQLDatabaseConnection._shared_instance is self:
                SQLDatabaseConnection._shared_instance = None

    @classmethod
    def get_connection(cls) -> Engine:
        """
        Classmethod used anywhere in the app to obtain the live sqlite3.Connection.
        Raises RuntimeError if the app didn't create an instance and call connect() at startup.
        """
        inst = cls._shared_instance
        if inst is None or inst._engine is None:
            raise RuntimeError(
                "Database not initialized. Create an instance and call .connect() at startup."
            )
        return inst._engine

    @classmethod
    def get_instance(cls) -> "SQLDatabaseConnection":
        """
        Return the instance that performed connect(). Useful for shutdown/disconnect.
        """
        if cls._shared_instance is None:
            cls._shared_instance = cls()
        return cls._shared_instance
if individual_data["type"] == "structured_rag":
                    conn = SQLDatabaseConnection.get_connection()
                    sources = individual_data["source"]

                    if isinstance(sources, str):
                        df = pd.read_csv(individual_data["source"])
                        df.to_sql(
                            individual_data["variable_name"],
                            conn,
                            if_exists="replace",
                            index=False,
                            method="multi",
                        )
                    elif isinstance(sources, list):
                        for source in sources:
                            name = os.path.splitext(os.path.basename(source))[0]
                            df = pd.read_csv(source, on_bad_lines="skip")
                            df.to_sql(
                                name,
                                conn,
                                if_exists="replace",
                                index=False,
                                method="multi",
                            )      File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/util.py", line 147, in __exit__
    with util.safe_reraise():
         ^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/util/langhelpers.py", line 224, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/util.py", line 145, in __exit__
    self.commit()
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 2632, in commit
    self._do_commit()
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 2737, in _do_commit
    self._connection_commit_impl()
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 2708, in _connection_commit_impl
    self.connection._commit_impl()
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 1147, in _commit_impl
    self._handle_dbapi_exception(e, None, None, None, None)
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 2358, in _handle_dbapi_exception
    raise exc_info[1].with_traceback(exc_info[2])
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 1145, in _commit_impl
    self.engine.dialect.do_commit(self.connection)
                                  ^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 581, in connection
    return self._revalidate_connection()
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 673, in _revalidate_connection
    self._invalid_transaction()
  File "/usr/local/lib/python3.12/site-packages/sqlalchemy/engine/base.py", line 663, in _invalid_transaction
    raise exc.PendingRollbackError(
sqlalchemy.exc.PendingRollbackError: Can't reconnect until invalid transaction is rolled back.  Please rollback() fully before proceedi
ng (Background on this error at: https://sqlalche.me/e/20/8s2b)
