const { getAccessibleFiles, loadCSV } = require("../utils/userPermissions");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const allowedExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".doc"];
const extensionMapping = {
  ".pdf": "PDF Document",
  ".pptx": "PowerPoint Presentation",
  ".ppt": "PowerPoint Presentation",
  ".docx": "Word Document",
  ".doc": "Word Document",
};

exports.getAccessibleDocuments = async (req, res, next) => {
  try {
    const userLookupId = req.query.userLookupId;
    const userPermissionCSV = path.join(
      __dirname,
      "..",
      "csv",
      "users_permission.csv"
    );
    const deliverablesListCSV = path.join(
      __dirname,
      "..",
      "csv",
      "deliverables_list.csv"
    );
//    const accessibleFiles = await getAccessibleFiles(
//      userPermissionCSV,
//      deliverablesListCSV,
//      "194"
//    );
    const accessibleFiles = await loadCSV(deliverablesListCSV);
    const FileLeafRefSet = new Set();
    const accessibleFilesByFilters = accessibleFiles
      .filter((file) =>{
	if (!file.FileLeafRef) return false;
        const ext = path.extname(file.FileLeafRef).toLowerCase();
        if(allowedExtensions.includes(ext)){
          if(FileLeafRefSet.has(file.FileLeafRef)){
            return false;
          }
          FileLeafRefSet.add(file.FileLeafRef);
          return true;
        }
        return false;
      }
      )
      .map((file) => ({
        title: path.parse(file.FileLeafRef).name,
        region: cleanDocument(file.Region),
        country: cleanDocument(file.Country),
        strategyArea: cleanDocument(file.StrategyArea),
        documentType:
          extensionMapping[path.extname(file.FileLeafRef).toLowerCase()],
      }));
    res.status(200).json({
      files: accessibleFilesByFilters,
      message: "documents retrieved",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getFilters = async (req, res, next) => {
  try {
    const deliverablesListCSV = path.join(
      __dirname,
      "..",
      "csv",
      "deliverables_list.csv"
    );
    const filters = await fetchFilters(deliverablesListCSV, [
      "Region",
      "Country",
      "StrategyArea",
    ]);
    res.status(200).json({ filters: filters, message: "filters retrieved" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const cleanDocument = (document) => {
  if (document) {
    try {
      const jsonString = document.replace(/'/g, '"').replace(/"s/g, "'s");
      const cellValueArray = JSON.parse(jsonString);
      return cellValueArray;
    } catch (error) {
      console.log(`Error parsing JSON in column: `, error);
    }
  }
};

const fetchFilters = async (filepath, columnNames) => {
  return new Promise((resolve, reject) => {
    const uniqueValues = {};

    columnNames.forEach((columnName) => {
      uniqueValues[columnName] = new Set();
    });

    fs.createReadStream(filepath)
      .pipe(csv())
      .on("data", (row) => {
        columnNames.forEach((columnName) => {
          if (row[columnName]) {
            try {
              const jsonString = row[columnName].replace(/'/g, '"');
              const cellValueArray = JSON.parse(jsonString);
              if (Array.isArray(cellValueArray)) {
                cellValueArray.forEach((item) => {
                  if (item.LookupValue) {
                    uniqueValues[columnName].add(item.LookupValue);
                  }
                });
              } else
                console.log(
                  `Invalid JSON array structure in column ${columnName}:`,
                  row[columnName]
                );
            } catch (error) {
              console.log(`Error parsing JSON in column ${columnName}:`, error);
            }
          }
        });
      })
      .on("end", () => {
        const filters = columnNames.map((columnName) => ({
          column: columnName,
          values: Array.from(uniqueValues[columnName]),
        }));
        resolve(filters);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};







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
    const filteredChats = response.chats.filter((chat) => {
      return !chat.flag || chat.flag === false;
    });
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

// Retrieves a random set of questions from the database
exports.getRandomQuestions = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.query.userEmailId});
    if (!user) {
      const error = new Error("User Not Found");
      error.statusCode = 404;
      throw error;
    }

    const userPermissions = user.userPermissions;

    const randomQuestions = await Question.aggregate([
//      { $match: { docPermissions: { $in: userPermissions } } },
      { $unwind: "$questions" },
      { $sample: { size: 4 } },
      { $group:{
        _id: "$_id",
        documentName: {$first: '$documentName'},
        question: {$first: "$questions"},
//        docPermissions: {$first: "$docPermissions"}

      }},
    ]);

    const questions = randomQuestions.map((item) => item.question);

    res.status(200).json({
      message: "Random questions retrieved successfully",
      totalQuestions: questions.length,
      questions: questions,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Retrives qustions from the database that match the provided document names
exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documenNames Should Be a Non-Empty Array.");
      error.statusCode = 404;
      throw error;
    }
    const matchedQuestion = await Question.find({
      documentName: { $in: documentNames },
    });
    if (matchedQuestion.length === 0) {
      return res.status(200).json({
        message: "No Matching Documents Found.",
        questions: [],
      });
    }
    const allQuestions = matchedQuestion.reduce((acc, question) => {
      return acc.concat(question.questions);
    }, []);
    const uniqueQuestions = [...new Set(allQuestions)];

    const shuffledQuestions = uniqueQuestions.sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffledQuestions.slice(0, 4);

    res.status(200).json({
      message: "Matching Documents Found.",
      questions: limitedQuestions,
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










const fs = require("fs");
const csv = require("csv-parser");
const { permission } = require("process");

const loadCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const getUserPermissions = async (filePath, userId) => {
  try {
    const users = await loadCSV(filePath);
    const user = users.find((user) => user.UserLookupId.toString() === userId);
    if (user && user.Permissions) {
      const permissions = user.Permissions.split(";")
        .map((perm) => perm.trim())
        .filter(Boolean);

      return permissions.length > 0 ? permissions : null;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error loading user permissions: ", error);
    return [];
  }
};

const getAccessibleFiles = async (
  userPermissionsFilesPath,
  filesInfoFilesPath,
  userId
) => {
  try {
    const userPermissions = await getUserPermissions(
      userPermissionsFilesPath,
      userId
    );
    const files = await loadCSV(filesInfoFilesPath);
    const accessibleFiles = files.filter((file) => {
      if (
        !file.DeliverablePermissions ||
        file.DeliverablePermissions.trim() === ""
      ) {
        return true;
      }
      const filesPermissions = file.DeliverablePermissions.split(";")
        .map((perm) => perm.trim())
        .filter(Boolean);

      if (userPermissions === null) {
        return filesPermissions.length === 0;
      }

      return userPermissions.some((permission) =>
        filesPermissions.includes(permission)
      );
    });

    return accessibleFiles;
  } catch (error) {
    console.log("Error retrieving accessible files: ", error);
    return [];
  }
};

module.exports = { getAccessibleFiles, getUserPermissions, loadCSV };













import os
import logging
from datetime import datetime, timedelta

import pandas as pd
from dotenv import load_dotenv
from office365.graph_client import GraphClient

import sharepoint_file_acquisition
from ingest_document import ingest_files

load_dotenv()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(os.getcwd(), "Failed_files.log")),
        logging.StreamHandler(),
    ],
)

site_url = os.getenv("SHAREPOINT_SITE")
drive_id = os.getenv("DRIVE_ID")
parent_dir = os.path.dirname(os.getcwd())


token, token_expires_at = sharepoint_file_acquisition.acquire_token_func()
client = GraphClient(lambda: token)


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

#                Remove the row corresponding to the successfully processed file.
                failed_files_csv.drop(index, inplace=True)

                # Save the updated CSV file after each successful processing.
                failed_files_csv.to_csv("failed_files_1.csv", index=False)
                logging.info(f"File {file_id} removed from 'failed_files.csv'.")
            except Exception as e:
                # Log an error for files that fail to process.
                logging.error(f"Failed to process file {file_id}: {e}")

#        sharepoint_file_acquisition.update_and_save_docstore(
#             "docstores_normal_rag",
#             os.path.join(parent_dir, "fast", "docstores", "GatesVentures_Scientia.pkl"),
#             os.path.join(os.getcwd(), "backup", "normal"),
#         )
#        sharepoint_file_acquisition.update_and_save_docstore(
#             "docstores_summary_rag",
#             os.path.join(
#                 parent_dir, "fast", "docstores", "GatesVentures_Scientia_Summary.pkl"
#             ),
#             os.path.join(os.getcwd(), "backup", "summary"),
#         )
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

CONVERSION_TIMEOUT = 600

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
from langchain_core.documents import Document
from typing import Any, List, Dict, AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from fastapi import FastAPI, HTTPException, Request
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from fastapi.responses import JSONResponse, StreamingResponse
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
CHROMA_CLIENT = chromadb.HttpClient(host="10.225.1.6", port=8000, settings=settings)

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
    "https://evalueserveglobal.sharepoint.com",
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


# Initialize mongoDB client and collections
collection_chat = None


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

    if type_of_doc == "normal":
        text_message = {
            "type": "text",
            "text": (
                "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\n"
                "When responding to a user's query, please ensure that your response:\n"
                "Is informative and comprehensive.\n"
                "Is clear and concise.\n"
                "Is relevant to the topic at hand.\n"
                "Adheres to the guidelines provided in the initial prompt.\n"
                "Is aligned with the specific context of the Scientia SharePoint portal.\n\n"
                "Remember to:\n"
                "Avoid providing personal opinions or beliefs.\n"
                "Base your responses solely on the information provided.\n"
                "Be respectful and polite in all interactions.\n"
                "Leverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\n"
                "From the given context, please provide a well-articulated response to the asked question.\n"
                "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
                "Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n"
                "Maintain context from previous conversations to ensure coherent and relevant responses.\n\n"
                "Never answer from your own knowledge source, always asnwer from the provided context."
                f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
            ),
        }
    else:
        text_message = {
            "type": "text",
            "text": (
                "You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.\n\n"
                "When responding to a user's query, please ensure that your response:\n"
                "Is informative and comprehensive.\n"
                "Is clear and concise.\n"
                "Is relevant to the topic at hand.\n"
                "Adheres to the guidelines provided in the initial prompt.\n"
                "Is aligned with the specific context of the Scientia SharePoint portal.\n\n"
                "Remember to:\n"
                "Avoid providing personal opinions or beliefs.\n"
                "Base your responses solely on the information provided.\n"
                "Be respectful and polite in all interactions.\n"
                "Leverage the specific knowledge and resources available within the Scientia SharePoint portal.\n\n"
                "Task: Generate a cohesive and unified summary of the provided content, focusing on the business context and avoiding unnecessary formatting details.\n\n"
                "Guidelines : \n"
                "Avoid slide-by-slide or section-by-section breakdowns.\n"
                "Present the summary as a continuous flow.\n"
                "Ensure a smooth, coherent narrative.\n"
                "Omit concluding phrases like 'Thank you.'\n"
                "Base your response solely on the provided content.\n"
                "Maintain context from previous conversations.\n"
                "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n\n"
                "Input:\n"
                f"User's question: {data_dict.get('question', 'No question provided')}\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }\n"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
                "Output:\n"
                "Summary : A comprehensive and accurate response to the user's question, presented in a clear and concise format with appropriate headings, subheadings, bullet points, and spacing.\n\n"
            ),
        }

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
    prompt_text = (
        "Given the following question, create a concise and informative title that accuratelt reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n"
        "{element}"
    )

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_title = {"element": lambda x: x} | prompt | llm_gpt
    response = new_title.invoke(question)

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
        "user": message.question,
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
        filters (list): List of filter values.

    Returns:
        dict: The search kwargs for filtering.
    """
    if len(filters) == 1:
        filter_condition = {"Title": filters[0]}
    elif isinstance(filters, list):
        or_conditions = [{"Title": v} for v in filters]
        filter_condition = {"$or": or_conditions}

    search_kwargs = {"filter": filter_condition}

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

    prompt_text = """
        AI Assistant Instructions

        Role and Primary Task:
        You are an advanced AI assistant with exceptional analytical and decision-making capabilities. Your primary task is to accurately interpret user queries, determine the most appropriate action, and generate informative and relevant responses. Your default source of information is the internal knowledge base.
        
        General Behavior:
        1. Respond to greetings warmly and briefly.
        2. If asked about your identity or capabilities, explain concisely that you're a RAG (Retrieval-Augmented Generation) chatbot with access to an internal knowledge base.
        3. Classify user input query intent into one of these categories: greeting/salutation, normal_rag, summary_rag.
        
        Strict Decision Protocol:
        
        1. normal_RAG (DEFAULT CATEGORY):
           - Purpose: Answering most questions using the internal knowledge base.
           - Use when: The query can be answered using internal information, which covers a wide range of topics including company data, reports, policies, product information, etc.
           - Always prioritize this category for most queries unless the query explicitly falls into another category.
           - This category also includes context-dependent follow-up questions like "Tell me more about it" or "Can you elaborate on that?"
        
        2. summary_rag:
           - Purpose: Addressing questions about overall content, main ideas, or summaries of entire documents from the internal knowledge base.
           - Use when: The query explicitly requires a broad understanding or overview of a document's content as a whole.
           - Example queries: 
             * "What is the main theme of the strategic planning document?"
             * "Summarize the key points of the entire document."
             * "Give me an overview of this document's content."
             * "What are the main topics covered throughout this document?"
        
        3. direct_response:
           - Purpose: Handling greetings, casual conversation, or very simple queries.
           - Use when: The user input is a greeting, expression of gratitude, or a very simple question that doesn't require accessing any knowledge base.
           - Example queries:
             * "Hello!"
             * "How are you?"
             * "Thank you for your help."
        
        Response Protocol:
        1. Always default to using the normal_rag category unless the query clearly falls into another category.
        2. Use the summary_rag category only when explicitly asked for document-wide summaries or overviews.
        3. Respond directly without using any tool for greetings, salutations, and casual conversation.
        4. For any responses:
           - Synthesize, process, or extract information to provide the final answer.
           - Do simply relay on raw data.
        
        Remember: 
        1. Your primary source of information is the internal knowledge base.
        2. Consider Previous Conversation before returning any response.
        
        User Query: "{question}"
        
        Previous Conversation: "{chat_history}"
        
        Please respond with the appropriate keyword based on the analysis of the user query:
        - "normal_rag"
        - "summary_rag"
        - "direct_response"
        
        """

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

    prompt_text = """
            You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.
            When responding to a user's query, please ensure that your response:
            Is informative and comprehensive.
            Is clear and concise.
            Is relevant to the topic at hand.
            Adheres to the guidelines provided in the initial prompt.
            Is aligned with the specific context of the Scientia SharePoint portal.
            Remember to:
            Avoid providing personal opinions or beliefs.
            Base your responses solely on the information provided.
            Be respectful and polite in all interactions.
            Leverage the specific knowledge and resources available within the Scientia SharePoint portal.
            Given a chat history and the latest user question which might reference context in the chat history, \
            formulate a standalone question which can be understood without the chat history. Do NOT answer the question,\
            just reformulate it if needed and otherwise return it as is. Don't provide anything else, just provide the question\
            Chat History\
            {chat_history}
            User Question : \
            {question}
        """

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


# @app.middleware("http")
# async def validate_origins_and_cors(request: Request, call_next):
#     # security_header = request.headers.get("X-Security-Header")
#     # if security_header is None or security_header != os.environ.get("SECURITY_HEADER"):
#     #     return JSONResponse(
#     #         status_code=403, content={"message": "Access Denied: Authentication Failed"}
#     #     )

#     if request.method == "OPTIONS":
#         response = JSONResponse(status_code=204)
#     else:
#         response = await call_next(request)

#     # Add CORS headers to the response
#     response.headers["Access-Control-Allow-Origin"] = allowed_origins
#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
#     response.headers["Access-Control-Allow-Headers"] = (
#         "Content-Type, Authorization, X-Security-Header"
#     )

#     return response

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

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )

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
                "No",
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

            search_kwargs = (
                create_search_kwargs(message.filters) if message.filters else {}
            )
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

            prompt_text = """
                Please answer the following question. \
                Use your own knowledge to answer the question. \
                Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed.
                Conversation history  \
                {chat_history}
                User Question : \
                {question}
            """

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

            prompt_text = """
                You are a Scientia Knowledge Bot, designed to provide informative and comprehensive responses specific to the Scientia sharepoint portal.
                When responding to a user's query, please ensure that your response:
                Is informative and comprehensive.
                Is clear and concise.
                Is relevant to the topic at hand.
                Adheres to the guidelines provided in the initial prompt.
                Is aligned with the specific context of the Scientia SharePoint portal.
                Remember to:
                Avoid providing personal opinions or beliefs.
                Base your responses solely on the information provided.
                Be respectful and polite in all interactions.
                Leverage the specific knowledge and resources available within the Scientia SharePoint portal.
                The following is a conversation with a highly intelligent AI assistant. \
                The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \
                When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

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
            else message.question
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


# if __name__ == "__main__":
#     import uvicorn

#     uvicorn.run(app, host="0.0.0.0", port=6969)





















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
    chunk_store = load_full_docstore(os.path.join(os.getcwd(), chunk_store_path))

    if os.path.exists(main_store_path):
        main_store = load_existing_docstore(main_store_path)
        rotate_backups(backup_dir, main_store_path)
    else:
        main_store = InMemoryStore()

    main_store.store.update(chunk_store.store)
    save_full_docstore(main_store, main_store_path)


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

        failed_files_csv = pd.read_csv("failed_files.csv")
        deliverables_list_csv = pd.read_csv("deliverables_list.csv")
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



