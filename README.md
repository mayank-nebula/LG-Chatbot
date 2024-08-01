if message.regenerate == "Yes":
                    collection_chat.update_one(
                        {"_id": ObjectId(message.chatId)},
                        {
                            "$pop": {"chats": 1},
                            "$set": {"updatedAt": datetime.utcnow()},
                        },
                    )

                if message.feedbackRegenerate == "Yes":
                    chat = collection_chat.find_one({"_id": ObjectId(message.chatId)})
                    if chat and "chats" in chat and len(chat["chats"]) > 0:
                        last_chat_index = len(chat["chats"]) - 1
                        collection_chat.update_one(
                            {
                                "_id": ObjectId(message.chatId),
                                f"chats.{last_chat_index}.flag": {"$exists": False},
                            },
                            {
                                "$set": {
                                    f"chats.{last_chat_index}.flag": True,
                                    "updatedAt": datetime.utcnow(),
                                }
                            },
                        )


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
