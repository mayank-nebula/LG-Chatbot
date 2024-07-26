from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, AsyncGenerator
import os
import re
import json
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from langchain.schema import HumanMessage
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from chromadb.config import Settings
import base64
from PIL import Image
import io
import pickle
import uvicorn
