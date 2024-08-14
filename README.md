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
  // const userLookupId = req.query.userLookupId
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

exports.postQuestionsToMongo = async (req, res, next) => {
  const documentMap = new Map();
  const questionCSV = path.join(__dirname, "..", "utils", "output.csv");
  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(questionCSV)
        .pipe(csv())
        .on("data", (row) => {
          const documentName = row["title"];
          const question = row["Question"];

          if (!documentName || !question) {
            console.warn("Skipping row due to missing data:", row);
            return;
          }

          if (documentMap.has(documentName)) {
            documentMap.get(documentName).push(question);
          } else {
            documentMap.set(documentName, [question]);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const savedDocuments = await Promise.all(
      Array.from(documentMap).map(async ([documentName, questions]) => {
        if (questions.length === 0) {
          console.warn(
            `Skipping document ${documentName} due to no valid questions`
          );
          return null;
        }
        const questionDoc = new Question({ documentName, questions });
        return questionDoc.save();
      })
    );

    const successfulSaves = savedDocuments.filter((doc) => doc !== null);

    res.status(200).json({
      message: "Documents Added Successfully",
      count: successfulSaves.length,
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
