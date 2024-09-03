const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const path = require("path");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const app = express();
const allowedOrigins = [
  "https://evalueserveglobal.sharepoint.com",
  "https://gatesventures.sharepoint.com",
];

const chatRoutes = require("./routes/chatting");
const documentRoutes = require("./routes/document");
const privateKey = fs.readFileSync(path.join(__dirname, "certificates", "private.key"));
const certificate = fs.readFileSync(
  path.join(__dirname, "certificates", "certificate.cert")
);

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Security-Header"],
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       const allowedOrigins = [
//         "https://evalueserveglobal.sharepoint.com",
//         "https://gatesventures.sharepoint.com/sites/scientia/_layouts/15/workbench.aspx",
//         "https://gatesventures.sharepoint.com",
//       ];
//       if (allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Access Denied: Authentication Failed"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Security-Header"],
//     credentials: true,
//   })
// );

// app.use((req, res, next) => {
//   const security_header = req.get("X-Security-Header");
//   if (security_header && security_header === process.env.SECURITY_HEADER) {
//     next();
//   } else {
//     res.status(403).json({ message: "Access Denied: Authentication Failed" });
//   }
// });

app.use("/api", chatRoutes);
app.use("/api", documentRoutes);
app.use("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Express Server",
  });
});

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  res.status(statusCode).json({
    message: message,
  });
});

mongoose
  .connect(process.env.MONGO_API_KEY)
  .then((result) => {
    const server = https
      .createServer({ key: privateKey, cert: certificate }, app)
      .listen(8080, "0.0.0.0", () => {
        console.log("Server is running on port 8080");
      });
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));





const { getAccessibleFiles } = require("../utils/userPermissions");
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
    const accessibleFiles = await getAccessibleFiles(
      userPermissionCSV,
      deliverablesListCSV,
      "194"
    );
    const accessibleFilesByFilters = accessibleFiles
      .filter((file) =>
        allowedExtensions.includes(
          path.extname(file.FileLeafRef).toLowerCase()
        )
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

exports.getAllChats = async (req, res, next) => {
  const userEmailId = req.query.userEmailId;
  const fullName = req.query.userName;
  // const offset = parseInt(req.query.offset) || 0;
  // const limit = 10;
  const userLookupId = req.query.userLookupId
  const user = await User.findOne({ email: userEmailId });
  try {
    if (!user) {
      const userPermissionCSV = path.join(
        __dirname,
        "..",
        "utils",
        "users_permission.csv"
      );
      const permission = await getUserPermissions(userPermissionCSV, "194");
      const newUser = new User({
        userFullName: fullName,
        email: userEmailId,
        userPermissions: permission,
      });
      await newUser.save();
      res.status(200).json({ chats: [], message: "new user created" });
    } else {
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

exports.getRandomQuestions = async (req, res, next) => {
  try {
    const randomQuestions = await Question.aggregate([
      { $unwind: "$questions" },
      { $sample: { size: 4 } },
      { $project: { _id: 0, question: "$questions" } },
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
    const user = users.find((user) => user.UserLookupId === userId);
    return user ? user.Permissions.split(";") : [];
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
    if (userPermissions.length === 0) {
      console.log(`No permissions found for user ID ${userId}`);
      return [];
    }

    const files = await loadCSV(filesInfoFilesPath);
    const accessibleFiles = files.filter((file) => {
      const filesPermissions = file.DeliverablePermissions.split(";");
      return (
        (filesPermissions.length == 1 && filesPermissions[0] === "") ||
        userPermissions.some((permission) =>
          filesPermissions.includes(permission)
        )
      );
    });

    return accessibleFiles;
  } catch (error) {
    console.log("Error retrieving accessible files: ", error);
    return [];
  }
};

module.exports = { getAccessibleFiles, getUserPermissions };








