exports.postNewChatting = async (req, res, next) => {
  const question = req.body.question;
  let chat_history = req.body?.chat_history?.slice() || [];
  // const userLookupId = req.body.userLookupId
  const filters = req.body.filters || [];
  const stores = req.body.stores;
  const image = req.body.image;
  const llm = req.body.llm;
  // console.log(llm,stores,image);
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
        type: Boolean,
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
