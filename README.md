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
    },
  ],
});

module.exports = mongoose.model("Chats", chatSchema);
