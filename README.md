const fs = require("fs");
const path = require("path");

const axios = require("axios");
const csv = require("csv-parser");

const Chat = require("../models/chat");
const User = require("../models/user");
const Question = require("../models/question");
const { getUserPermissions } = require("../utils/userPermissions")

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
      const permission = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
      const newUser = new User({
        userFullName: fullName,
        email: userEmailId,
        userPermissions: permission
      });
      await newUser.save();
      res.status(200).json({ chats: [], message: "new user created" });
    }
    else {
      const chats = await Chat.find({ userEmailId: userEmailId }).sort({ updatedAt: -1 });
      // .skip(offset).limit(limit);
      const chatList = chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        updatedAt: chat.updatedAt,
        bookmark: chat.bookmark
      }));
      res.status(200).json({ chats: chatList });
    }
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSpecificChat = async (req, res, next) => {
  const chatId = req.query.chatId;
  try {
    const response = await Chat.findOne({ _id: chatId, userEmailId: req.query.userEmailId });
    if (!response) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    const filteredChats = response.chats.filter(chat => {
      return !chat.flag || chat.flag === false;
    })
    res.status(201).json({
      message: "Chat extracted.",
      title: response.title,
      chats: filteredChats,
      updatedAt: response.updatedAt,
      createdAt: response.createdAt
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postNewChatting = async (req, res, next) => {
  const question = req.body.question;
  let chat_history = req.body?.chat_history?.slice() || [];
  // const userLookupId = req.body.userLookupId
  const filters = req.body.filters || [];
  const stores = req.body.stores;
  const image = req.body.image;
  const llm = req.body.llm;
  try {
    const userPermissions = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
    const flaskResponse = await axios.post("/flask", {
      question,
      chat_history,
      userPermissions,
      filters,
      stores,
      image,
      llm
    });
    const aiResponse = flaskResponse.data.response;
    const sources = flaskResponse.data.sources || {};
    const title = flaskResponse.data.title;
    const newChat = new Chat({
      userEmailId: req.body.userEmailId,
      title: title,
      chats: [{
        user: question, ai: aiResponse, sources: sources
      }],
    });
    const savedChat = await newChat.save();
    res.status(200).json({
      id: savedChat._id,
      ai: aiResponse,
      sources: sources
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postExistingChatting = async (req, res, next) => {
  const question = req.body.question;
  const chatId = req.body.chatId;
  let chat_history = req.body.chatHistory.slice() || [];
  // const userLookupId = req.body.userLookupId
  const filters = req.body.filters || [];
  const stores = req.body.stores;
  const image = req.body.image;
  const llm = req.body.llm;
  const regenerate = req.body.regenerate || "No";
  const feedbackRegenerate = req.body.feedbackRegenerate || "No";
  // console.log(chatId)
  try {
    const userPermissions = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
    const response = await Chat.findOne({ _id: chatId });
    if (!response) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    if (regenerate === "Yes" && response.chats.length > 0) {
      response.chats.pop();
    }
    if (feedbackRegenerate === "Yes" && response.chats.length > 0) {
      const lastChat = response.chats[response.chats.length - 1];
      lastChat.flag = true;
    }
    const flaskResponse = await axios.post("/flask", {
      question,
      chat_history,
      userPermissions,
      filters,
      stores,
      image,
      llm
    });
    const aiResponse = flaskResponse.data.response;
    const sources = flaskResponse.data.sources || [];
    response.chats.push({
      user: question,
      ai: aiResponse,
      sources: sources
    });
    await response.save();
    res.status(200).json({
      ai: aiResponse,
      sources: sources,
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.handlingFeedback = async (req, res, next) => {
  const { value, message } = req.body;
  try {
    res.status(200).json({
      message: `Feedback sent: (${value})`
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.putChangeTitle = async (req, res, next) => {
  const title = req.body.title;
  const chatId = req.body.chatId;
  try {
    const updatedTitle = await Chat.findByIdAndUpdate(chatId, { title }, { new: true });
    if (!updatedTitle) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Chat Updated",
      chatId: chatId,
      title: title
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

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
      message: "Chat Deleted"
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

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
    const updatedChat = await Chat.findByIdAndUpdate(chatId, { bookmark: newBookmark }, { new: true });
    res.status(200).json({
      message: "Bookmark Added",
      // updatedChat: updatedChat
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.putChatFeedbck = async (req, res, next) => {
  const feedback = req.body.feedback;
  const chatId = req.body.chatId;
  const answer = req.body.answer;
  const reason = req.body.reason || "";
  try {
    const chatDocument = await Chat.findById(chatId);
    if (!chatDocument) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    const chat = chatDocument.chats.find(chat => chat.ai === answer);
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
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documenNames Should Be a Non-Empty Array.");
      error.statusCode = 404;
      throw error;
    }
    const matchedQuestion = await Question.find({ documentName: { $in: documentNames } });
    if (matchedQuestion.length === 0) {
      return res.status(200).json({
        questions: [],
        message: "No Matching Documents Found."
      })
    }
    const allQuestions = matchedQuestion.reduce((acc, question) => {
      return acc.concat(question.questions);
    }, []);
    const uniqueQuestions = [...new Set(allQuestions)];
    res.status(200).json({
      questions: uniqueQuestions,
      message: "Matching Documents Found."
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.postQuestionsToMongo = async (req, res, next) => {
  const documentMap = new Map();
  fs.createReadStream('/home/Mayank.Sharma/GV_Test/backend/express/utils/finals_with_keys.csv')
    .pipe(csv())
    .on("data", (row) => {
      const documentName = row["key"];
      const question = row["Question"];

      if (documentMap.has(documentName)) {
        documentMap.get(documentName).add(question);
      } else {
        documentMap.set(documentName, new Set[(question)]);
      }
    })
    .on("end", async () => {
      for (const [documentName, questionSet] of documentMap) {
        const questions = Array.from(questionSet);

        const question = new Question({
          documentName,
          questions
        });

        try {
          await question.save();
          res.status(200).json({
            message: "Document Added"
          })
        } catch (err) {
          console.log(err);
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        }
      }
    });

}
