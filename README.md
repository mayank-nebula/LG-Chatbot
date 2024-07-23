exports.postNewChatting = async (req, res, next) => {
  try {
    const question = req.body.question;
    let chat_history = req.body?.chat_history?.slice() || [];
    // const userLookupId = req.body.userLookupId
    const filters = req.body.filters || [];
    const userPermissions = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
    const stores = req.body.stores;
    const image = req.body.image;
    const llm = req.body.llm;

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
    const newChat = new Chat({
      userEmailId: req.body.userEmailId,
      title: question,
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
  try {
    const question = req.body.question;
    const chatId = req.body.chatId;
    let chat_history = req.body.chatHistory.slice() || [];
    // const userLookupId = req.body.userLookupId
    const filters = req.body.filters || [];
    const userPermissions = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
    const stores = req.body.stores;
    const image = req.body.image;
    const llm = req.body.llm;

    const response = await Chat.findOne({ _id: chatId });
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
