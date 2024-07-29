exports.putChatFeedbck = async (req, res, next) => {
  const feedback = req.body.feedback;
  const chatId = req.body.chatId;
  const answer = req.body.answer;
  try {
    
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}


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



