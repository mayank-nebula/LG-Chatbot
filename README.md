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


def update_chat(message: Message, ai_text: str, chat_id: str, flag: bool, sources=None):
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

    collection_chat.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$push": {"chats": new_chat},
            "$set": {"updatedAt": datetime.utcnow()},
        },
    )

    chat = collection_chat.find_one({"_id": ObjectId(chat_id)})
    if chat and "chats" in chat:
        message_id = chat["chats"][-1]["_id"]

    return message_id
module.exports = mongoose.model("Chats", chatSchema);
