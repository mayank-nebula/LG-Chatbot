from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings

embeddings = OllamaEmbeddings(base_url = 'http://52.158.238.161:11434', model='nomic-embed-text:latest')
vectorStore = Chroma(
    collection_name='GV_Test_MV',
    client=chroma_client,
    embedding_function=embeddings
)


specific_ids = ['015EOPAMLG4BLBWYTESFAIZTBY3TTNGD46','015EOPAMP7JCDI4KNM3ZDIAI2UAH4SRBWH']

results = vectorStore.get(
    where={"id": {"$in": specific_ids}},
)
