    async def content_generator_salutation(
        message: Message, title: str
    ) -> AsyncGenerator[str, None]:
        formatted_chat_history = format_chat_history(message.chatHistory)
        ai_text = ""
        chat_id = None

        model = (
            AzureChatOpenAI(
                api_key=os.environ["AZURE_OPENAI_API_KEY"],
                openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            )
            if message.llm == "GPT"
            else ChatOllama(base_url=base_url, model=llama3_1)
        )

        prompt_text = """
            The following is a conversation with a highly intelligent AI assistant. \
            The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \
            When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\
            Conversation history \
            {chat_history}
            User Question : \
            {question}
        """

        prompt = ChatPromptTemplate.from_template(prompt_text)

        chain = (
            {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
            | prompt
            | model
            | StrOutputParser()
        )

        async for chunk in chain.astream(message.question):
            ai_text += chunk
            yield json.dumps({"type": "text", "content": chunk})

        if message.chatId:
            if message.regenerate == "Yes":
                collection_chat.update_one(
                    {"_id": message.chatId}, {"$pop": {"chats": 1}}
                )

            if message.feedbackRegenerate == "Yes":
                chat = collection_chat.find_one({"_id": message.chatId})
                if chat and "chats" in chat and len(chat["chats"]) > 0:
                    last_chat_index = len(chat["chats"]) - 1
                    collection_chat.update_one(
                        {
                            "_id": message.chatId,
                            f"chats.{last_chat_index}.flag": {"$exists": False},
                        },
                        {"$set": {f"chats.{last_chat_index}.flag": True}},
                    )

            new_chat = {
                "user": message.question,
                "ai": ai_text,
            }

            collection_chat.update_one(
                {"_id": message.chatId}, {"$push": {"chats": new_chat}}
            )
            chat_id = message.chatId
        else:
            new_chat = {
                "userEmailId": message.userEmailId,
                "title": title,
                "chats": [
                    {
                        "user": message.question,
                        "ai": ai_text,
                    }
                ],
            }
            inserted_chat = collection_chat.insert_one(new_chat)
            message_id = inserted_chat["chats"][0]["_id"]
            chat_id = inserted_chat.inserted_id

        yield json.dumps({"type": "chatId", "content": str(chat_id)})
        yield json.dumps({"type": "sources", "content": ""})



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
    const messageId = savedChat.chats[0]._id;
    res.status(200).json({
      id: savedChat._id,
      ai: aiResponse,
      sources: sources,
      messageId: messageId
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
