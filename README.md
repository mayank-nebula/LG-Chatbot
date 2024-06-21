import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
import json

settings = Settings(anonymized_telemetry=False)
load_dotenv()

with open('config.json', 'r') as confile_file:
    config = json.load(confile_file)

base_url = config['ollama']['base_url']
nomic = config['ollama']['embeddings']['nomic']

chroma_client = chromadb.HttpClient(host="localhost", port=8000, settings=settings)
collection = chroma_client.get_or_create_collection(name = 'GV_Test_MV')
embeddings = OllamaEmbeddings(base_url = base_url, model=nomic)
vectorstore = Chroma(
    collection_name='GV_Test_MV',
    client=chroma_client,
    embedding_function=embeddings
)

results = vectorstore.get()

target_index = []
internal_id = []

def delete_form_vectostore(id):
    for i, metadata in enumerate(results['metadatas']):
        if metadata['id'] == id:
            target_index.append(i)
    
    for index in target_index:
        internal_id.append(results['ids'][index])
    
    vectorstore.delete(ids=internal_id)


    





