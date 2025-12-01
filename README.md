import pg8000
from google.cloud.alloydb.connector import Connector
import sqlalchemy

# Initialize the AlloyDB Python Connector
def get_connection():
    """Creates a connection pool for AlloyDB."""
    connector = Connector()
    
    def getconn():
        conn = connector.connect(
            instance_uri="projects/YOUR_PROJECT_ID/locations/YOUR_REGION/clusters/YOUR_CLUSTER/instances/YOUR_INSTANCE",
            driver="pg8000",
            user="YOUR_DB_USER",
            password="YOUR_DB_PASSWORD",
            db="YOUR_DATABASE_NAME"
        )
        return conn
    
    return getconn

# Method 1: Using SQLAlchemy connection pool
def connect_with_sqlalchemy():
    """Connect using SQLAlchemy engine."""
    pool = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=get_connection(),
    )
    
    with pool.connect() as conn:
        result = conn.execute(sqlalchemy.text("SELECT version()"))
        print("Database version:", result.fetchone()[0])
        
        # Example query
        result = conn.execute(sqlalchemy.text("SELECT NOW()"))
        print("Current timestamp:", result.fetchone()[0])
    
    return pool

# Method 2: Direct connection using pg8000
def connect_direct():
    """Direct connection without connection pooling."""
    connector = Connector()
    
    conn = connector.connect(
        instance_uri="projects/YOUR_PROJECT_ID/locations/YOUR_REGION/clusters/YOUR_CLUSTER/instances/YOUR_INSTANCE",
        driver="pg8000",
        user="YOUR_DB_USER",
        password="YOUR_DB_PASSWORD",
        db="YOUR_DATABASE_NAME"
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT version()")
    print("Database version:", cursor.fetchone()[0])
    
    cursor.execute("SELECT NOW()")
    print("Current timestamp:", cursor.fetchone()[0])
    
    cursor.close()
    conn.close()
    connector.close()

if __name__ == "__main__":
    # Choose one method:
    
    # Option 1: SQLAlchemy (recommended for production)
    print("Connecting with SQLAlchemy...")
    pool = connect_with_sqlalchemy()
    
    # Option 2: Direct connection
    # print("Connecting directly...")
    # connect_direct()
