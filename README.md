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
        type: Boolean,
        required: false
      }
    },
  ],
  bookmark: {
    type: Boolean,
    required: false,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Chats", chatSchema);



const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const questionSchema = new Schema({
    documentName: {
        type: String,
        required: true,
    },
    questions: [
        String
    ]
}, { timestamps: true });

module.exports = mongoose.model("Questions", questionSchema);



const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  userFullName: {
    type: String,
    required: true,
  },
  userPermissions: {
    type: [String],
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

