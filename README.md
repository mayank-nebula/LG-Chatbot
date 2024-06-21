import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
import json

# Set ChromaDB settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file
load_dotenv()

# Load configuration from a config.json file
with open('config.json', 'r') as confile_file:
    config = json.load(confile_file)

# Extract base URL and embedding model name from the config
base_url = config['ollama']['base_url']
nomic = config['ollama']['embeddings']['nomic']

# Initialize ChromaDB HTTP client
chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)

# Get or create a collection named 'GV_Test_MV'
collection = chroma_client.get_or_create_collection(name='GV_Test_MV')

# Initialize OllamaEmbeddings with the specified base URL and model
embeddings = OllamaEmbeddings(base_url=base_url, model=nomic)

# Initialize Chroma vector store with the specified collection name, client, and embedding function
vectorstore = Chroma(
    collection_name='GV_Test_MV',
    client=chroma_client,
    embedding_function=embeddings
)

# Retrieve all items from the vector store
results = vectorstore.get()

# Lists to store target indices and internal IDs of items to be deleted
target_index = []
internal_id = []

def delete_from_vectorstore(id):
    """
    Deletes an item from the vector store based on its ID.

    Parameters:
    - id (str): The ID of the item to be deleted.

    The function finds the target indices and internal IDs of the items to be deleted
    and performs the deletion operation on the vector store.
    """
    # Find the target indices based on the given ID
    for i, metadata in enumerate(results['metadatas']):
        if metadata['id'] == id:
            target_index.append(i)
    
    # Find the internal IDs of the items to be deleted
    for index in target_index:
        internal_id.append(results['ids'][index])
    
    # Delete the items from the vector store
    vectorstore.delete(ids=internal_id)
