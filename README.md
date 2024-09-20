{
  "question_intent": "AI Assistant Instructions \n\nRole and Primary Task:\nYou are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and generate informative and relevant responses. Your default source of information is the internal knowledge base.\n\nGeneral Behavior:\n1. Respond to greetings warmly and briefly.\n2. If asked about your identity or capabilities, explain concisely that you're a RAG (Retrieval-Augmented Generation) chatbot with access to an internal knowledge base.\n3. Classify user input query intent into one of these categories: greeting/salutation, normal_rag, summary_rag.\n\nStrict Decision Protocol:\n\n1. normal_RAG (DEFAULT CATEGORY):\n- Purpose: Answering most questions using the internal knowledge base.\n- Use when: The query can be answered using internal information, which covers a wide range of topics including company data, reports, policies, product information, etc.\n- Always prioritize this category for most queries unless the query explicitly falls into another category.\n- This category also includes context-dependent follow-up questions like 'Tell me more about it' or 'Can you elaborate on that?'\n\n2. summary_rag:\n- Purpose: Addressing questions about overall content, main ideas, or summaries of entire documents from the internal knowledge base.\n- Use when: The query explicitly requires a broad understanding or overview of a document's content as a whole.\n- Example queries: \n* 'What is the main theme of the strategic planning document?'\n* 'Summarize the key points of the entire document.'\n* 'Give me an overview of this document's content.'\n* 'What are the main topics covered throughout this document?'\n\n3. direct_response:\n- Purpose: Handling greetings, casual conversation, or very simple queries.\n- Use when: The user input is a greeting, expression of gratitude, or a very simple question that doesn't require accessing any knowledge base.\n- Example queries:\n* 'Hello!'\n* 'How are you?'\n* 'Thank you for your help.'\n\nResponse Protocol:\n1. Always default to using the normal_rag category unless the query clearly falls into another category.\n2. Use the summary_rag category only when explicitly asked for document-wide summaries or overviews.\n3. Respond directly without using any tool for greetings, salutations, and casual conversation.\n4. For any responses:\n- Synthesize, process, or extract information to provide the final answer.\n- Do simply relay on raw data.\n\nRemember: \n1. Your primary source of information is the internal knowledge base.\n2. Consider Previous Conversation before returning any response.\n\nUser Query: {question}\n\nPrevious Conversation: {chat_history}\n\nPlease respond with the appropriate keyword based on the analysis of the user query:\n - 'normal_rag'\n- 'summary_rag'\n- 'direct_response'\n",
  "generate_reason": "As an AI assistant, interpret the users's feedback and provide a concise and instructional prompt for llm to follow. \n{reason}",
  "create_new_title": "Given the following question, create a concise and informative title that accurately reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n {element}.Don't use your own knowledge, form question based on the first question.",
  "formulate_question": "Please extract extracting the entities and intent from a given question. just give the keywords and intent in a reformulated question eliminating half the words. the question is\n {element} \n.Give only the newly formulated question and nothing else",
  "standalone_question": "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\nWhen responding to a user's query, please ensure that your response:\nIs informative and comprehensive.\nIs clear and concise.\nIs relevant to the topic at hand.\nAdheres to the guidelines provided in the initial prompt.\nIs aligned with the specific context of the Scientia SharePoint portal.\n\nRemember to: \nAvoid providing personal opinions or beliefs.\nBase your responses solely on the information provided.\nBe respectful and polite in all interactions.\nLeverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\nGiven a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question,just reformulate it if needed and otherwise return it as is. Don't provide anything else, just provide the question. \n\nChat History\n{chat_history}User Question : \n{question}",
  "content_generator_GPT": "Please answer the following question. \nUse your own knowledge to answer the question. \nGive me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.\nConversation history  \n{chat_history}\nUser Question : \n{question} \n\n",
  "text_message_normal_rag": "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\nWhen responding to a user's query, please ensure that your response:\n Is informative and comprehensive.\n Is clear and concise.\n Is relevant to the topic at hand.\n Adheres to the guidelines provided in the initial prompt.\n Is aligned with the specific context of the Scientia SharePoint portal.\n\n Remember to:\n Avoid providing personal opinions or beliefs.\n Base your responses solely on the information provided.\n Be respectful and polite in all interactions.\n Leverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\n From the given context, please provide a well-articulated response to the asked question.\n If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n If the context has some resonance with the question, try formulating the answer.\n Maintain context from previous conversations to ensure coherent and relevant responses.\nConsider Chat History as context before answering.\n\n Never answer from your own knowledge source, always asnwer from the provided context.\n User's question: {question}\n\n {original_content}\n {summary_content}\n\n {previous_conversation}\n\n {reason} ",
  "text_message_summary_rag": "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\n When responding to a user's query, please ensure that your response:\n Is informative and comprehensive.\n Is clear and concise.\n Is relevant to the topic at hand.\n Adheres to the guidelines provided in the initial prompt.\n Is aligned with the specific context of the Scientia SharePoint portal.\n\n Remember to:\n Avoid providing personal opinions or beliefs.\n Base your responses solely on the information provided.\n Be respectful and polite in all interactions.\n Leverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\n Task: Generate a cohesive and unified summary of the provided content, focusing on the business context and avoiding unnecessary formatting details.\n\n Guidelines : \n Avoid slide-by-slide or section-by-section breakdowns.\n Present the summary as a continuous flow.\n Ensure a smooth, coherent narrative.\n Omit concluding phrases like 'Thank you.'\n Base your response solely on the provided content.\n Maintain context from previous conversations.\n If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\nConsider Chat History as context before answering\n\n If the context has some resonance with the question, try formulating the answer.\n Input:\n User's question: {question}\n {original_content}\n {summary_content}\n {previous_conversation}\n\n {reason}\n\n Output:\n Summary : A comprehensive and accurate response to the user's question, presented in a clear and concise format with appropriate headings, subheadings, bullet points, and spacing.\n\n ",
  "content_generator_salutation": "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal. \n\nWhen responding to a user's query, please ensure that your response:\nIs informative and comprehensive.\nIs clear and concise.\nIs relevant to the topic at hand.\nAdheres to the guidelines provided in the initial prompt.\nIs aligned with the specific context of the Scientia SharePoint portal.\n\nRemember to:\nAvoid providing personal opinions or beliefs.\nBase your responses solely on the information provided.\nBe respectful and polite in all interactions.\n\nLeverage the specific knowledge and resources available within the Scientia SharePoint portal.\nThe following is a conversation with a highly intelligent AI assistant. \nThe assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \nWhen the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\n\nConversation history \n{chat_history}\nUser Question : \n{question}\n\n"
}


from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from transformers import DetrImageProcessor, DetrForObjectDetection
import torch
from PIL import Image, ImageDraw, ImageFont
import os
import numpy as np
import logging
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Load the processor and model
model_name = "TahaDouaji/detr-doc-table-detection"
processor = DetrImageProcessor.from_pretrained(model_name)
model = DetrForObjectDetection.from_pretrained(model_name)
model.eval()


# Function to draw bounding boxes
def draw_boxes(image, boxes, labels, scores, id2label):
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    for box, label, score in zip(boxes, labels, scores):
        box = [round(i, 2) for i in box.tolist()]
        draw.rectangle(box, outline="red", width=3)
        draw.text(
            (box[0], box[1]),
            f"{id2label[label.item()]}: {round(score.item(), 3)}",
            fill="red",
            font=font,
        )

    return image


# Function to crop and save detected tables
def crop_and_save(image, boxes, output_dir, image_number):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    cropped_images = []
    for idx, box in enumerate(boxes):
        box = [round(i, 2) for i in box.tolist()]
        cropped_image = image.crop(box)
        cropped_image_path = os.path.join(
            output_dir, f"table_{image_number}_{idx+1}.png"
        )
        cropped_image.save(cropped_image_path)
        cropped_images.append(cropped_image_path)
        logger.info(f"Cropped image saved to {cropped_image_path}")

    return cropped_images


@app.post("/detect-tables")
async def detect_tables(
    file: UploadFile = File(...),
    output_dir: str = Form(...),
    slide_number: int = Form(...),
):
    try:
        # Load and validate the image
        image = Image.open(file.file).convert("RGB")

        # Convert the image to a numpy array
        image_array = np.array(image)

        # Prepare inputs and perform inference
        inputs = processor(images=image_array, return_tensors="pt")
        outputs = model(**inputs)

        # Post-process the outputs to get the bounding boxes and labels
        target_sizes = torch.tensor([image.size[::-1]])
        results = processor.post_process_object_detection(
            outputs, target_sizes=target_sizes, threshold=0.85
        )[0]

        # Print the detected tables
        for score, label, box in zip(
            results["scores"], results["labels"], results["boxes"]
        ):
            box = [round(i, 2) for i in box.tolist()]
            logger.info(
                f"Detected {model.config.id2label[label.item()]} with confidence "
                f"{round(score.item(), 3)} at location {box}"
            )

        # Draw the bounding boxes on the image
        image_with_boxes = draw_boxes(
            image.copy(),
            results["boxes"],
            results["labels"],
            results["scores"],
            model.config.id2label,
        )

        # Save the image with bounding boxes
        output_path = "image_with_boxes.png"
        image_with_boxes.save(output_path)

        # Crop and save the detected tables
        cropped_images = crop_and_save(
            image, results["boxes"], output_dir, slide_number
        )

        return {
            "message": "Tables detected and processed successfully",
            "cropped_images": cropped_images,
        }

    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    uvicorn.run("image2table:app", host="0.0.0.0", port=8183)



const fs = require("fs");
const path = require("path");

const axios = require("axios");
const csv = require("csv-parser");

const User = require("../models/user");
const Chat = require("../models/chat");
const Question = require("../models/question");
const { getUserPermissions } = require("../utils/userPermissions");

require("dotenv").config();

// Retrieves all chat threads of a particular user if the user exists, if user detail does not exist in mongoDB, store the user details in mongoDB
exports.getAllChats = async (req, res, next) => {
  const userEmailId = req.query.userEmailId;
  const fullName = req.query.userName;
  // const offset = parseInt(req.query.offset) || 0;
  // const limit = 10;
  const userLookupId = req.query.userLookupId;
  try {
    const user = await User.findOne({ email: userEmailId });
    const userPermissionCSV = path.join(
      __dirname,
      "..",
      "csv",
      "users_permission.csv"
    );
    const permission = await getUserPermissions(userPermissionCSV, "194");
    const csvStats = fs.statSync(userPermissionCSV);
    const csvLastModified = csvStats.mtime.getTime();
    if (!user) {
      const newUser = new User({
        userFullName: fullName,
        email: userEmailId,
        userPermissions: permission,
      });
      await newUser.save();
      res.status(200).json({ chats: [], message: "new user created" });
    } else {
      const userLastUpdated = new Date(user.updatedAt).getTime();

      if (userLastUpdated < csvLastModified) {
        user.userPermissions = permission;
        await user.save();
      }

      const chats = await Chat.find({ userEmailId: userEmailId }).sort({
        updatedAt: -1,
      });
      // .skip(offset).limit(limit);
      const chatList = chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        updatedAt: chat.updatedAt,
        bookmark: chat.bookmark,
      }));
      res.status(200).json({ chats: chatList });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Retrives a specific chat by its ID and filters out any flagged messages
