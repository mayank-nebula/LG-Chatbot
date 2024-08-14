const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
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
        user: { type: String, required: false },
        ai: { type: String, required: false },
        sources: {
          type: Object,
          required: false,
          default: {},
        },
        feedback: {
          type: String,
          required: false,
        },
        reason: {
          type: String,
          required: false,
        },
        flag: {
          type: Boolean,
          required: false,
        },
      },
    ],
    bookmark: {
      type: Boolean,
      required: false,
      default: false,
    },
    filtersMetadata: [
      {
        type: Map,
        of: [String],
        required: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chats", chatSchema);
