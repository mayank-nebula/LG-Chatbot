const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema({
  userEmailId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  chats: [
    {
      user: { type: String, required: true },
      ai: { type: String, required: true },
      sources: {
        type: Object,
        required: false,
        default: {}
      },
      feedback: {
        type: String,
        required: false
      },
      reason: {
        type: String,
        required: false
      },
      flag: {
        type: String,
        required: false
      }
    },
  ],
  bookmark: {
    type: Boolean,
    required: false,
    deafult: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Chats", chatSchema);


exports.getSpecificChat = async (req, res, next) => {
  const chatId = req.query.chatId;
  try {
    const response = await Chat.findOne({ _id: chatId, userEmailId: req.query.userEmailId });
    if (!response) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    res.status(201).json({
      message: "Chat extracted.",
      title: response.title,
      chats: response.chats,
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