exports.getSpecificChat = async (req, res, next) => {
  const chatId = req.query.chatId;
  try {
    const response = await Chat.findOne({
      _id: chatId,
      userEmailId: req.query.userEmailId,
    });
    if (!response) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    const filteredChats = response.chats;
    //    console.log(filteredChats);
    res.status(201).json({
      message: "Chat extracted.",
      title: response.title,
      chats: filteredChats,
      updatedAt: response.updatedAt,
      createdAt: response.createdAt,
      filtersMetadata: response.filtersMetadata,
      isGPT: response.isGPT,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getRandomQuestions = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.query.userEmailId });
    if (!user) {
      const error = new Error("User Not Found");
      error.statusCode = 404;
      throw error;
    }

    const userPermissions = user.userPermissions;

    const randomQuestions = await Question.aggregate([
      // { $match: { docPermissions: { $in: userPermissions } } },
      { $unwind: "$questions" },
      { $sample: { size: 4 } },
      {
        $group: {
          _id: "$_id",
          documentName: { $first: "$documentName" },
          question: { $first: "$questions" },
          // docPermissions: {$first: "$docPermissions"}
        },
      },
    ]);

    const questions = randomQuestions.reduce((acc, item) => {
      acc[item.question] = item.documentName;
      return acc;
    }, {});

    // const questions = randomQuestions.map((item) => item.question);

    res.status(200).json({
      message: "Random questions retrieved successfully",
      totalQuestions: Object.keys(questions).length,
      questions: questions,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documentNames should be a non-empty array.");
      error.statusCode = 404;
      throw error;
    }

    const matchedQuestion = await Question.find({
      documentName: { $in: documentNames },
    });

    if (matchedQuestion.length === 0) {
      return res.status(200).json({
        message: "No matching documents found.",
        questions: {},
      });
    }

    const questionToDocumentMap = matchedQuestion.reduce((acc, doc) => {
      doc.questions.forEach((question) => {
        acc[question] = doc.documentName;
      });
      return acc;
    }, {});

    const uniqueQuestions = Object.keys(questionToDocumentMap);

    const shuffledQuestions = uniqueQuestions.sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffledQuestions.slice(0, 4);

    const finalQuestions = limitedQuestions.reduce((acc, question) => {
      acc[question] = questionToDocumentMap[question];
      return acc;
    }, {});

    res.status(200).json({
      message: "Matching documents found.",
      questions: finalQuestions,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Updates the title of a specific chat by its ID
exports.putChangeTitle = async (req, res, next) => {
  const title = req.body.title;
  const chatId = req.body.chatId;
  try {
    const updatedTitle = await Chat.findByIdAndUpdate(
      chatId,
      { title },
      { new: true }
    );
    if (!updatedTitle) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Chat Updated",
      chatId: chatId,
      title: title,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Toggles the bookmark status of a specific chat by its ID
exports.putBookmark = async (req, res, next) => {
  const chatId = req.body.chatId;
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    const newBookmark = !chat.bookmark;
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { bookmark: newBookmark },
      { new: true }
    );
    res.status(200).json({
      message: "Bookmark Updated",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Updates feedback for a specific message in a chat
exports.putChatFeedbck = async (req, res, next) => {
  const feedback = req.body.feedback;
  const chatId = req.body.chatId;
  const messageId = req.body.messageId;
  const reason = req.body.reason || "";
  try {
    const chatDocument = await Chat.findById(chatId);
    if (!chatDocument) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    const chat = chatDocument.chats.id(messageId);
    if (!chat) {
      const error = new Error("Answer Not Found in Chat");
      error.statusCode = 404;
      throw error;
    }
    chat.feedback = feedback;
    if (reason.length > 0) {
      chat.reason = reason;
    }
    await chatDocument.save();
    res.status(200).json({
      message: "Feedback Updated",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Deletes a parituclar chat thread by its ID
exports.deleteChat = async (req, res, next) => {
  const chatId = req.params.chatId;
  try {
    const deletedDocument = await Chat.findByIdAndDelete(chatId);
    if (!deletedDocument) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Chat Deleted",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};





import os
import re
import io
import json
import pickle
import base64
import logging
from bson import ObjectId
from datetime import datetime

import chromadb
import pandas as pd
from PIL import Image
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient
from chromadb.config import Settings
from langchain.schema import HumanMessage
from fastapi import FastAPI, HTTPException
from langchain_core.documents import Document
from fastapi.responses import StreamingResponse
from typing import Any, List, Dict, AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

# load environment variables  from a .env file
load_dotenv()

# ChromaDB settings configuraion
settings = Settings(anonymized_telemetry=False)
current_dir = os.getcwd()

# Global variables to store sources and user permissions
sources = {}
user_permissions = []
count_restriction = 0

# Initialize ChromaDB HTTP Client
CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)

# Initialize AzureOpenAI embeddings
embeddings_gpt = AzureOpenAIEmbeddings(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING"],
)

# Initialize Chroma vector stores for retrieving documents and summaries
vectorstore_gpt = Chroma(
    collection_name="GatesVentures_Scientia",
    client=CHROMA_CLIENT,
    embedding_function=embeddings_gpt,
)
vectorstore_gpt_summary = Chroma(
    collection_name="GatesVentures_Scientia_Summary",
    client=CHROMA_CLIENT,
    embedding_function=embeddings_gpt,
)

# Load document stores from pickled files
with open(
    os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"), "rb"
) as f:
    loaded_docstore_gpt = pickle.load(f)

with open(
    os.path.join(current_dir, "docstores", "GatesVentures_Scientia_Summary.pkl"), "rb"
) as f:
    loaded_docstore_gpt_summary = pickle.load(f)


# Initialize AzureChatOpenAI with specific parameters
llm_gpt = AzureChatOpenAI(
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0,
    max_retries=3,
)

# Load user permissions from a CSV file
permission_df = pd.read_csv(os.path.join(current_dir, "csv", "users_permission.csv"))

# Define allowed origin for CORS
allowed_origins = [
    "https://gatesventures.sharepoint.com",
]

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define a pydantic model for incoming messages
class Message(BaseModel):
    question: str
    chatId: str = ""
    chatHistory: List[Any] = []
    filters: List[str] = []
    image: str = "Yes"
    userEmailId: str
    regenerate: str = "No"
    feedbackRegenerate: str = "No"
    reason: str = ""
    userLookupId: int = 194
    filtersMetadata: List[Any] = []
    isGPT: bool = False
    anonymousFilter: str = ""


# Initialize mongoDB client and collections
collection_chat = None


def load_prompts():
    with open("prompts.json", "r") as file:
        return json.load(file)


prompts = load_prompts()


def get_user_permissions(userLookupId):
    """
    Retrieves user permissions based on the user lookup ID.

    Args:
        userLookupId (str): The user lookup ID.

    Returns:
        list: A list of permissions associated with the user.
    """
    user_permissions = permission_df[permission_df["UserLookupId"] == userLookupId]
    permission_str = user_permissions.iloc[0]["Permissions"]
    permissions = permission_str.split(";")

    return permissions


def format_chat_history(chatHistory):
    """
    Formats chat history into a string for processing.

    Args:
        chatHistory (list): A list of chat history records, each containing 'user' and 'ai' fields.

    Returns:
        str: A formatted string of chat history.
    """
    return "\n".join(
        [f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chatHistory]
    )


def looks_like_base64(sb):
    """
    Checks if a string looks like a base64 encoded string.

    Args:
        sb (str): The string to check.

    Returns:
        bool: True if the string appears to be base64 encoded, otherwise False.
    """
    try:
        return base64.b64encode(base64.b64decode(sb)) == sb.encode()
    except Exception:
        return False


def resize_base64_image(base64_string, size=(128, 128)):
    """
    Resizes an image encoded as a base64 string.

    Args:
        base64_string (str): The base64 encoded image string.
        size (tuple): The target size for resizing (width, height).

    Returns:
        str: The resized image as a base64 encoded string.
    """
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    resized_img = img.resize(size, Image.LANCZOS)
    buffered = io.BytesIO()
    resized_img.save(buffered, format=img.format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def process_metadata(metadata):
    """
    Extracts the file name from metadata.

    Args:
        metadata (str): The metadata string containing file information.

    Returns:
        str: The extracted file name if found, otherwise None.
    """
    metadata = re.sub(r"'", r'"', metadata)
    pattern = r'.*?"FileLeafRef"\s*:\s*"([^"]*)"'
    match = re.search(pattern, metadata, re.DOTALL)

    if match:
        return match.group(1)
    else:
        return None


def split_image_text_types(docs):
    """
    Splits documents into images, texts, and summaries based on their content.

    Args:
        docs (list): A list of Document objects.

    Returns:
        dict: A dictionary with keys 'images', 'texts', and 'summary', containing the respective content.
    """
    global sources, count_restriction
    count_restriction = 0
    texts = []
    summary = []
    b64_images = []
    for doc in docs:
        if isinstance(doc, Document):
            # file_permission = doc.metadata["DeliverablePermissions"]
            # file_permission_list = [p for p in file_permission.split(';') if p.strip()]
            # if not file_permission_list or any(
            #     element in file_permission_list for element in user_permissions
            # ):
            doc_content = json.loads(doc.page_content)
            link = doc.metadata["source"]
            slide_number = doc.metadata.get("slide_number", "")

            metadata = doc.metadata.get("deliverables_list_metadata")
            title = process_metadata(metadata)
            _, ext = os.path.splitext(title)

            if ext.lower() in [".pdf", ".doc", ".docx"]:
                slide_number = slide_number.replace("slide_", "Page ")
            else:
                slide_number = slide_number.replace("slide_", "Slide ")

            existing_key = next(
                (k for k in sources.keys() if k.startswith(title)), None
            )

            if existing_key:
                formatted_name = f", {slide_number}" if slide_number else ""
                new_key = existing_key + formatted_name
                sources[new_key] = sources.pop(existing_key)
            else:
                new_key = f"{title} {'-' if slide_number else ''} {slide_number}"
                sources[new_key] = link

            if looks_like_base64(doc_content["content"]):
                resized_image = resize_base64_image(
                    doc_content["content"], size=(512, 512)
                )
                b64_images.append(resized_image)
                summary.append(doc_content["summary"])
            else:
                texts.append(doc_content["content"])
        # else:
        #     count_restriction += 1
        #     continue

    return {"images": b64_images, "texts": texts, "summary": summary}


def generate_reason(reason):

    prompt_text = prompts["generate_reason"]

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = {"reason": lambda x: x} | prompt | llm_gpt

    reason_generation = chain.invoke(reason)

    return reason_generation.content


def img_prompt_func(data_dict):
    """
    Creates a formatted message for the AI model based on the provided data.

    Args:
        data_dict (dict): A dictionary containing context information.

    Returns:
        list: A list containing the formatted message for the AI model.
    """
    formatted_summary = ""
    reason = data_dict["context"]["reason"]
    type_of_doc = data_dict["context"]["type_of_doc"]
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    chatHistory = format_chat_history(data_dict["context"]["chatHistory"])
    feedback = ""
    messages = []

    if data_dict["context"]["image_present"] == "Yes":
        if data_dict["context"]["images"]:
            for image in data_dict["context"]["images"]:
                image_message = {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                }
                messages.append(image_message)

    else:
        formatted_summary = "\n".join(data_dict["context"]["summary"])

    if reason:
        feedback = generate_reason(
            f"RAG app generated the response on the basis of provided document context but user gave the feedback - {reason}"
        )

    if type_of_doc == "normal":
        prompt_text = prompts["text_message_normal_rag"]
    else:
        prompt_text = prompts["text_message_summary_rag"]

    question = data_dict.get("question", "No question provided")
    reason_text = (
        f"Last Time the answer was not good and the reason shared by user is: {feedback}. Generate Accordingly"
        if reason
        else ""
    )
    original_content = f"Original content: {formatted_texts}" if formatted_texts else ""
    summary_content = (
        f"Summary content: {formatted_summary}" if formatted_summary else ""
    )
    previous_conversation = (
        f"Previous conversation: {chatHistory}" if chatHistory else ""
    )

    filled_prompt = prompt_text.format(
        question=question,
        reason=reason_text,
        original_content=original_content,
        summary_content=summary_content,
        previous_conversation=previous_conversation,
    )

    text_message = {"type": "text", "text": filled_prompt}

    messages.append(text_message)

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(
    retriever, llm_to_use, image, filters, chatHistory, reason, type_of_doc
):
    """
    Creates a multi-modal RAG chain for processing queries.

    Args:
        retriever (object): The retriever object for fetching documents.
        llm_to_use (object): The language model to use.
        image (str): Indicator of whether images are present.
        filters (list): Filters to apply to the search.
        chatHistory (list): Previous chat history.
        reason (str): Reason for regeneration, if any.
        type_of_doc (str): The type of document ('normal' or otherwise).

    Returns:
        object: The configured RAG chain.
    """

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "image_present": image,
            "filters": filters,
            "chatHistory": chatHistory,
            "reason": reason,
            "type_of_doc": type_of_doc,
        }
        return context

    chain = (
        {
            "context": retriever
            | RunnableLambda(split_image_text_types)
            | RunnableLambda(combined_context),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | llm_to_use
        | StrOutputParser()
    )

    return chain


def create_new_title(question):
    """
    Generates a concise and informative title based on the user's question.

    Args:
        question (str): The user question.

    Returns:
        str: The generated title.
    """

    prompt_text = prompts["create_new_title"]

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_title = {"element": lambda x: x} | prompt | llm_gpt
    response = new_title.invoke(question)

    return response.content


def formulate_question(question):
    """
    Generates a concise and informative title based on the user's question.

    Args:
        question (str): The user question.

    Returns:
        str: The generated title.
    """

    prompt_text = prompts["formulate_question"]

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_question = {"element": lambda x: x} | prompt | llm_gpt
    response = new_question.invoke(question)

    return response.content


def update_chat(message: Message, ai_text: str, chat_id: str, flag: bool, sources=None):
    """
    Updates a chat thread by adding or removing messages.

    Args:
        message (Message): The message object to update.
        ai_text (str): The AI-generated response.
        chat_id (str): The ID of the chat thread.
        flag (bool): Flag indicating whether to regenerate messages.
        sources (optional): Sources related to the message.

    Returns:
        str: The ID of the updated message.
    """
    message_id = None

    if message.regenerate == "Yes" or flag == True:
        collection_chat.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$pop": {"chats": 1},
                "$set": {"updatedAt": datetime.utcnow()},
            },
        )

    if message.feedbackRegenerate == "Yes":
        chat = collection_chat.find_one({"_id": ObjectId(chat_id)})
        if chat and "chats" in chat and len(chat["chats"]) > 0:
            last_chat_index = len(chat["chats"]) - 1
            collection_chat.update_one(
                {
                    "_id": ObjectId(chat_id),
                    f"chats.{last_chat_index}.flag": {"$exists": False},
                },
                {
                    "$set": {
                        f"chats.{last_chat_index}.flag": True,
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )

    new_chat = {
        "_id": ObjectId(),
        "user": message.reason if message.reason else message.question,
        "ai": ai_text,
        "sources": sources,
    }

    update_fields = {
        "$push": {"chats": new_chat},
        "$set": {
            "updatedAt": datetime.utcnow(),
            "filtersMetadata": (
                message.filtersMetadata if message.filtersMetadata else []
            ),
            "isGPT": message.isGPT,
        },
    }

    collection_chat.update_one({"_id": ObjectId(chat_id)}, update_fields)

    chat = collection_chat.find_one({"_id": ObjectId(chat_id)})

    if chat and "chats" in chat:
        message_id = chat["chats"][-1]["_id"]

    return message_id


def create_search_kwargs(filters):
    """
    Creates search kwargs for filtering a ChromaDB collection.
    Args:
        filters (list): List of filter dictionaries.
            Each dictionary should have a key (field name) and a list of values.
    Returns:
        dict: The search kwargs for filtering.
    """

    if isinstance(filters, str):
        filter_condition = {"Title": filters}
        search_kwargs = {"filter": filter_condition}
        return search_kwargs

    search_kwargs = {"filter": {"Title": {"$in": filters}}}

    return search_kwargs


def question_intent(question, chatHistory):
    """
    Identifies the intent of the user question based on chat history.

    Args:
        question (str): The user question.
        chatHistory (list): Previous chat history.

    Returns:
        str: The identified intent keyword ('normal_rag', 'summary_rag', or 'direct_response').
    """
    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = prompts["question_intent"]
    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_gpt
    )

    intent = chain.invoke(question)

    return intent.content


def standalone_question(question, chatHistory):
    """
    Forms a standalone question based on the user's question and chat history.

    Args:
        question (str): The user question.
        chatHistory (list): Previous chat history.

    Returns:
        str: The standalone question.
    """
    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = prompts["standalone_question"]

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_gpt
    )

    new_question = chain.invoke(question)

    return new_question.content


def create_new_title_chat(message: Message):
    """
    Creates a new chat thread with a generated title based on the user's question.

    Args:
        message (Message): The message object containing user information and question.

    Returns:
        str: The ID of the newly created chat thread.
    """
    title = create_new_title(message.question)
    new_chat = {
        "userEmailId": message.userEmailId,
        "title": title,
        "chats": [
            {
                "_id": ObjectId(),
                "user": message.question,
            }
        ],
        "filtersMetadata": (message.filtersMetadata if message.filtersMetadata else []),
        "isGPT": message.isGPT,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    inserted_chat = collection_chat.insert_one(new_chat)
    chat_id = inserted_chat.inserted_id

    return chat_id


@app.on_event("startup")
def startup_db_client():
    global collection_chat
    client = MongoClient(os.environ["MONGO_API_KEY"])
    db = client[os.environ["MONGODB_COLLECTION"]]
    collection_chat = db["chats"]


@app.get("/fast")
def read_root():
    return {"message": "Welcome to FastAPI"}


@app.post("/fast")
async def generate_content(message: Message):
    # Function to create a content generator which streams the response only from the summary retriever
    async def content_generator_summary(question: str) -> AsyncGenerator[str, None]:
        try:
            global user_permissions, sources
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            search_kwargs = {}

            if message.anonymousFilter:
                search_kwargs = create_search_kwargs(message.anonymousFilter)
            elif message.filters:
                search_kwargs = create_search_kwargs(message.filters)

            retriever = MultiVectorRetriever(
                vectorstore=vectorstore_gpt_summary,
                docstore=loaded_docstore_gpt_summary,
                id_key="GatesVentures_Scientia_Summary",
                search_kwargs=search_kwargs,
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_gpt,
                "No",
                message.filters,
                message.chatHistory,
                message.reason,
                "summary",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if (
                "I am not able to provide a response as it is not there in the context."
                in ai_text
            ):
                sources.clear()

            if not message.filters:
                if count_restriction == 4:
                    sources.update({"Note: This is a Restricted Answer": ""})

            message_id = update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                sources,
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    # Function to create a content generator which streams the response only from the normal retriever
    async def content_generator(question: str) -> AsyncGenerator[str, None]:
        try:
            global user_permissions, sources
            user_permissions = get_user_permissions(message.userLookupId)
            sources.clear()
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            search_kwargs = {}

            if message.anonymousFilter:
                search_kwargs = create_search_kwargs(message.anonymousFilter)
            elif message.filters:
                search_kwargs = create_search_kwargs(message.filters)

            retriever = MultiVectorRetriever(
                vectorstore=vectorstore_gpt,
                docstore=loaded_docstore_gpt,
                id_key="GatesVentures_Scientia",
                search_kwargs=search_kwargs,
            )

            chain = multi_modal_rag_chain_source(
                retriever,
                llm_gpt,
                message.image,
                message.filters,
                message.chatHistory,
                message.reason,
                "normal",
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            if (
                "I am not able to provide a response as it is not there in the context."
                in ai_text
            ):
                sources.clear()

            if not message.filters:
                if count_restriction == 4:
                    sources.update({"Note: This is a Restricted Answer": ""})

            message_id = update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                sources,
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": sources})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    # Function to create a content generator which streams the response only from the GPT3.5
    async def content_generator_GPT(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            model = AzureChatOpenAI(
                api_key=os.environ["AZURE_OPENAI_API_KEY"],
                openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_35"],
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            )

            prompt_text = prompts["content_generator_GPT"]

            prompt = ChatPromptTemplate.from_template(prompt_text)

            chain = (
                {
                    "chat_history": lambda _: formatted_chat_history,
                    "question": lambda x: x,
                }
                | prompt
                | model
                | StrOutputParser()
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            message_id = update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                {"This response is generated by ChatGPT": ""},
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps(
                {
                    "type": "sources",
                    "content": {"This response is generated by ChatGPT": ""},
                }
            )
        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    # Function to create a content generator which streams the response only when the user asked a general question
    async def content_generator_salutation(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
            ai_text = ""
            chat_id = None
            flag = False

            if not message.chatId:
                chat_id = create_new_title_chat(message)
                flag = True
                yield json.dumps({"type": "chatId", "content": str(chat_id)})

            prompt_text = prompts["content_generator_salutation"]

            prompt = ChatPromptTemplate.from_template(prompt_text)

            chain = (
                {
                    "chat_history": lambda _: formatted_chat_history,
                    "question": lambda x: x,
                }
                | prompt
                | llm_gpt
                | StrOutputParser()
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

            message_id = update_chat(
                message, ai_text, str(chat_id) if chat_id else message.chatId, flag
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": None})

        except Exception as e:
            logging.error(f"An Error Occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    try:
        # Form a standalone question based on chat history
        question = (
            standalone_question(message.question, message.chatHistory)
            if message.chatHistory
            else (message.question.strip())
        )

        if message.isGPT:
            # If a user specifically asked for the response from the GPT3.5
            generator = content_generator_GPT(question)
        else:
            # Identify user question intent
            question_intent_response = question_intent(question, message.chatHistory)

            # If the user question is a general question
            if "direct_response" in question_intent_response:
                generator = content_generator_salutation(question)
            # If the user question is from normal RAG data
            elif "normal_rag" in question_intent_response:
                generator = content_generator(question)
            # If the user question is regarding summary of a particular document
            elif "summary_rag" in question_intent_response:
                generator = content_generator_summary(question)
        # Returns the streaming response
        return StreamingResponse(generator, media_type="application/json")
    except Exception as e:
        logging.error(f"An Error Occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.on_event("shutdown")
def shutdown_db_client():
    global collection_chat
    if collection_chat:
        collection_chat.database.client.close()






aiohappyeyeballs==2.4.0
aiohttp==3.10.5
aiosignal==1.3.1
annotated-types==0.7.0
anyio==4.4.0
asgiref==3.8.1
attrs==24.2.0
backoff==2.2.1
bcrypt==4.2.0
blinker==1.8.2
build==1.2.1
cachetools==5.5.0
certifi==2024.8.30
charset-normalizer==3.3.2
chroma-hnswlib==0.7.3
chromadb==0.5.0
click==8.1.7
coloredlogs==15.0.1
dataclasses-json==0.6.7
Deprecated==1.2.14
distro==1.9.0
dnspython==2.6.1
fastapi==0.112.0
filelock==3.15.4
Flask==3.0.3
flatbuffers==24.3.25
frozenlist==1.4.1
fsspec==2024.6.1
google-auth==2.34.0
googleapis-common-protos==1.65.0
greenlet==3.0.3
grpcio==1.66.1
gunicorn==23.0.0
h11==0.14.0
httpcore==1.0.5
httptools==0.6.1
httpx==0.27.2
huggingface-hub==0.24.6
humanfriendly==10.0
idna==3.8
importlib_metadata==8.4.0
importlib_resources==6.4.4
itsdangerous==2.2.0
Jinja2==3.1.4
jiter==0.5.0
jsonpatch==1.33
jsonpointer==3.0.0
kubernetes==30.1.0
langchain==0.2.12
langchain-community==0.2.11
langchain-core==0.2.29
langchain-ollama==0.1.1
langchain-openai==0.1.20
langchain-text-splitters==0.2.2
langsmith==0.1.107
markdown-it-py==3.0.0
MarkupSafe==2.1.5
marshmallow==3.22.0
mdurl==0.1.2
mmh3==4.1.0
monotonic==1.6
mpmath==1.3.0
multidict==6.0.5
mypy-extensions==1.0.0
numpy==1.26.4
oauthlib==3.2.2
ollama==0.3.2
onnxruntime==1.19.0
openai==1.43.0
opentelemetry-api==1.27.0
opentelemetry-exporter-otlp-proto-common==1.27.0
opentelemetry-exporter-otlp-proto-grpc==1.27.0
opentelemetry-instrumentation==0.48b0
opentelemetry-instrumentation-asgi==0.48b0
opentelemetry-instrumentation-fastapi==0.48b0
opentelemetry-proto==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-semantic-conventions==0.48b0
opentelemetry-util-http==0.48b0
orjson==3.10.7
overrides==7.7.0
packaging==24.1
pandas==2.2.2
pillow==10.4.0
posthog==3.6.0
protobuf==4.25.4
pyasn1==0.6.0
pyasn1_modules==0.4.0
pydantic==2.8.2
pydantic_core==2.20.1
Pygments==2.18.0
pymongo==4.8.0
PyPika==0.48.9
pyproject_hooks==1.1.0
pysqlite3-binary==0.5.3.post1
python-dateutil==2.9.0.post0
python-dotenv==1.0.1
pytz==2024.1
PyYAML==6.0.2
regex==2024.7.24
requests==2.32.3
requests-oauthlib==2.0.0
rich==13.8.0
rsa==4.9
shellingham==1.5.4
six==1.16.0
sniffio==1.3.1
SQLAlchemy==2.0.32
starlette==0.37.2
sympy==1.13.2
tenacity==8.5.0
tiktoken==0.7.0
tokenizers==0.20.0
tqdm==4.66.5
typer==0.12.5
typing-inspect==0.9.0
typing_extensions==4.12.2
tzdata==2024.1
urllib3==2.2.2
uvicorn==0.30.5
uvloop==0.20.0
watchfiles==0.24.0
websocket-client==1.8.0
websockets==13.0.1
Werkzeug==3.0.4
wrapt==1.16.0
yarl==1.9.4
zipp==3.20.1








annotated-types==0.7.0
anyio==4.4.0
certifi==2024.8.30
charset-normalizer==3.3.2
click==8.1.7
fastapi==0.112.2
filelock==3.15.4
fsspec==2024.6.1
gunicorn==23.0.0
h11==0.14.0
huggingface-hub==0.24.6
idna==3.8
Jinja2==3.1.4
MarkupSafe==2.1.5
mpmath==1.3.0
networkx==3.3
numpy==2.1.0
nvidia-cublas-cu12==12.1.3.1
nvidia-cuda-cupti-cu12==12.1.105
nvidia-cuda-nvrtc-cu12==12.1.105
nvidia-cuda-runtime-cu12==12.1.105
nvidia-cudnn-cu12==8.9.2.26
nvidia-cufft-cu12==11.0.2.54
nvidia-curand-cu12==10.3.2.106
nvidia-cusolver-cu12==11.4.5.107
nvidia-cusparse-cu12==12.1.0.106
nvidia-nccl-cu12==2.20.5
nvidia-nvjitlink-cu12==12.6.68
nvidia-nvtx-cu12==12.1.105
packaging==24.1
pillow==10.4.0
pydantic==2.8.2
pydantic_core==2.20.1
python-multipart==0.0.9
PyYAML==6.0.2
regex==2024.7.24
requests==2.32.3
safetensors==0.4.4
sniffio==1.3.1
starlette==0.38.4
sympy==1.13.2
timm==1.0.9
tokenizers==0.19.1
torch==2.3.1
torchvision==0.18.1
tqdm==4.66.5
transformers==4.41.2
triton==2.3.1
typing_extensions==4.12.2
urllib3==2.2.2
uvicorn==0.30.6






import os
import logging

from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain_openai import AzureChatOpenAI
from langchain.docstore.document import Document
from langchain.chains.summarize import load_summarize_chain

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    max_retries=20,
)

map_prompt_template = """
                      Write a detailed and elaborated summary of the following text that includes the main points and any important details.
                      Aim for a summary length of approximately 1000 words
                      {text}
                      """

map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])


combine_prompt_template = """
                      Write a comprehensive summary of the following text delimited by triple backquotes.
                      Aim for a summary length of approximately 500 words with out missing the important information the text.
                      ```{text}```
                      COMPREHENSIVE SUMMARY:
                      """

combine_prompt = PromptTemplate(
    template=combine_prompt_template, input_variables=["text"]
)


summary_chain = load_summarize_chain(
    llm_gpt,
    chain_type="map_reduce",
    map_prompt=map_prompt,
    combine_prompt=combine_prompt,
)

def create_summary(batch_summary):
    try:
        accumulated_value = " ".join(batch_summary.values())
        doc = Document(page_content=accumulated_value)
        summary_result = summary_chain.invoke([doc])
        logging.info("Summary created successfully.")
        return summary_result['output_text']
    except Exception as e:
        logging.error(f"Failed to create summary. {e}")
        return None






import os
import pickle
import logging

import chromadb
import pandas as pd
from pymongo import MongoClient
from chromadb.config import Settings

# Configure logging to log both to a file and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Initialize ChromaDB client settings, disabling anonymized telemetry.
settings = Settings(anonymized_telemetry=False)

# Create an HTTP client for ChromaDB, connecting to the specified host and port.
CHROMA_CLIENT = chromadb.HttpClient(
    host=os.environ["CHROMADB_HOST"], port=8000, settings=settings
)

# Retrieve or create collections in ChromaDB for storing normal and summary data.
collection_normal = CHROMA_CLIENT.get_or_create_collection(
    name="GatesVentures_Scientia"
)
collection_summary = CHROMA_CLIENT.get_or_create_collection(
    name="GatesVentures_Scientia_Summary"
)

parent_dir = os.path.dirname(os.getcwd())

client = MongoClient(os.environ["MONGO_API_KEY"])
# Select the database and collection within MongoDB for storing questions.
db = client[os.environ["MONGODB_COLLECTION"]]
collection_question = db["questions"]


def get_name_by_id(csv_file, id):
    df = pd.read_csv(csv_file)
    name = df.loc[df["ID"] == id, "Name"]
    return os.path.splitext(name)[0]


def load_docstore(path):
    """
    Load a docstore (a dictionary-like data structure) from a pickle file.

    Parameters:
    path (str): The file path to the pickle file.

    Returns:
    dict or None: The loaded docstore if the file exists, otherwise None.
    """
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return None


def save_docstore(docstore, path):
    """
    Save a docstore to a pickle file.

    Parameters:
    docstore (dict): The docstore to save.
    path (str): The file path where the pickle file will be saved.
    """
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def delete_from_collection(collection, file_id, docstore_key):
    """
    Delete documents from a specific ChromaDB collection and gather metadata for further deletion.

    Parameters:
    collection: The ChromaDB collection from which documents will be deleted.
    file_id (str): The ID of the document to delete.
    docstore_key (str): The key used to extract metadata from the collection.

    Returns:
    list: A list of metadata IDs that need to be deleted from the docstore.
    """
    ids_to_delete = []

    name = get_name_by_id("deliverables_list_unfiltered.csv", file_id)
    collection_question.delete_one({"documentName": name})

    # Retrieve documents matching the given file_id from the collection.
    collection_result = collection.get(where={"id": file_id})

    # Delete the documents from the collection.
    collection.delete(where={"id": file_id})

    # Extract and store metadata IDs for deletion from the docstore.
    for metadata in collection_result["metadatas"]:
        ids_to_delete.append(metadata[docstore_key])

    return ids_to_delete


def delete_from_vectostore(file_id_list):
    """
    Delete documents from both the ChromaDB collections and the docstores.

    Parameters:
    file_id_list (list): A list of document IDs to delete from the collections.
    """
    try:
        # Load the docstores from their respective pickle files.
        docstore_normal = load_docstore(
            os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl")
        )
        docstore_summary = load_docstore(
            os.path.join(
                parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
            ),
        )

        # Initialize lists to store metadata IDs that need deletion.
        normal_metadata = []
        summary_metadata = []

        # Iterate through each file ID and delete the corresponding documents.
        for file_id in file_id_list:
            normal_metadata.extend(
                delete_from_collection(
                    collection_normal, file_id, "GatesVentures_Scientia"
                )
            )
            summary_metadata.extend(
                delete_from_collection(
                    collection_summary, file_id, "GatesVentures_Scientia_Summary"
                )
            )

        # Delete the corresponding metadata from the docstores.
        docstore_normal.mdelete(normal_metadata)
        docstore_summary.mdelete(summary_metadata)

        # Save the updated docstores back to their pickle files.
        save_docstore(
            docstore_normal,
            os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl"),
        )
        save_docstore(
            docstore_summary,
            os.path.join(
                parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
            ),
        )

        logging.info("Document deleted successfully.")

    except Exception as e:
        # Log an error if the deletion process fails.
        logging.error("Failed to delete the doc.")







import os
import csv
import shutil
import logging
from datetime import datetime, timedelta

import pandas as pd
from dotenv import load_dotenv
from office365.graph_client import GraphClient

import sharepoint_file_acquisition
from ingest_failed_document import ingest_files

load_dotenv()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

site_url = os.getenv("SHAREPOINT_SITE")
drive_id = os.getenv("DRIVE_ID")
parent_dir = os.path.dirname(os.getcwd())
express_folder = os.path.join(parent_dir, "express", "csv")
fast_folder = os.path.join(parent_dir, "fast", "csv")

token, token_expires_at = sharepoint_file_acquisition.acquire_token_func()
client = GraphClient(lambda: token)

if not os.path.exists('failed_files_to_ingest'):
    os.makedirs('failed_files_to_ingest')

def save_to_csv(data, csv_filename, additional_folders=None):
    """
    Saves data to a CSV file and optionally copies it to additional folders.

    Args:
        data (list): List of dictionaries representing rows of data.
        csv_filename (str): The path to the CSV file to save.
        additional_folders (list): List of folder paths to copy the CSV file to.
    """
    if data:
        with open(csv_filename, newline="", mode="w", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

        if additional_folders:
            for folder in additional_folders:
                destination = os.path.join(folder, os.path.basename(csv_filename))
                shutil.copy2(csv_filename, destination)

        logging.info(f"CSV file {csv_filename} created.")

def stream_file_content(
    site_id,
    drive_id,
    file_id,
    files_metadata,
    deliverables_list_metadata,
):
    global token, token_expires_at, client
    if token_expires_at < datetime.now() + timedelta(minutes=50):
        logging.info("Refreshing access token...")
        token, token_expires_at = sharepoint_file_acquisition.acquire_token_func()
        client = GraphClient(lambda: token)

    if file_id not in files_metadata:
        logging.info("File not found.")
        return

    target_folder = "failed_files_to_ingest"
    file_name = files_metadata[file_id]["Name"]

    logging.info(f"Downloading file: {file_name}...")
    response = (
        client.sites[site_id]
        .drives[drive_id]
        .items[file_id]
        .get_content()
        .execute_query()
    )

    with open(os.path.join(target_folder, file_name), "wb") as file:
        file.write(response.value)
    logging.info(f"{file_name} saved.")

    logging.info(f"Ingesting file: {file_name}...")
    ingest_files(
        file_name, files_metadata[file_id], deliverables_list_metadata[file_name]
    )
    os.remove(os.path.join(target_folder, file_name))

def failed_files_ingestion():
    try:

        failed_files_csv = pd.read_csv("failed_files_1.csv")
        failed_files_ids = failed_files_csv["ID"]

        site_id = sharepoint_file_acquisition.get_site_id(client, site_url)

        files_metadata = sharepoint_file_acquisition.load_existing_csv_data(
            "files_metadata.csv", "ID"
        )
        deliverables_list_metadata = sharepoint_file_acquisition.load_existing_csv_data(
            "deliverables_list_unfiltered.csv", "FileLeafRef"
        )

        for index, row in failed_files_csv.iterrows():
            file_id = row["ID"]
            try:
                # Attempt to process the file.
                stream_file_content(
                    site_id,
                    drive_id,
                    file_id,
                    files_metadata,
                    deliverables_list_metadata,
                )
                # If successful, log the success.
                logging.info(f"Successfully processed file {file_id}")

                # Remove the row corresponding to the successfully processed file.
                failed_files_csv.drop(index, inplace=True)

                # Save the updated CSV file after each successful processing.
                failed_files_csv.to_csv("failed_files_1.csv", index=False)
                logging.info(f"File {file_id} removed from 'failed_files.csv'.")
            except Exception as e:
                # Log an error for files that fail to process.
                logging.error(f"Failed to process file {file_id}: {e}")

        sharepoint_file_acquisition.update_and_save_docstore(
             "docstores_normal_rag",
             os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl"),
             os.path.join(os.getcwd(), "backup", "normal"),
         )
        sharepoint_file_acquisition.update_and_save_docstore(
             "docstores_summary_rag",
             os.path.join(
                 parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
             ),
             os.path.join(os.getcwd(), "backup", "summary"),
         )

        if os.path.exists("failed_files_2.csv"):
            failed_files_csv = pd.read_csv("failed_files_2.csv")
            deliverables_list_csv = pd.read_csv("deliverables_list_unfiltered.csv")
            name_set = set(failed_files_csv["Name"].astype(str))

            deliverables_list_filtered_csv = deliverables_list_csv[
                ~deliverables_list_csv["FileLeafRef"].astype(str).isin(name_set)
            ]

            filtered_data = deliverables_list_filtered_csv.to_dict(orient="records")

            save_to_csv(filtered_data, "deliverables_list.csv", additional_folders=[express_folder,fast_folder])

        if os.path.exists('failed_files_to_ingest'):
            shutil.rmtree('failed_files_to_ingest')
    except Exception as e:
        logging.error(f"An error occurred: {e}")


if __name__ == "__main__":
    failed_files_ingestion()







import os
import csv
import shutil
import logging
import subprocess

from pdfplumber import open as open_pdf

from pdf_doc_docx_ingestion import pdf_ingestion_MV
from ppt_pptx_ingestion import pdf_ppt_ingestion_MV

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

output_path = os.path.join(os.getcwd(), "output")
output_path_table = os.path.join(os.getcwd(), "table")
output_path_figure = os.path.join(os.getcwd(), "figures")

folders = [output_path, output_path_table, output_path_figure]

CONVERSION_TIMEOUT = 180

def convert_file_to_pdf(fpath, fname):
    try:
        pdf_fname = os.path.splitext(fname)[0] + ".pdf"
        pdf_file = os.path.join(fpath, pdf_fname)
        subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                fpath,
                os.path.join(fpath, fname),
            ],
            timeout=CONVERSION_TIMEOUT,
        )
        if os.path.exists(pdf_file):
            logging.info("PDF File Created")
            return True
        else:
            logging.error("PDF file was not created.")
            return False

    except subprocess.TimeoutExpired:
        logging.error(f"Conversion of {fname} timed out.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

    return False


def is_pdf(fpath, fname):
    try:
        with open_pdf(os.path.join(fpath, fname)) as pdf:
            page_layouts = set((page.width, page.height) for page in pdf.pages)

            aspect_ratios = [width / height for width, height in page_layouts]

            total_pages = len(aspect_ratios)
            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = total_pages - landscape_pages

            if len(set(page_layouts)) == 1:
                if aspect_ratios[0] > 1:
                    logging.info("PPT converted to PDF")
                    return False
                else:
                    logging.info("Likely Original PDF")
                    return True

            if landscape_pages == total_pages:
                logging.info("PPT Converted to PDF")
                return False
            elif portrait_pages == total_pages:
                logging.info("Likely Original PDF")
                return True
            else:
                landscape_ratio = landscape_pages / portrait_pages
                if landscape_ratio > 0.7:
                    logging.info("PPT Converted to PDF")
                    return False
                elif landscape_ratio < 0.3:
                    logging.info("Likely Original PDF")
                    return True
                else:
                    logging.info("Mixed Layout (undetermined origin)")
                    return False

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False

def delete_files_in_folder(folder_path):
    """
    Delete all files in the specified folder, but keep the folder itself.

    Args:
    folder_path (str): Path to the folder whose contents should be deleted

    """
    # Check if the folder exists
    if not os.path.exists(folder_path):
        print(f"The folder {folder_path} does not exist.")
        return False

    # Iterate over all items in the folder
    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)

        if os.path.isfile(item_path):
            os.unlink(item_path)
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)

    print(f"All contents of {folder_path} have been deleted.")


def ingest_files(file, files_metadata, deliverables_list_metadata):

    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(
        parent_folder, current_folder, "files_to_ingest"
    )
    failed_files = []

    if os.path.exists(os.path.join(files_to_ingest_folder, file)):

        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        original_file_path = os.path.join(files_to_ingest_folder, file)
        lower_case_file = base_name + lower_ext
        lower_case_path = os.path.join(files_to_ingest_folder, lower_case_file)

        file_was_renamed = False

        if ext.isupper():
            os.rename(original_file_path, lower_case_path)
            file_was_renamed = True
        else:
            lower_case_file = file

        try:
            success = False
            ingestion_error = None  # Initialize ingestion_error

            if lower_case_file.endswith(".pdf"):
                if is_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(
                            ingestion_error
                        )  # Raise the returned error message
                else:
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                logging.info(f"{lower_case_file} processed successfully")

            elif lower_case_file.endswith((".ppt", ".pptx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("PPT/PPTX Conversion failed")

            elif lower_case_file.endswith((".doc", ".docx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("DOC/DOCX Conversion failed")

        except Exception as e:
            logging.error(f"Error Processing : {e}")
            failed_files.append(
                {**files_metadata, "IngestionError": ingestion_error or str(e)}
            )
            delete_files_in_folder(files_to_ingest_folder)

        if file_was_renamed:
            os.rename(lower_case_path, original_file_path)

    failed_file_path = os.path.join(parent_folder, current_folder, "failed_files_1.csv")
    with open(failed_file_path, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(failed_file_path).st_size == 0:
            csv_writer.writerow(
                ["ID", "Name", "Path", "WebUrl", "CreatedDateTime", "IngestionError"]
            )
        for failed_file in failed_files:
            csv_writer.writerow(
                [
                    failed_file.get("ID", ""),
                    failed_file.get("Name", ""),
                    failed_file.get("Path", ""),
                    failed_file.get("WebUrl", ""),
                    failed_file.get("CreatedDateTime", ""),
                    failed_file.get("IngestionError", ""),
                ]
            )

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")







import os
import csv
import shutil
import logging
import subprocess

from pdfplumber import open as open_pdf

from pdf_doc_docx_ingestion import pdf_ingestion_MV
from ppt_pptx_ingestion import pdf_ppt_ingestion_MV

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

output_path = os.path.join(os.getcwd(), "output")
output_path_table = os.path.join(os.getcwd(), "table")
output_path_figure = os.path.join(os.getcwd(), "figures")

folders = [output_path, output_path_table, output_path_figure]

CONVERSION_TIMEOUT = 180

def convert_file_to_pdf(fpath, fname):
    try:
        pdf_fname = os.path.splitext(fname)[0] + ".pdf"
        pdf_file = os.path.join(fpath, pdf_fname)
        subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                fpath,
                os.path.join(fpath, fname),
            ],
            timeout=CONVERSION_TIMEOUT,
        )
        if os.path.exists(pdf_file):
            logging.info("PDF File Created")
            return True
        else:
            logging.error("PDF file was not created.")
            return False

    except subprocess.TimeoutExpired:
        logging.error(f"Conversion of {fname} timed out.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

    return False


def is_pdf(fpath, fname):
    try:
        with open_pdf(os.path.join(fpath, fname)) as pdf:
            page_layouts = set((page.width, page.height) for page in pdf.pages)

            aspect_ratios = [width / height for width, height in page_layouts]

            total_pages = len(aspect_ratios)
            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = total_pages - landscape_pages

            if len(set(page_layouts)) == 1:
                if aspect_ratios[0] > 1:
                    logging.info("PPT converted to PDF")
                    return False
                else:
                    logging.info("Likely Original PDF")
                    return True

            if landscape_pages == total_pages:
                logging.info("PPT Converted to PDF")
                return False
            elif portrait_pages == total_pages:
                logging.info("Likely Original PDF")
                return True
            else:
                landscape_ratio = landscape_pages / portrait_pages
                if landscape_ratio > 0.7:
                    logging.info("PPT Converted to PDF")
                    return False
                elif landscape_ratio < 0.3:
                    logging.info("Likely Original PDF")
                    return True
                else:
                    logging.info("Mixed Layout (undetermined origin)")
                    return False

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False

def delete_files_in_folder(folder_path):
    """
    Delete all files in the specified folder, but keep the folder itself.

    Args:
    folder_path (str): Path to the folder whose contents should be deleted

    """
    # Check if the folder exists
    if not os.path.exists(folder_path):
        print(f"The folder {folder_path} does not exist.")
        return False

    # Iterate over all items in the folder
    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)

        if os.path.isfile(item_path):
            os.unlink(item_path)
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)

    print(f"All contents of {folder_path} have been deleted.")


def ingest_files(file, files_metadata, deliverables_list_metadata):

    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(
        parent_folder, current_folder, "failed_files_to_ingest"
    )
    failed_files = []

    if os.path.exists(os.path.join(files_to_ingest_folder, file)):

        base_name, ext = os.path.splitext(file)
        lower_ext = ext.lower()
        original_file_path = os.path.join(files_to_ingest_folder, file)
        lower_case_file = base_name + lower_ext
        lower_case_path = os.path.join(files_to_ingest_folder, lower_case_file)

        file_was_renamed = False

        if ext.isupper():
            os.rename(original_file_path, lower_case_path)
            file_was_renamed = True
        else:
            lower_case_file = file

        try:
            success = False
            ingestion_error = None  # Initialize ingestion_error

            if lower_case_file.endswith(".pdf"):
                if is_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(
                            ingestion_error
                        )  # Raise the returned error message
                else:
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        lower_case_file, files_metadata, deliverables_list_metadata
                    )
                    if not success:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                logging.info(f"{lower_case_file} processed successfully")

            elif lower_case_file.endswith((".ppt", ".pptx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ppt_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("PPT/PPTX Conversion failed")

            elif lower_case_file.endswith((".doc", ".docx")):
                pdf_name = os.path.splitext(lower_case_file)[0] + ".pdf"
                pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

                if convert_file_to_pdf(files_to_ingest_folder, lower_case_file):
                    success, ingestion_error = pdf_ingestion_MV(
                        pdf_name, files_metadata, deliverables_list_metadata
                    )
                    if success:
                        logging.info(f"{lower_case_file} processed successfully")
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                            logging.info("PDF File Removed")
                    else:
                        for folder_path in folders:
                            if os.path.exists(folder_path):
                                shutil.rmtree(folder_path)
                        raise Exception(ingestion_error)
                else:
                    raise Exception("DOC/DOCX Conversion failed")

        except Exception as e:
            logging.error(f"Error Processing : {e}")
            failed_files.append(
                {**files_metadata, "IngestionError": ingestion_error or str(e)}
            )
            delete_files_in_folder(files_to_ingest_folder)

        if file_was_renamed:
            os.rename(lower_case_path, original_file_path)

    failed_file_path = os.path.join(parent_folder, current_folder, "failed_files_2.csv")
    with open(failed_file_path, "a", newline="") as csvfile:
        csv_writer = csv.writer(csvfile)
        if os.stat(failed_file_path).st_size == 0:
            csv_writer.writerow(
                ["ID", "Name", "Path", "WebUrl", "CreatedDateTime", "IngestionError"]
            )
        for failed_file in failed_files:
            csv_writer.writerow(
                [
                    failed_file.get("ID", ""),
                    failed_file.get("Name", ""),
                    failed_file.get("Path", ""),
                    failed_file.get("WebUrl", ""),
                    failed_file.get("CreatedDateTime", ""),
                    failed_file.get("IngestionError", ""),
                ]
            )

    if failed_files:
        logging.info(f"Failed files written to {failed_file_path}")
    else:
        logging.info("No failed files to report")







import os
import re
import io
import json
import uuid
import shutil
import pickle
import base64
import logging
import concurrent.futures

import tiktoken
import requests
import chromadb
from dotenv import load_dotenv
from PIL import Image, ImageFile
from chromadb.config import Settings
from pdfplumber import open as open_pdf
from pdf2image import convert_from_path
from langchain.storage import InMemoryStore
from langchain_openai import AzureChatOpenAI
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_core.prompts import PromptTemplate
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from unstructured.partition.pdf import partition_pdf
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from unstructured.partition.pdf_image import pdf_image_utils
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain.retrievers.multi_vector import MultiVectorRetriever

from create_summary import create_summary
from question_generation import generate_and_save_questions

# Initialize ChromaDB client settings, disabling anonymized telemetry.
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file.
load_dotenv()

# Configure logging to log both to a file and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

max_retries = 5
# Define urls for different types of processed files.
url_text = "http://127.0.0.1:8181/infer-file"
url_table = "http://127.0.0.1:8183/detect-tables"

# Define output directories for different types of processed files.
output_path = os.path.join(os.getcwd(), "output")
output_path_table = os.path.join(os.getcwd(), "table")

# Create an HTTP client for ChromaDB, connecting to the specified host and port.
CHROMA_CLIENT = chromadb.HttpClient(host=os.environ["CHROMADB_HOST"], port=8000, settings=settings)

# Initialize the Azure OpenAI language model with specific settings.
llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    max_retries=20,
)

class GeneratingError(Exception):
    pass


Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True


def extract_text_using_ocr(image_path):
    """
    Extracts text from images in a directory using OCR and returns structured text.

    Args:
        image_path (str): Path to the directory containing image files.

    Returns:
        dict: A dictionary with image names as keys and extracted text as values.
    """
    structured_text = {}
    prompt = (
        """use this image to do the OCR and extract the text in structured format"""
    )
    for img_file in os.listdir(image_path):
        img_name, _ = os.path.splitext(img_file)
        img_path = os.path.join(image_path, img_file)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(encode_image, img_path)
            try:
                base64_image = future.result(timeout=30)
            except concurrent.futures.TimeoutError:
                return False

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(image_summarize, base64_image, prompt)
            try:
                text = future.result(timeout=60)
            except concurrent.futures.TimeoutError:
                return False

        structured_text[img_name] = text
        sorted_structured_text = {
            key: structured_text[key]
            for key in sorted(structured_text, key=lambda x: int(x.split("_")[1]))
        }
    return sorted_structured_text


def create_output_directory():
    """
    Creates the output directory if it doesn't already exist.
    """
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    """
    Converts a PDF file to images and saves them to the output directory.

    Args:
        fpath (str): Path to the directory containing the PDF file.
        fname (str): Name of the PDF file.

    Returns:
        None
    """
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")

    logging.info("Slides extracted")


def is_valid_image(file_path):
    """
    Validates if the file is a valid image.

    Args:
        file_path (str): Path to the image file.

    Returns:
        bool: True if the image is valid, False otherwise.
    """
    with Image.open(file_path) as img:
        img.verify()
    return True


def send_infer_request(image_path):
    """
    Sends an inference request to the OCR service for an image.

    Args:
        image_path (str): Path to the image file.

    Returns:
        dict: JSON response from the OCR service.
    """
    task_prompt = "<OCR>"
    for attempt in range(max_retries):
        try:
            with open(image_path, "rb") as file:
                files = {"files": file}
                data = {"task_prompt": task_prompt}
                logging.info(f"Sending request for {image_path}")
                response = requests.post(url_text, files=files, data=data)
                logging.info(f"Response status code: {response.status_code}")
                if response.status_code != 200:
                    logging.error(f"Response content: {response.content}")
                response.raise_for_status()
                return response.json()
        except requests.RequestException as e:
            logging.error(
                f"Request failed for {image_path} on attempt {attempt + 1}/{max_retries}: {e}"
            )
    return {"error": f"Failed to process {image_path} after {max_retries} attempts"}


def parallel_inferencing(image_paths, max_workers=3):
    """
    Performs parallel inferencing on a list of image paths using a ThreadPoolExecutor.

    Args:
        image_paths (list): List of paths to image files.
        max_workers (int, optional): Maximum number of threads to use. Defaults to 3.

    Returns:
        list: A list of tuples containing image paths and their respective inference results.
    """
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_image = {
            executor.submit(send_infer_request, path): path for path in image_paths
        }
        for future in as_completed(future_to_image):
            image_path = future_to_image[future]
            try:
                result = future.result()
                results.append((image_path, result))
            except Exception as exc:
                logging.error(f"{image_path} generated an exception: {exc}")
    return results


def structure_ocr_with_llm(ocr_text):
    """
    Structures OCR text using an LLM (Large Language Model) to ensure proper formatting.

    Args:
        ocr_text (str): Raw OCR text to be structured.

    Returns:
        str: Structured OCR text.
    """
    prompt = PromptTemplate(
        input_variables=["ocr_text"],
        template="""
        Extract well-structured text from OCR text of a scanned page, ensuring no loss of detail, accurate formatting, and proper handling of tabular data.

        Instructions:

        Extract Complete Text:
            Extract all text from the raw OCR output without truncating or losing any details.

        Preserve Structure:
            Retain the original structure of the text, including paragraphs, headings, bullet points, and any other formatting elements.

        Handle Tabular Data:
            If the scanned page contains tabular data, format it into a clear and readable table format with proper rows and columns.

        Ensure Accuracy:
            Ensure that the extracted text is accurate and free of errors.

        Maintain Original Formatting:
            Maintain the original font styles (bold, italics, underlined) and other text attributes as much as possible.

        Present Comprehensive Content:
            Ensure that the returned text includes all information from the scanned page, preserving the context and details.

        Things to avoid:
        1. Dont add any introductory text or closing text like "here is the well structured text" or "hope this is fine" etc
        2. Dont add anyhting from your knowledge but only from provided content
        3. Dont think adn interact verbally and give the final output directly without adding any salutation / conversation / closing statements
        Here is the OCR text:
        4. Dont add any text like 'Here is the well-structured text extracted from the OCR output:' in the final output
        {ocr_text}
        """,
    )

    chain = prompt | llm_gpt | StrOutputParser()
    structured_ocr = chain.invoke(ocr_text)

    return structured_ocr


def generate_text_summaries(texts, deliverables_list_metadata, summarize=False):
    """
    Generates text summaries using an LLM based on provided well-structured text.

    Args:
        texts (dict): Dictionary containing well-structured text.
        deliverables_list_metadata (dict): Metadata about the document being summarized.
        summarize (bool, optional): Flag to indicate if summaries should be generated. Defaults to False.

    Returns:
        dict: A dictionary containing summaries of the texts.
    """
    prompt_text = """
        System Instructions:

        Generate a concise and accurate summary from the provided well-structured text. The summary will be used for query matching in a RAG system.
        
        Preserve Key Information:
            Identify and include all key points and important details from the well-structured text.
        
        Maintain Clarity:
            Ensure the summary is clear and easy to understand, using complete sentences and proper grammar.
        
        Conciseness:
            Keep the summary brief while covering all significant aspects of the original text.
        
        Context Preservation:
            Ensure the context and meaning of the original text are preserved in the summary.
        
        Avoid Redundancy:
            Avoid repetition of information and ensure the summary is free of redundant details.
        
        Things to avoid:
        1. Dont add any introductory text or closing text like "here is the well structured text" or "hope this is fine" etc
        2. Dont add anyhting from your knowledge but only from provided content
        3. Dont think adn interact verbally and give the final output directly without adding any salutation / conversation / closing statements
        4. Dont add any text like 'Here is a concise and accurate summary of the provided text' in the final output
        Here is the well structured text: 

        {element}
    """
    prompt = ChatPromptTemplate.from_template(prompt_text)

    summarize_chain = {"element": lambda x: x} | prompt | llm_gpt | StrOutputParser()

    text_summaries = {}

    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
    abstract = deliverables_list_metadata["Abstract"]

    if summarize:
        for key, value in texts.items():
            summarized_value = summarize_chain.invoke({"element": value})
            text_summaries[key] = (
                f"Title : {title}\nAbstract : {abstract}\nSummary : {summarized_value}"
            )

    return text_summaries


def send_image_for_detection(api_url, image_path, output_dir, slide_number):
    """
    Sends an image for table detection to the specified API URL.

    Args:
        api_url (str): URL of the API for table detection.
        image_path (str): Path to the image file.
        output_dir (str): Directory where the output will be saved.

    Returns:
        dict: JSON response from the API.
    """
    with open(image_path, "rb") as image_file:
        files = {"file": image_file}
        data = {"output_dir": output_dir, "slide_number": slide_number}
        response = requests.post(api_url, files=files, data=data)
        response.raise_for_status()
        return response.json()


def encode_image(image_path):
    """
    Encodes an image file to a base64 string.

    Args:
        image_path (str): Path to the image file.

    Returns:
        str: Base64 encoded string of the image.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    """
    Summarizes an image by sending it to an LLM along with a prompt.

    Args:
        img_base64 (str): Base64 encoded image.
        prompt (str): Prompt for the LLM to summarize the image.

    Returns:
        str: Summary generated by the LLM.
    """
    msg = llm_gpt.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"},
                    },
                ]
            )
        ]
    )
    return msg.content


def generate_img_summaries(path, deliverables_list_metadata):
    """
    Generates summaries for images in a directory using an LLM.

    Args:
        path (str): Path to the directory containing image files.
        deliverables_list_metadata (dict): Metadata about the document being processed.

    Returns:
        tuple: A tuple containing two dictionaries:
               1. Base64 encoded images
               2. Image summaries
    """
    image_summaries = {}
    img_base64_list = {}
    prompt = """use this image to extract and analyze the information thoroughly"""
    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)
            title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
            abstract = deliverables_list_metadata["Abstract"]

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=120)
                except concurrent.futures.TimeoutError:
                    return False
            image_summaries[img_name] = (
                f"Title : {title}\nAbstract : {abstract}\nSummary : {summary}"
            )
    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


def save_docstore(docstore, path):
    """
    Saves a document store to a specified path using pickle.

    Args:
        docstore (InMemoryStore): The document store to save.
        path (str): Path where the document store will be saved.

    Returns:
        None
    """
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def save_array_to_text(file_path, data_to_save):
    """
    Saves an array of data to a text file in JSON format.

    Args:
        file_path (str): Path to the text file where data will be saved.
        data_to_save (list): List of data items to save.

    Returns:
        None
    """
    with open(file_path, "a") as f:
        for item in data_to_save:
            text_data = json.dumps(item)
            f.write(text_data + "\n")


def custom_write_image(image, output_image_path):
    """
    Custom image saving function that resizes large images before saving.

    Args:
        image (PIL.Image.Image): Image object to be saved.
        output_image_path (str): Path where the image will be saved.

    Returns:
        None
    """
    max_size = 65500
    try:
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format="JPEG")
        img_size_kb = len(img_byte_arr.getvalue()) / 1024

        if img_size_kb < 20:
            return

        width, height = image.size
        if width > max_size or height > max_size:
            print(
                f"Resizing image from ({width}, {height}) to fit within ({max_size}, {max_size})"
            )
            if width > height:
                new_width = max_size
                new_height = int((max_size / width) * height)
            else:
                new_height = max_size
                new_width = int((max_size / height) * width)
            image = image.resize((new_width, new_height), Image.LANCZOS)

        image.save(output_image_path)
    except Exception as e:
        print(f"Failed to process image: {e}")


pdf_image_utils.write_image = custom_write_image


def extract_pdf_elements(path, fname):
    """
    Extracts elements from a PDF file, including text and images, and returns structured content.

    Args:
        path (str): Path to the directory containing the PDF file.
        fname (str): Name of the PDF file.

    Returns:
        dict: A dictionary containing extracted elements from the PDF.
    """
    return partition_pdf(
        filename=os.path.join(path, fname),
        extract_images_in_pdf=True,
        infer_table_structure=True,
        chunking_strategy="by_title",
        max_characters=4000,
        new_after_n_chars=3800,
        combine_text_under_n_chars=2000,
    )

def trim_summary_to_token_limit(text, token_limit=1000, encoding_name="o200k_base"):
    """
    Trims the provided text to fit within the specified token limit.

    Args:
        text (str): The full summary or text that needs to be trimmed.
        token_limit (int): The maximum number of tokens allowed. Defaults to 100k tokens.
        encoding_name (str): The encoding to use for tokenization. Defaults to 'o200k_base'.

    Returns:
        str: The trimmed text within the token limit.
    """
    # Get the encoding
    encoding = tiktoken.get_encoding(encoding_name)

    # Encode the text into tokens
    tokens = encoding.encode(text)

    # If token count exceeds the limit, trim the tokens
    if len(tokens) > token_limit:
        tokens = tokens[:token_limit]

    # Decode the trimmed tokens back into a string
    trimmed_text = encoding.decode(tokens)

    return trimmed_text


def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    text_summaries,
    texts,
    table_summaries,
    tables,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
    batch_size=75,
):
    """
    Creates and populates a MultiVectorRetriever for normal and summary RAG.

    Args:
        vectorstore (Chroma): Vector store for storing normal content.
        vectorstore_summary (Chroma): Vector store for storing summary content.
        text_summaries (dict): Summaries of text elements.
        texts (dict): Full text elements.
        table_summaries (dict): Summaries of table elements.
        tables (dict): Full table elements.
        image_summaries (dict): Summaries of image elements.
        images (dict): Full image elements.
        file_metadata (dict): Metadata of the document.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
        batch_size (int, optional): Number of documents to process in a batch. Defaults to 75.

    Returns:
        None
    """
    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])

    current_dir = os.getcwd()
    docstore_path_normal = os.path.join(
        current_dir,
        "docstores_normal_rag",
        f"{file_metadata['ID']}.pkl",
    )
    docstore_path_summary = os.path.join(
        current_dir,
        "docstores_summary_rag",
        f"{file_metadata['ID']}.pkl",
    )

    store_normal = InMemoryStore()
    id_key_normal = "GatesVentures_Scientia"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store_normal, id_key=id_key_normal
    )

    store_summary = InMemoryStore()
    id_key_summary = "GatesVentures_Scientia_Summary"
    retriever_summary = MultiVectorRetriever(
        vectorstore=vectorstore_summary, docstore=store_summary, id_key=id_key_summary
    )
    combined_summaries = {}
    combined_contents = {}

    # Add text summaries and contents
    if text_summaries:
        combined_summaries.update(text_summaries)
        combined_contents.update(texts)

    # Add table summaries and contents
    if table_summaries:
        combined_summaries.update(table_summaries)
        combined_contents.update(tables)

    # Add image summaries and contents
    if image_summaries:
        combined_summaries.update(image_summaries)
        combined_contents.update(images)

    doc_keys = list(combined_contents.keys())
    total_docs = len(doc_keys)
    all_document_summaries = []

    for start_idx in range(0, total_docs, batch_size):
        end_idx = min(start_idx + batch_size, total_docs)
        batch_keys = doc_keys[start_idx:end_idx]

        batch_summaries = {key: combined_summaries[key] for key in batch_keys}

        summary = create_summary(batch_summaries)

        if summary:
            all_document_summaries.append(summary)
        else:
            raise GeneratingError("Summary Generation Failed")

    if len(all_document_summaries) > 1:
        final_summary = " ".join(all_document_summaries)
    else:
        final_summary = all_document_summaries[0]

    questions_generation = generate_and_save_questions(
        title, final_summary, deliverables_list_metadata["DeliverablePermissions"]
    )

    if not questions_generation:
        raise GeneratingError("Summary Generation Failed")

    def add_documents(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, total_docs, batch_size):
            end_idx = min(start_idx + batch_size, total_docs)
            batch_keys = doc_keys[start_idx:end_idx]

            batch_summaries = {key: doc_summaries[key] for key in batch_keys}
            batch_contents = {key: doc_contents[key] for key in batch_keys}

            doc_ids = [str(uuid.uuid4()) for _ in batch_contents]
            summary_docs = [
                Document(
                    page_content=s,
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                Document(
                    page_content=json.dumps(
                        {"summary": doc_summaries[key], "content": s}
                    ),
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    # Process documents and accumulate summaries
    add_documents(retriever, combined_summaries, combined_contents)

    # Store the combined summary in the summary retriever
    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "ContentTags": deliverables_list_metadata["ContentTags"],
                "Abstract": deliverables_list_metadata["Abstract"],
                "Region": deliverables_list_metadata["Region"],
                "StrategyArea": deliverables_list_metadata["StrategyArea"],
                "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                "Country": deliverables_list_metadata["Country"],
                "Country_x003a_CountryFusionID": deliverables_list_metadata[
                    "Country_x003a_CountryFusionID"
                ],
                "ContentTypes": deliverables_list_metadata["ContentTypes"],
                "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                "DeliverablePermissions": deliverables_list_metadata[
                    "DeliverablePermissions"
                ],
                "source": file_metadata["WebUrl"],
                "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
    full_docs_summaryRetriever = [
        Document(
            page_content=json.dumps(
                {
                    "summary": f"Summary of the document - {title} - is {final_summary}",
                    "content": f"Summary of the document - {title} - is {final_summary}",
                }
            ),
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "ContentTags": deliverables_list_metadata["ContentTags"],
                "Abstract": deliverables_list_metadata["Abstract"],
                "Region": deliverables_list_metadata["Region"],
                "StrategyArea": deliverables_list_metadata["StrategyArea"],
                "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                "Country": deliverables_list_metadata["Country"],
                "Country_x003a_CountryFusionID": deliverables_list_metadata[
                    "Country_x003a_CountryFusionID"
                ],
                "ContentTypes": deliverables_list_metadata["ContentTypes"],
                "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                "DeliverablePermissions": deliverables_list_metadata[
                    "DeliverablePermissions"
                ],
                "source": file_metadata["WebUrl"],
                "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.docstore.mset(
        list(zip(doc_id_summary, full_docs_summaryRetriever))
    )

    save_docstore(retriever.docstore, docstore_path_normal)
    save_docstore(retriever_summary.docstore, docstore_path_summary)

    logging.info(f"Ingestion Done {file_metadata['Name']}")

def extract_slide_number(filename):
    match = re.search(r'slide_(\d+)', filename)
    if match:
        return int(match.group(1))
    return None


def pdf_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")
        logging.info("hi")
        # Extract individual pages as images
        pdf_to_images(fpath, fname)

        # delete from here
        # unstructured_text = {}

        # image_paths = [
        #     os.path.join(output_path, file)
        #     for file in os.listdir(output_path)
        #     if file.endswith((".png", ".jpg", ".jpeg"))
        #     and is_valid_image(os.path.join(output_path, file))
        # ]

        # results_inferencing = parallel_inferencing(image_paths)

        # for image_path, result in results_inferencing:
        #     file_name_with_ext = os.path.basename(image_path)
        #     page_number, _ = os.path.splitext(file_name_with_ext)

        #     unstructured_text[page_number] = result["results"][0]["<OCR>"]
        #     unstructured_text = {
        #         key: unstructured_text[key]
        #         for key in sorted(unstructured_text, key=lambda x: int(x.split("_")[1]))
        #     }

        # structured_text = {}

        # for i, (img_name, s) in enumerate(unstructured_text.items()):
        #     result = structure_ocr_with_llm(s)
        #     structured_text[img_name] = result

        # Send to LLM for structured OCR
        structured_text = extract_text_using_ocr(output_path)

        if structured_text is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate OCR")

        # Send structured OCR for text summary
        text_summaries = generate_text_summaries(
            structured_text, deliverables_list_metadata, summarize=True
        )

        logging.info("Text Summary Done")

        # Save table from images
        for file in os.listdir(output_path):
            slide_number = extract_slide_number(file)
            if slide_number is not None:
                response = send_image_for_detection(
                    url_table, os.path.join(output_path, file), output_path_table, slide_number
                )

        # Generate table summaries
        result = generate_img_summaries("table", deliverables_list_metadata)

        if result is False:
            shutil.rmtree("table")
            raise Exception("Failed to generate Table Summaries")

        tables, table_summaries = result

        logging.info("Table Summary Done")

        # Extract images from  pages
        extract_pdf_elements(fpath, fname)

        files = sorted(os.listdir("figures"))

        for index, filename in enumerate(files, start=1):
            file_ext = os.path.splitext(filename)[1]
            new_file = f"figure_{index}{file_ext}"
            os.rename(
                os.path.join("figures", filename), os.path.join("figures", new_file)
            )

        # Generate image summaries
        result_image = generate_img_summaries("figures", deliverables_list_metadata)

        if result_image is False:
            shutil.rmtree("figures")
            raise Exception("Failed to generate Image Summaries")

        base64_image, summary_image = result_image

        shutil.rmtree(output_path)
        shutil.rmtree(output_path_table)
        shutil.rmtree("figures")

        # Initialize the Azure OpenAI embeddings
        embeddings = AzureOpenAIEmbeddings(
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_EMBEDDINGS_MODEL"],
        )

        # Vectorstore for a collections
        vectorstore = Chroma(
            collection_name="GatesVentures_Scientia",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        vectorstore_summary = Chroma(
            collection_name="GatesVentures_Scientia_Summary",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        # Creating multivector retriever
        create_multi_vector_retriever(
            vectorstore,
            vectorstore_summary,
            text_summaries,
            structured_text,
            table_summaries,
            tables,
            summary_image,
            base64_image,
            file_metadata,
            deliverables_list_metadata,
        )
        return True, None
    except Exception as e:
        logging.error(f"Error in PDF ingestion: {e}")
        return False, str(e)




import os
import uuid
import json
import base64
import shutil
import pickle
import logging
import concurrent.futures

import tiktoken
import chromadb
from dotenv import load_dotenv
from chromadb.config import Settings
from pdf2image import convert_from_path
from langchain.storage import InMemoryStore
from langchain_openai import AzureChatOpenAI
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.retrievers.multi_vector import MultiVectorRetriever

from create_summary import create_summary
from question_generation import generate_and_save_questions

# Set up ChromaDB settings
settings = Settings(anonymized_telemetry=False)

# Load environment variables from a .env file
load_dotenv()

# Set up logging configuration to log to both a file and the console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Define paths for storing output
output_path = os.path.join(os.getcwd(), "output")

# Initialize ChromaDB client
CHROMA_CLIENT = chromadb.HttpClient(host=os.environ["CHROMADB_HOST"], port=8000, settings=settings)

# Initialize Azure OpenAI GPT model for image summarization
llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    max_retries=20,
)

class GeneratingError(Exception):
    pass


def create_output_directory():
    """
    Creates the output directory if it doesn't exist.
    """
    if not os.path.exists(output_path):
        os.makedirs(output_path)


def pdf_to_images(fpath, fname):
    """
    Converts a PDF file into images for each page and saves them to the output directory.
    """
    create_output_directory()

    images = convert_from_path(os.path.join(fpath, fname))

    for i, image in enumerate(images):
        slide_image_path = os.path.join(output_path, f"slide_{i + 1}.png")
        image.save(slide_image_path, "PNG")

    logging.info("Slides extracted")


def encode_image(image_path):
    """
    Encodes an image to a base64 string.

    Args:
        image_path (str): Path to the image file.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_summarize(img_base64, prompt):
    """
    Summarizes the content of an image using a GPT model.

    Args:
        img_base64 (str): Base64 encoded image string.
        prompt (str): Prompt for the model to generate the summary.
    """
    msg = llm_gpt.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"},
                    },
                ]
            )
        ]
    )
    return msg.content


def generate_img_summaries(path, deliverables_list_metadata):
    """
    Generates summaries for images in a directory and returns them along with their base64 encodings.

    Args:
        path (str): Path to the directory containing images.
        deliverables_list_metadata (dict): Metadata associated with the deliverables.
    """
    image_summaries = {}
    img_base64_list = {}
    prompt = """use this image to extract and analyze the information thoroughly"""
    for img_file in os.listdir(path):
        if img_file.endswith((".jpg", ".png")):
            img_name, _ = os.path.splitext(img_file)
            img_path = os.path.join(path, img_file)
            title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])
            abstract = deliverables_list_metadata["Abstract"]

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(encode_image, img_path)
                try:
                    base64_image = future.result(timeout=60)
                except concurrent.futures.TimeoutError:
                    return False

            img_base64_list[img_name] = base64_image

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(image_summarize, base64_image, prompt)
                try:
                    summary = future.result(timeout=120)
                except concurrent.futures.TimeoutError:
                    return False
            image_summaries[img_name] = (
                f"Title : {title}\nAbstract : {abstract}\nSummary : {summary}"
            )
    sorted_image_summaries = {
        key: image_summaries[key]
        for key in sorted(image_summaries, key=lambda x: int(x.split("_")[1]))
    }
    sorted_image_list = {
        key: img_base64_list[key]
        for key in sorted(img_base64_list, key=lambda x: int(x.split("_")[1]))
    }
    return sorted_image_list, sorted_image_summaries


def save_docstore(docstore, path):
    """
    Saves a document store to a pickle file.

    Args:
        docstore (InMemoryStore): The document store to save.
        path (str): Path where the pickle file will be saved.
    """
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def save_array_to_text(file_path, data_to_save):
    """
    Saves an array of data to a text file in JSON format.

    Args:
        file_path (str): Path to the text file.
        data_to_save (list): List of data to save.
    """
    with open(file_path, "a") as f:
        for item in data_to_save:
            text_data = json.dumps(item)
            f.write(text_data + "\n")

def trim_summary_to_token_limit(text, token_limit=1000, encoding_name="o200k_base"):
    """
    Trims the provided text to fit within the specified token limit.

    Args:
        text (str): The full summary or text that needs to be trimmed.
        token_limit (int): The maximum number of tokens allowed. Defaults to 100k tokens.
        encoding_name (str): The encoding to use for tokenization. Defaults to 'o200k_base'.

    Returns:
        str: The trimmed text within the token limit.
    """
    # Get the encoding
    encoding = tiktoken.get_encoding(encoding_name)

    # Encode the text into tokens
    tokens = encoding.encode(text)

    # If token count exceeds the limit, trim the tokens
    if len(tokens) > token_limit:
        tokens = tokens[:token_limit]

    # Decode the trimmed tokens back into a string
    trimmed_text = encoding.decode(tokens)

    return trimmed_text


def create_multi_vector_retriever(
    vectorstore,
    vectorstore_summary,
    image_summaries,
    images,
    file_metadata,
    deliverables_list_metadata,
    batch_size=75,
):
    """
    Creates a MultiVectorRetriever for normal and summary RAG, and saves document stores.

    Args:
        vectorstore (Chroma): Chroma vector store for full documents.
        vectorstore_summary (Chroma): Chroma vector store for summary documents.
        image_summaries (dict): Summaries of the images.
        images (dict): Base64 encoded images.
        file_metadata (dict): Metadata of the file being processed.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
        batch_size (int, optional): Number of documents to process in each batch. Defaults to 75.
    """
    title, _ = os.path.splitext(deliverables_list_metadata["FileLeafRef"])

    current_dir = os.getcwd()
    docstore_path_normal = os.path.join(
        current_dir,
        "docstores_normal_rag",
        f"{file_metadata['ID']}.pkl",
    )
    docstore_path_summary = os.path.join(
        current_dir,
        "docstores_summary_rag",
        f"{file_metadata['ID']}.pkl",
    )

    store_normal = InMemoryStore()
    id_key_normal = "GatesVentures_Scientia"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore, docstore=store_normal, id_key=id_key_normal
    )

    store_summary = InMemoryStore()
    id_key_summary = "GatesVentures_Scientia_Summary"
    retriever_summary = MultiVectorRetriever(
        vectorstore=vectorstore_summary, docstore=store_summary, id_key=id_key_summary
    )

    combined_summaries = {}
    combined_contents = {}

    if image_summaries:
        combined_summaries.update(image_summaries)
        combined_contents.update(images)

    doc_keys = list(combined_contents.keys())
    total_docs = len(doc_keys)

    all_document_summaries = []

    for start_idx in range(0, total_docs, batch_size):
        end_idx = min(start_idx + batch_size, total_docs)
        batch_keys = doc_keys[start_idx:end_idx]

        batch_summaries = {key: combined_summaries[key] for key in batch_keys}

        summary = create_summary(batch_summaries)

        if summary:
            all_document_summaries.append(summary)
        else:
            raise GeneratingError("Summary Generation Failed")

    if len(all_document_summaries) > 1:
        final_summary = " ".join(all_document_summaries)
    else:
        final_summary = all_document_summaries[0]

    questions_generation = generate_and_save_questions(
        title, final_summary, deliverables_list_metadata["DeliverablePermissions"]
    )

    if not questions_generation:
        raise GeneratingError("Summary Generation Failed")

    def add_documents(retriever, doc_summaries, doc_contents):
        for start_idx in range(0, total_docs, batch_size):
            end_idx = min(start_idx + batch_size, total_docs)
            batch_keys = doc_keys[start_idx:end_idx]

            batch_summaries = {key: doc_summaries[key] for key in batch_keys}
            batch_contents = {key: doc_contents[key] for key in batch_keys}

            doc_ids = [str(uuid.uuid4()) for _ in batch_contents]
            summary_docs = [
                Document(
                    page_content=s,
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_summaries.items())
            ]
            retriever.vectorstore.add_documents(summary_docs)

            full_docs = [
                Document(
                    page_content=json.dumps(
                        {"summary": doc_summaries[key], "content": s}
                    ),
                    metadata={
                        id_key_normal: doc_ids[i],
                        "id": file_metadata["ID"],
                        "Title": title,
                        "ContentTags": deliverables_list_metadata["ContentTags"],
                        "Abstract": deliverables_list_metadata["Abstract"],
                        "Region": deliverables_list_metadata["Region"],
                        "StrategyArea": deliverables_list_metadata["StrategyArea"],
                        "StrategyAreaTeam": deliverables_list_metadata[
                            "StrategyAreaTeam"
                        ],
                        "Country": deliverables_list_metadata["Country"],
                        "Country_x003a_CountryFusionID": deliverables_list_metadata[
                            "Country_x003a_CountryFusionID"
                        ],
                        "ContentTypes": deliverables_list_metadata["ContentTypes"],
                        "Country_x003a_ID": deliverables_list_metadata[
                            "Country_x003a_ID"
                        ],
                        "DeliverablePermissions": deliverables_list_metadata[
                            "DeliverablePermissions"
                        ],
                        "source": file_metadata["WebUrl"],
                        "deliverables_list_metadata": f"{deliverables_list_metadata}",
                        "slide_number": key,
                    },
                )
                for i, (key, s) in enumerate(batch_contents.items())
            ]
            retriever.docstore.mset(list(zip(doc_ids, full_docs)))

    add_documents(retriever, combined_summaries, combined_contents)

    doc_id_summary = [str(uuid.uuid4())]
    summary_docs_summaryRetriever = [
        Document(
            page_content=f"Summary of the document - {title}",
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "ContentTags": deliverables_list_metadata["ContentTags"],
                "Abstract": deliverables_list_metadata["Abstract"],
                "Region": deliverables_list_metadata["Region"],
                "StrategyArea": deliverables_list_metadata["StrategyArea"],
                "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                "Country": deliverables_list_metadata["Country"],
                "Country_x003a_CountryFusionID": deliverables_list_metadata[
                    "Country_x003a_CountryFusionID"
                ],
                "ContentTypes": deliverables_list_metadata["ContentTypes"],
                "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                "DeliverablePermissions": deliverables_list_metadata[
                    "DeliverablePermissions"
                ],
                "source": file_metadata["WebUrl"],
                "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.vectorstore.add_documents(summary_docs_summaryRetriever)
    full_docs_summaryRetriever = [
        Document(
            page_content=json.dumps(
                {
                    "summary": f"Summary of the document - {title} - is {final_summary}",
                    "content": f"Summary of the document - {title} - is {final_summary}",
                }
            ),
            metadata={
                id_key_summary: doc_id_summary[0],
                "id": file_metadata["ID"],
                "Title": title,
                "ContentTags": deliverables_list_metadata["ContentTags"],
                "Abstract": deliverables_list_metadata["Abstract"],
                "Region": deliverables_list_metadata["Region"],
                "StrategyArea": deliverables_list_metadata["StrategyArea"],
                "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                "Country": deliverables_list_metadata["Country"],
                "Country_x003a_CountryFusionID": deliverables_list_metadata[
                    "Country_x003a_CountryFusionID"
                ],
                "ContentTypes": deliverables_list_metadata["ContentTypes"],
                "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                "DeliverablePermissions": deliverables_list_metadata[
                    "DeliverablePermissions"
                ],
                "source": file_metadata["WebUrl"],
                "deliverables_list_metadata": f"{deliverables_list_metadata}",
            },
        )
    ]
    retriever_summary.docstore.mset(
        list(zip(doc_id_summary, full_docs_summaryRetriever))
    )

    save_docstore(retriever.docstore, docstore_path_normal)
    save_docstore(retriever_summary.docstore, docstore_path_summary)

    logging.info(f"Ingestion Done {file_metadata['Name']}")


def pdf_ppt_ingestion_MV(fname, file_metadata, deliverables_list_metadata):
    try:
        current_folder = os.getcwd()
        parent_folder = os.path.dirname(current_folder)
        fpath = os.path.join(parent_folder, current_folder, "files_to_ingest")
        logging.info("Hello")
        # Extract individual slides as images
        pdf_to_images(fpath, fname)

        # Generate image summaries
        result = generate_img_summaries(output_path, deliverables_list_metadata)

        if result is False:
            shutil.rmtree(output_path)
            raise Exception("Failed to generate Image Summaries")

        img_base64_list, image_summaries = result
        shutil.rmtree(output_path)

        # Initialize the Azure OpenAI embeddings
        embeddings = AzureOpenAIEmbeddings(
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_EMBEDDINGS_MODEL"],
        )

        # Vectorstore for a collections
        vectorstore = Chroma(
            collection_name="GatesVentures_Scientia",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )
        vectorstore_summary = Chroma(
            collection_name="GatesVentures_Scientia_Summary",
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        # Creating multivector retriever
        create_multi_vector_retriever(
            vectorstore,
            vectorstore_summary,
            image_summaries,
            img_base64_list,
            file_metadata,
            deliverables_list_metadata,
        )
        return True, None
    except Exception as e:
        logging.error(f"Error in PowerPoint ingestion: {e}")
        return False, str(e)





import os
import logging

from datetime import datetime
from pymongo import MongoClient
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Set up logging to log both to a file ('Ingestion_logs.log') and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)

# Initialize a MongoDB client using the API key from environment variables.
client = MongoClient(os.environ["MONGO_API_KEY"])
# Select the database and collection within MongoDB for storing questions.
db = client[os.environ["MONGODB_COLLECTION"]]
collection_question = db["questions"]

# Initialize the AzureChatOpenAI model with the necessary parameters.
llm_gpt = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    max_retries=20,
)


# Function to generate questions based on the provided context.
def question_generation(context):
    # Define the prompt template with detailed instructions for generating questions.
    prompt_text = """
    Instructions:
    1. Assume the persona of a knowledgeable and experienced educator who specializes in generating comprehensive and insightful questions based on provided content.
    2. Read the provided context carefully.
    3. Generate 20 questions based on the context. The questions should cover a range of complexities and types, including but not limited to factual, analytical, summary, explanation, comparison, contrast, application, inference, evaluation, and synthesis.
    4. Ensure that each question is self-explanatory and does not require referring back to the context or any external documents.
    5. The questions can be based on specific parts of the context or across multiple parts of the context or the entire context.

    Context:
    {element}
    Generate the following types of questions:
    1. Factual Questions: Ask about specific details or facts mentioned in the context.
    2. Analytical Questions: Require analyzing information from the context to derive insights or conclusions.
    3. Summary Questions: Require summarizing sections or the entire context.
    4. Explanation Questions: Ask for explanations of concepts, ideas, or processes described in the context.
    5. Comparison Questions: Require comparing elements within the context.
    6. Contrast Questions: Require highlighting differences between elements within the context.
    7. Application Questions: Ask how information from the context can be applied to real-world situations or problems.
    8. Inference Questions: Require drawing inferences or conclusions based on the context.
    9. Evaluation Questions: Require evaluating information or arguments presented in the context.
    10. Synthesis Questions: Require combining elements from the context to form a new idea or perspective.

    Please proceed to generate 10 questions in JSON format with keys Sl_no, Question, Question_Type.
    """
    # Create a prompt template object using the above text.
    prompt = ChatPromptTemplate.from_template(prompt_text)

    # Combine the prompt with the language model and JSON output parser.
    chain = prompt | llm_gpt | JsonOutputParser()

    # Invoke the chain with the provided context and return the result (questions).
    result = chain.invoke({"element": context})
    return result


# Function to generate questions and save them in MongoDB.
def generate_and_save_questions(title, summary, permissions):
    try:
        permission_list = [p for p in permissions.split(";") if p.strip()]
        question_list = []
        # Generate questions from the summary.
        questions = question_generation(summary)

        # Extract and store the questions from the JSON output.
        for question in questions:
            question_list.append(question["Question"])

        # Create a document to be inserted into MongoDB with metadata and questions.
        document = {
            "documentName": title,
            "questions": question_list,
            "docPermissions": permission_list if permissions else [],
            "updatedAt": datetime.utcnow(),
            "createAt": datetime.utcnow(),
        }

        # Insert the document into the MongoDB collection and log the success.
        result = collection_question.insert_one(document)
        logging.info("Questions stored successfully. ", result.inserted_id)
        return result
    except Exception as e:
        # Log any errors that occur during the process.
        logging.error(f"Failed to store the questions. {e}")
        return None






aiohappyeyeballs==2.4.0
aiohttp==3.10.5
aiosignal==1.3.1
annotated-types==0.7.0
antlr4-python3-runtime==4.9.3
anyio==4.4.0
asgiref==3.8.1
attrs==24.2.0
backoff==2.2.1
bcrypt==4.2.0
beautifulsoup4==4.12.3
blinker==1.8.2
build==1.2.1
cachetools==5.5.0
certifi==2024.8.30
cffi==1.17.1
chardet==5.2.0
charset-normalizer==3.3.2
chroma-hnswlib==0.7.3
chromadb==0.5.0
click==8.1.7
coloredlogs==15.0.1
contourpy==1.3.0
cryptography==43.0.1
cycler==0.12.1
dataclasses-json==0.6.7
deepdiff==8.0.1
Deprecated==1.2.14
distro==1.9.0
dnspython==2.6.1
docker-py==1.10.6
docker-pycreds==0.4.0
effdet==0.4.1
emoji==2.12.1
et-xmlfile==1.1.0
fastapi==0.113.0
filelock==3.15.4
filetype==1.2.0
Flask==3.0.3
flatbuffers==24.3.25
fonttools==4.53.1
frozenlist==1.4.1
fsspec==2024.9.0
google-api-core==2.19.2
google-auth==2.34.0
google-cloud-vision==3.7.4
googleapis-common-protos==1.65.0
greenlet==3.0.3
grpcio==1.66.1
grpcio-status==1.66.1
gunicorn==23.0.0
h11==0.14.0
httpcore==1.0.5
httptools==0.6.1
httpx==0.27.2
huggingface-hub==0.24.6
humanfriendly==10.0
idna==3.8
importlib_metadata==8.4.0
importlib_resources==6.4.4
iopath==0.1.10
itsdangerous==2.2.0
Jinja2==3.1.4
jiter==0.5.0
joblib==1.4.2
jsonpatch==1.33
jsonpath-python==1.0.6
jsonpointer==3.0.0
kiwisolver==1.4.7
kubernetes==30.1.0
langchain==0.2.3
langchain-community==0.2.4
langchain-core==0.2.27
langchain-experimental==0.0.60
langchain-openai==0.1.17
langchain-text-splitters==0.2.1
langdetect==1.0.9
langsmith==0.1.75
layoutparser==0.3.4
lxml==5.3.0
Markdown==3.7
markdown-it-py==3.0.0
MarkupSafe==2.1.5
marshmallow==3.22.0
matplotlib==3.9.2
mdurl==0.1.2
mmh3==4.1.0
monotonic==1.6
mpmath==1.3.0
msal==1.28.0
multidict==6.0.5
mypy-extensions==1.0.0
nest-asyncio==1.6.0
networkx==3.3
nltk==3.9.1
numpy==1.26.4
nvidia-cublas-cu12==12.1.3.1
nvidia-cuda-cupti-cu12==12.1.105
nvidia-cuda-nvrtc-cu12==12.1.105
nvidia-cuda-runtime-cu12==12.1.105
nvidia-cudnn-cu12==9.1.0.70
nvidia-cufft-cu12==11.0.2.54
nvidia-curand-cu12==10.3.2.106
nvidia-cusolver-cu12==11.4.5.107
nvidia-cusparse-cu12==12.1.0.106
nvidia-nccl-cu12==2.20.5
nvidia-nvjitlink-cu12==12.6.68
nvidia-nvtx-cu12==12.1.105
oauthlib==3.2.2
Office365-REST-Python-Client==2.5.10
olefile==0.47
omegaconf==2.3.0
onnx==1.16.2
onnxruntime==1.19.2
openai==1.43.1
opencv-python==4.10.0.84
openpyxl==3.1.5
opentelemetry-api==1.27.0
opentelemetry-exporter-otlp-proto-common==1.27.0
opentelemetry-exporter-otlp-proto-grpc==1.27.0
opentelemetry-instrumentation==0.48b0
opentelemetry-instrumentation-asgi==0.48b0
opentelemetry-instrumentation-fastapi==0.48b0
opentelemetry-proto==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-semantic-conventions==0.48b0
opentelemetry-util-http==0.48b0
orderly-set==5.2.2
orjson==3.10.7
overrides==7.7.0
packaging==24.1
pandas==2.2.2
pdf2image==1.17.0
pdfminer.six==20231228
pdfplumber==0.11.0
pikepdf==9.2.1
pillow==10.4.0
pillow_heif==0.18.0
portalocker==2.10.1
posthog==3.6.3
proto-plus==1.24.0
protobuf==5.28.0
psutil==6.0.0
pyasn1==0.6.0
pyasn1_modules==0.4.0
pycocotools==2.0.8
pycparser==2.22
pydantic==2.9.0
pydantic_core==2.23.2
Pygments==2.18.0
PyJWT==2.9.0
pymongo==4.8.0
pypandoc==1.13
pyparsing==3.1.4
pypdf==4.3.1
pypdfium2==4.30.0
PyPika==0.48.9
pyproject_hooks==1.1.0
pysqlite3-binary==0.5.3.post1
pytesseract==0.3.13
python-dateutil==2.9.0.post0
python-docx==1.1.2
python-dotenv==1.0.1
python-iso639==2024.4.27
python-magic==0.4.27
python-multipart==0.0.9
python-oxmsg==0.0.1
python-pptx==0.6.23
pytz==2024.1
PyYAML==6.0.2
rapidfuzz==3.9.7
regex==2024.7.24
requests==2.32.3
requests-oauthlib==2.0.0
requests-toolbelt==1.0.0
rich==13.8.0
rsa==4.9
safetensors==0.4.5
scipy==1.14.1
shellingham==1.5.4
six==1.16.0
sniffio==1.3.1
soupsieve==2.6
SQLAlchemy==2.0.34
starlette==0.38.4
sympy==1.13.2
tabulate==0.9.0
tenacity==8.5.0
tiktoken==0.7.0
timm==1.0.9
tokenizers==0.19.1
torch==2.4.1
torchvision==0.19.1
tqdm==4.66.5
transformers==4.44.2
triton==3.0.0
typer==0.12.5
typing-inspect==0.9.0
typing_extensions==4.12.2
tzdata==2024.1
unstructured==0.14.5
unstructured-client==0.25.7
unstructured-inference==0.7.33
unstructured.pytesseract==0.3.13
urllib3==2.2.2
uvicorn==0.30.6
uvloop==0.20.0
watchfiles==0.24.0
websocket-client==1.8.0
websockets==13.0.1
Werkzeug==3.0.4
wrapt==1.16.0
xlrd==2.0.1
XlsxWriter==3.2.0
yarl==1.9.11
zipp==3.20.1



import os
import csv
import json
import pickle
import shutil
from datetime import datetime, timedelta

import msal

import logging
import pandas as pd
from dotenv import load_dotenv
from langchain.storage import InMemoryStore
from office365.graph_client import GraphClient

from ingest_document import ingest_files
from delete_vstore_dstore import delete_from_vectostore

# Load environment variables from a .env file
load_dotenv()

# Load SharePoint site URL and drive ID from environment variables.
tenant_id = os.getenv("TENANT_ID")
client_id = os.getenv("CLIENT_ID")
site_url = os.getenv("SHAREPOINT_SITE")
client_secret = os.getenv("CLIENT_SECRET")

# Configure logging to log both to a file and the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Ingestion_logs.log")),
        logging.StreamHandler(),
    ],
)


# Timestamp file to track last run time
TIMESTAMP_FILE = "last_run_timestamp.json"

parent_dir = os.path.dirname(os.getcwd())
express_folder = os.path.join(parent_dir, "express", "csv")
fast_folder = os.path.join(parent_dir, "fast", "csv")

main_folders = ['files_to_ingest', 'docstores_normal_rag', 'docstores_summary_rag', 'backup']

backup_subfolders = ['normal', 'summary']

def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        logging.info(f"Created folder: {folder_path}")
    else:
        logging.info(f"Folder already exists: {folder_path}")

for folder in main_folders:
    create_folder(folder)

for subfolder in backup_subfolders:
    backup_subfolder_path = os.path.join('backup', subfolder)
    create_folder(backup_subfolder_path)



def acquire_token_func():
    """
    Acquires an access token via MSAL for authentication with Microsoft Graph API.

    Returns:
        tuple: Contains the token response and the token expiration datetime.
    """
    logging.info("Acquiring access token...")
    authority_url = f"https://login.microsoftonline.com/{tenant_id}"
    app = msal.ConfidentialClientApplication(
        authority=authority_url, client_id=client_id, client_credential=client_secret
    )
    token_response = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    )
    if "access_token" in token_response:
        logging.info("Access token acquired.")
        token_expires_at = datetime.now() + timedelta(
            seconds=token_response["expires_in"]
        )
        return token_response, token_expires_at
    else:
        raise Exception(
            "Failed to acquire token",
            token_response.get("error"),
            token_response.get("error_description"),
        )


def get_site_id(client, site_url):
    """
    Retrieves the timestamp of the last successful run from a JSON file.

    Returns:
        datetime: The datetime of the last run, or None if no timestamp exists.
    """
    logging.info("Fetching site ID...")
    site = client.sites.get_by_url(site_url).execute_query()
    logging.info(f"Site ID fetched: {site.id}")
    return site.id


def get_last_run_timestamp():
    """
    Updates the JSON file with the current datetime as the timestamp of the last run.
    """
    if os.path.exists(TIMESTAMP_FILE):
        with open(TIMESTAMP_FILE, "r") as file:
            return datetime.fromisoformat(json.load(file)["last_run"])
    else:
        return None


def update_last_run_timestamp():
    """
    Updates the JSON file with the current datetime as the timestamp of the last run.
    """
    with open(TIMESTAMP_FILE, "w") as file:
        json.dump({"last_run": datetime.now().isoformat()}, file)
    logging.info("Last run timestamp updated.")


def load_existing_csv_data(csv_filename, colName):
    """
    Loads existing CSV data into a dictionary indexed by a specific column.

    Args:
        csv_filename (str): The path to the CSV file.
        colName (str): The column name to use as the dictionary key.

    Returns:
        dict: A dictionary containing the CSV data indexed by colName.
    """
    if not os.path.isfile(csv_filename):
        return {}
    with open(csv_filename, mode="r", encoding="utf-8") as in_file:
        reader = csv.DictReader(in_file)
        return {row[colName]: row for row in reader}


def save_to_csv(data, csv_filename, additional_folders=None):
    """
    Saves data to a CSV file and optionally copies it to additional folders.

    Args:
        data (list): List of dictionaries representing rows of data.
        csv_filename (str): The path to the CSV file to save.
        additional_folders (list): List of folder paths to copy the CSV file to.
    """
    if data:
        with open(csv_filename, newline="", mode="w", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

        if additional_folders:
            for folder in additional_folders:
                destination = os.path.join(folder, os.path.basename(csv_filename))
                shutil.copy2(csv_filename, destination)

        logging.info(f"CSV file {csv_filename} created.")


def update_csv(existing_data, csv_filename):
    """
    Updates a CSV file with the given data.

    Args:
        existing_data (dict): Dictionary containing the data to be updated in the CSV.
        csv_filename (str): The path to the CSV file to update.
    """
    if not existing_data:
        logging.info(f"No data to update for {csv_filename}")
        return

    keys = list(next(iter(existing_data.values())).keys())
    with open(csv_filename, mode="w", newline="", encoding="utf-8") as output_file:
        dics_writer = csv.DictWriter(output_file, fieldnames=keys)
        dics_writer.writeheader()
        dics_writer.writerows(existing_data.values())
    logging.info(f"CSV file {csv_filename} updated.")


def stream_file_content(
    site_id, drive_id, file_id, files_metadata, deliverables_list_metadata
):
    """
    Downloads, ingests, and removes a file from SharePoint.

    Args:
        site_id (str): The ID of the SharePoint site.
        drive_id (str): The ID of the drive containing the file.
        file_id (str): The ID of the file to download.
        files_metadata (dict): Metadata of the files.
        deliverables_list_metadata (dict): Metadata of the deliverables list.
    """
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=50):
        logging.info("Refreshing access token...")
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    if file_id not in files_metadata:
        logging.info("File not found.")
        return

    target_folder = "files_to_ingest"
    file_name = files_metadata[file_id]["Name"]

    logging.info(f"Downloading file: {file_name}...")
    response = (
        client.sites[site_id]
        .drives[drive_id]
        .items[file_id]
        .get_content()
        .execute_query()
    )

    with open(os.path.join(target_folder, file_name), "wb") as file:
        file.write(response.value)
    logging.info(f"{file_name} saved.")

    logging.info(f"Ingesting file: {file_name}...")
    ingest_files(
        file_name, files_metadata[file_id], deliverables_list_metadata[file_name]
    )

    os.remove(os.path.join(target_folder, file_name))
    logging.info(f"{file_name} removed from local storage.")


def traverse_folders_and_files(
    site_id,
    drive_id,
    parent_id,
    parent_path,
    last_run,
    existing_files,
    created_files,
    updated_files,
    existing_folders,
    created_folders,
    updated_folders,
):
    """
    Traverses folders and files in a SharePoint drive to identify created, updated, or deleted items.

    Args:
        site_id (str): The ID of the SharePoint site.
        drive_id (str): The ID of the drive.
        parent_id (str): The ID of the parent folder.
        parent_path (str): The path of the parent folder.
        last_run (datetime): The timestamp of the last run.
        existing_files (dict): Dictionary of existing files.
        created_files (list): List to store IDs of newly created files.
        updated_files (list): List to store IDs of updated files.
        existing_folders (dict): Dictionary of existing folders.
        created_folders (list): List to store IDs of newly created folders.
        updated_folders (list): List to store IDs of updated folders.

    Returns:
        tuple: Contains lists of current file IDs and folder IDs.
    """
    global token, token_expires_at, client

    if token_expires_at < datetime.now() + timedelta(minutes=5):
        logging.info("Refreshing access token...")
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

    folder_items = (
        client.sites[site_id]
        .drives[drive_id]
        .items[parent_id]
        .children.get()
        .top(10)
        .execute_query()
    )
    current_file_ids = []
    current_folder_ids = []

    for item in folder_items:
        item_path = parent_path + "/" + item.name
        if item.is_folder:
            folder_metadata = {
                "ID": item.id,
                "Name": item.name,
                "Path": item_path,
                "WebUrl": item.web_url,
            }

            if item.id in existing_folders:
                if last_run and item.last_modified_datetime > last_run:
                    updated_folders.append(item.id)
            else:
                created_folders.append(item.id)

            existing_folders[item.id] = folder_metadata
            current_folder_ids.append(item.id)

            sub_file_ids, sub_folder_ids = traverse_folders_and_files(
                site_id,
                drive_id,
                item.id,
                item_path,
                last_run,
                existing_files,
                created_files,
                updated_files,
                existing_folders,
                created_folders,
                updated_folders,
            )
            current_file_ids.extend(sub_file_ids)
            current_folder_ids.extend(sub_folder_ids)
        elif item.is_file:
            file_metadata = {
                "ID": item.id,
                "Name": item.name,
                "Path": parent_path + "/" + item.name,
                "WebUrl": item.web_url,
                "CreatedDateTime": item.created_datetime,
            }

            if item.id in existing_files:
                if last_run and item.last_modified_datetime > last_run:
                    updated_files.append(item.id)
            else:
                created_files.append(item.id)
            existing_files[item.id] = file_metadata
            current_file_ids.append(item.id)

    return current_file_ids, current_folder_ids


def save_to_csv1(data, csv_filename, field_names, additional_folders=None):
    """
    Saves data to a CSV file and optionally copies it to additional folders with specific field names.

    Args:
        data (list): List of dictionaries representing rows of data.
        csv_filename (str): The path to the CSV file to save.
        field_names (list): List of field names to include in the CSV.
        additional_folders (list): List of folder paths to copy the CSV file to.
    """
    if data:
        df = pd.DataFrame(data, columns=field_names)
        df["ExtractedName"] = df["FileLeafRef"].apply(lambda x: os.path.splitext(x)[0])
        df.to_csv(csv_filename, index=False, encoding="utf-8")

        if additional_folders:
            for folder in additional_folders:
                folder_csv_path = os.path.join(folder, os.path.basename(csv_filename))
                df.to_csv(folder_csv_path, index=False, encoding="utf-8")

        logging.info(f"CSV file {csv_filename} created.")


def rotate_backups(backup_dir, main_store_path):
    """
    Rotates backup files, keeping the most recent three backups.

    Args:
        backup_dir (str): The directory containing the backup files.
        main_store_path (str): The path to the main store file to backup.
    """
    base_name = os.path.basename(main_store_path).replace(".pkl", "")

    backups = sorted(
        [
            f
            for f in os.listdir(backup_dir)
            if f.startswith(base_name) and "_backup_" in f
        ],
        reverse=True,
    )

    if len(backups) >= 3:
        os.remove(os.path.join(backup_dir, backups[-1]))
        backups.pop(-1)

    for i in range(len(backups), 0, -1):
        old_name = os.path.join(backup_dir, backups[i - 1])
        new_name = os.path.join(backup_dir, f"{base_name}_backup_{i+1}.pkl")
        os.rename(old_name, new_name)

    new_backup_name = f"{base_name}_backup_1.pkl"
    shutil.copyfile(main_store_path, os.path.join(backup_dir, new_backup_name))


def load_docstore_chunk(path, chunk_id):
    """
    Loads a chunk of the document store from a file.

    Args:
        path (str): The path to the directory containing the chunk files.
        chunk_id (str): The ID of the chunk to load.

    Returns:
        dict: The loaded chunk from the document store.
    """
    if os.path.exists(os.path.join(path, chunk_id)):
        with open(os.path.join(path, chunk_id), "rb") as f:
            return pickle.load(f)
    return None


def load_full_docstore(path):
    """
    Loads the entire document store by combining all chunks.

    Args:
        path (str): The path to the directory containing the chunk files.

    Returns:
        InMemoryStore: The complete document store loaded from chunks.
    """
    full_store = InMemoryStore()
    for i in os.listdir(path):
        chunk = load_docstore_chunk(path, i)
        if chunk:
            full_store.store.update(chunk.store)
    return full_store


def save_full_docstore(docstore, path):
    """
    Saves the entire document store to a file.

    Args:
        docstore (InMemoryStore): The document store to save.
        path (str): The path to the file where the document store will be saved.
    """
    with open(path, "wb") as f:
        pickle.dump(docstore, f)


def load_existing_docstore(path):
    """
    Loads an existing document store from a file.

    Args:
        path (str): The path to the file containing the document store.

    Returns:
        InMemoryStore: The loaded document store.
    """
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)


def update_and_save_docstore(chunk_store_path, main_store_path, backup_dir):
    """
    Updates the main document store with a new chunk and saves it, also rotating backups.

    Args:
        chunk_store_path (str): The path to the chunk store directory.
        main_store_path (str): The path to the main store file.
        backup_dir (str): The directory for backup files.
    """
    chunk_store_full_path = os.path.join(os.getcwd(), chunk_store_path)

    # Check if chunk store directory exists and is not empty
    if not os.path.exists(chunk_store_full_path) or not os.listdir(chunk_store_full_path):
        return

    try:
        # Load the chunk store
        chunk_store = load_full_docstore(chunk_store_full_path)

        # Load the main store if it exists, else create a new InMemoryStore
        if os.path.exists(main_store_path):
            main_store = load_existing_docstore(main_store_path)
            rotate_backups(backup_dir, main_store_path)
        else:
            main_store = InMemoryStore()

        # Update the main store with the chunk store
        main_store.store.update(chunk_store.store)

        # Save the updated main store
        save_full_docstore(main_store, main_store_path)

    except Exception as e:
        # Log or handle the error
        logging.error(f"An error occurred: {e}")
        return  # If there's an error, exit the function without deleting the chunks

    finally:
        # Remove the chunk store directory only if everything above succeeds
        shutil.rmtree(chunk_store_full_path)


def sharepoint_file_acquisition():
    """
    Main function to acquire files from SharePoint, process them, and update the document store.
    """
    global token, token_expires_at, client

    try:
        # Acquire a new access token and set up the Microsoft Graph API client.
        token, token_expires_at = acquire_token_func()
        client = GraphClient(lambda: token)

        # Retrieve the site ID from the SharePoint site URL.
        site_id = get_site_id(client, site_url)

        # Fetch user permissions and deliverables list names from environment variables.
        user_permission_list = os.getenv("USER_PERMISSION_LIST")
        deliverables_list = os.getenv("DELIVERABLES_LIST")

        # Log the start of user permissions fetching process.
        logging.info("Fetching user permissions...")

        # Fetch user permissions list items from SharePoint.
        users_list_object = (
            client.sites[site_id]
            .lists[user_permission_list]
            .items.expand(
                ["fields($select=User,UserLookupId,Teams,TeamsPermission,Roles)"]
            )
            .get()
            .top(5000)
            .execute_query()
        )
        # Convert the fetched user permissions items to a JSON format and extract fields.
        users_list_items = [item.to_json()["fields"] for item in users_list_object]
        users_list_csv_filename = os.path.join(os.getcwd(), "users_permission.csv")
        save_to_csv(
            users_list_items,
            users_list_csv_filename,
        )

        # Load the saved user permissions CSV file into a DataFrame.
        df = pd.read_csv("users_permission.csv")

        # Combine the 'Teams' and 'TeamsPermission' columns into a 'Permissions' column.
        df["Permissions"] = df["Teams"].astype(str) + df["TeamsPermission"].astype(str)

        # Group the DataFrame by 'User' and 'UserLookupId' and concatenate permissions.
        result = (
            df.groupby(["User", "UserLookupId"])["Permissions"]
            .apply(lambda x: ";".join(x))
            .reset_index()
        )
        # Rename the columns to 'Name', 'UserLookupId', and 'Permissions'.
        result.columns = ["Name", "UserLookupId", "Permissions"]

        # Save the grouped and processed permissions data back to the CSV file.
        result.to_csv("users_permission.csv", index=False)

        # Define additional folders where the CSV file will be saved.
        additional_folders = [express_folder, fast_folder]

        # Save the CSV file to the specified additional folders.
        for folder in additional_folders:
            final_path = os.path.join(folder, "users_permission.csv")
            result.to_csv(final_path, index=False)

        # Log the start of the deliverables list fetching process.
        logging.info("Fetching deliverables list...")

        # Fetch the deliverables list items from SharePoint.
        deliverables_list_object = (
            client.sites[site_id]
            .lists[deliverables_list]
            .items.expand(["fields"])
            .get()
            .top(5000)
            .execute_query()
        )

        # Initialize lists to store deliverables data and field names.
        deliverables_item_data = []
        deliverables_field_names = set()

        # Process each deliverable item and collect field names.
        for item in deliverables_list_object:
            fields = item.to_json()["fields"]
            if fields["ContentType"] == "Document":
                deliverables_item_data.append(fields)
                deliverables_field_names.update(fields.keys())

        # Convert the field names to a list.
        deliverables_field_names = list(deliverables_field_names)

        # Ensure all fields are present in each deliverable item, filling in missing fields with None.
        for fields in deliverables_item_data:
            for field in deliverables_field_names:
                if field not in fields:
                    fields[field] = None

        # Save the deliverables list data to a CSV file.
        deliverables_list_csv_filename = os.path.join(
            os.getcwd(), "deliverables_list_unfiltered.csv"
        )
        field_names = deliverables_item_data[0].keys()
        save_to_csv1(
            deliverables_item_data,
            deliverables_list_csv_filename,
            field_names,
            additional_folders=[express_folder, fast_folder],
        )

        # Define filenames for folders and files metadata CSVs.
        folders_csv_filename = os.path.join(os.getcwd(), "folders_metadata.csv")
        files_csv_filename = os.path.join(os.getcwd(), "files_metadata.csv")

        # Retrieve the last run timestamp.
        last_run = get_last_run_timestamp()

        # Load existing folders and files metadata from CSV files.
        existing_files = load_existing_csv_data(files_csv_filename, "ID")
        existing_folders = load_existing_csv_data(folders_csv_filename, "ID")

        # Initialize lists for tracking created and updated files and folders.
        created_files = []
        created_folders = []
        updated_files = []
        updated_folders = []

        # Log the start of folders and files fetching process.
        logging.info("Fetching folders and files from Deliverables...")

        # Get the drive ID from environment variables.
        drive_id = os.getenv("DRIVE_ID")
        logging.info(f"Processing drive: Deliverables (ID: {drive_id})")

        # Get the root folder ID of the drive.
        root_id = client.sites[site_id].drives[drive_id].root.get().execute_query().id

        # Traverse through folders and files, updating the tracking lists.
        current_file_ids, current_folder_ids = traverse_folders_and_files(
            site_id,
            drive_id,
            root_id,
            "",
            last_run,
            existing_files,
            created_files,
            updated_files,
            existing_folders,
            created_folders,
            updated_folders,
        )

        logging.info("All folders done.")

        # Determine IDs of existing and current files and folders.
        existing_files_ids = set(existing_files.keys())
        existing_folders_ids = set(existing_folders.keys())
        current_file_ids_set = set(current_file_ids)
        current_folder_ids_set = set(current_folder_ids)

        # Identify deleted file and folder IDs.
        deleted_file_ids = existing_files_ids - current_file_ids_set
        deleted_folder_ids = existing_folders_ids - current_folder_ids_set

        # Remove deleted files and folders from the existing metadata.
        for file_id in deleted_file_ids:
            del existing_files[file_id]
        for folder_id in deleted_folder_ids:
            del existing_folders[folder_id]

        # Update the CSV files with the modified metadata.
        update_csv(existing_files, files_csv_filename)
        update_csv(existing_folders, folders_csv_filename)

        # Update the timestamp of the last run.
        update_last_run_timestamp()

        # Load the updated files and deliverables metadata from CSV files.
        files_metadata = load_existing_csv_data("files_metadata.csv", "ID")
        deliverables_list_metadata = load_existing_csv_data(
            "deliverables_list_unfiltered.csv", "FileLeafRef"
        )

        # Prepare lists of file IDs to delete or process.
        file_ids_to_delete = list(deleted_file_ids) + updated_files
        file_ids_to_process = updated_files + created_files

        # Delete documents from the vector store for the deleted or updated files.
        if file_ids_to_delete:
            delete_from_vectostore(file_ids_to_delete)

        # Stream file content and update the vector store for the processed files.
        for file_id in file_ids_to_process:
            stream_file_content(
                site_id, drive_id, file_id, files_metadata, deliverables_list_metadata
            )

        # Update and save the normal RAG docstore, with backups.
        update_and_save_docstore(
            "docstores_normal_rag",
            os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl"),
            os.path.join(os.getcwd(), "backup", "normal"),
        )
        # Update and save the summary RAG docstore, with backups.
        update_and_save_docstore(
            "docstores_summary_rag",
            os.path.join(
                parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
            ),
            os.path.join(os.getcwd(), "backup", "summary"),
        )

        if os.path.exists("failed_files_1.csv"):
            failed_files_csv = pd.read_csv("failed_files_1.csv")
            deliverables_list_csv = pd.read_csv("deliverables_list_unfiltered.csv")
            name_set = set(failed_files_csv["Name"].astype(str))

            deliverables_list_filtered_csv = deliverables_list_csv[
                ~deliverables_list_csv["FileLeafRef"].astype(str).isin(name_set)
            ]

            filtered_data = deliverables_list_filtered_csv.to_dict(orient="records")

            save_to_csv(filtered_data, "deliverables_list.csv", additional_folders=[express_folder,fast_folder])
        logging.info("Ingestion Complete")
    except Exception as e:
        logging.error(f"An error occurred: {e}")


if __name__ == "__main__":
    sharepoint_file_acquisition()








