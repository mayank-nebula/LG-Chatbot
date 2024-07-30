exports.getLastChatSources = async (req, res, next) => {
  const chatId = req.query.chatId;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      const error = new Error('Chat not found');
      error.statusCode = 404;
      throw error;
    }

    const lastChat = chat.chats[chat.chats.length - 1];
    if (!lastChat) {
      const error = new Error('No chats found in this chat document');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ sources: lastChat.sources });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
