exports.getAllChats = async (req, res, next) => {
  const userEmailId = req.query.userEmailId;
  const fullName = req.query.userName;
  // const offset = parseInt(req.query.offset) || 0;
  // const limit = 10;
  const userLookupId = req.query.userLookupId
  const user = await User.findOne({ email: userEmailId });
  try {
    if (!user) {
      const userPermissionCSV = path.join(
        __dirname,
        "..",
        "csv",
        "users_permission.csv"
      );
      const permission = await getUserPermissions(userPermissionCSV, "194");
      const newUser = new User({
        userFullName: fullName,
        email: userEmailId,
        userPermissions: permission,
      });
      await newUser.save();
      res.status(200).json({ chats: [], message: "new user created" });
    } else {
      const chats = await Chat.find({ userEmailId: userEmailId }).sort({
        updatedAt: -1,
      });
      // .skip(offset).limit(limit);
      const chatList = chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        updatedAt: chat.updatedAt,
        bookmark: chat.bookmark,
      }));
      res.status(200).json({ chats: chatList });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
