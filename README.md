exports.postRegenerate = async (req, res, next) => {
  const question = req.body.question;
  const chatId = req.body.chatId;
  let chat_history = req.body.chatHistory.slice() || [];
  // const userLookupId = req.body.userLookupId
  const filters = req.body.filters || [];
  const stores = req.body.stores;
  const image = req.body.image;
  const llm = req.body.llm;
  try {
    const userPermissions = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
    const response = await Chat.findOne({ _id: chatId });
    if (!response) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
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
      user: question, ai: aiResponse, sources: sources
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
