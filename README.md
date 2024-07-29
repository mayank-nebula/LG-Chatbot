exports.getAllChats = async (req, res, next) => {
  try {
    const userEmailId = req.query.userEmailId;
    const fullName = req.query.userName;
    // const userLookupId = req.query.userLookupId
    const user = await User.findOne({ email: userEmailId });
    if (!user) {
      const permission = await getUserPermissions('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '194') //Need to change 232 to userLookupId (userLookupId)
      const newUser = new User({
        userFullName: fullName,
        email: userEmailId,
        userPermissions: permission
      });
      await newUser.save();
      res.status(200).json({ chats: [], message: "new user created" });
    }
    else {
      const chats = await Chat.find({ userEmailId: userEmailId }).sort({ _id: -1 });
      const chatList = chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
      }));
      res.status(200).json({ chats: chatList });
    }
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
