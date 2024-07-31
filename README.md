exports.putChatFeedbck = async (req, res, next) => {
  const feedback = req.body.feedback;
  const chatId = req.body.chatId;
  const answer = req.body.answer;
  //need to add messageId instead of answer
  const reason = req.body.reason || "";
  console.log(feedback)
  try {
    const chatDocument = await Chat.findById(chatId);
    if (!chatDocument) {
      const error = new Error("Chat Not Found");
      error.statusCode = 404;
      throw error;
    }
    const chat = chatDocument.chats.find(chat => chat.ai === answer);
    if (!chat) {
      const error = new Error("Answer Not Found in Chat");
      error.statusCode = 404;
      throw error;
    }
    chat.feedback = feedback;
    if (reason.length > 0) {
      chat.reason = reason;
    }
    await chatDocument.save();
    res.status(200).json({
      message: "Feedback Updated",
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}
