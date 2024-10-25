router.get("/user-create", chattingController.postUserCreate);



exports.getAllChats = async (req, res, next) => {
  try {
    const userEmailId = req.query.userEmailId;
    const chats = await Chat.find({ userEmailId: userEmailId }).sort({
      updatedAt: -1,
    });
    const chatList = chats.map((chat) => ({
      id: chat._id,
      title: chat.title,
      updatedAt: chat.updatedAt,
      bookmark: chat.bookmark,
    }));
    res.status(200).json({ chats: chatList });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};



exports.postUserCreate = async (req, res, next) => {
  try {
    const userLookupId = req.body.userLookupId;
    const userEmailId = req.body.userEmailId;
    const fullName = req.body.userName;
    const user = await User.findOne({ email: userEmailId });

    const userPermissionCSV = path.join(
      __dirname,
      "..",
      "csv",
      "users_permission.csv"
    );
    const permission = await getUserPermissions(
      userPermissionCSV,
      userLookupId
    );
    const csvStats = fs.statSync(userPermissionCSV);
    const csvLastModified = csvStats.mtime.getTime();
    if (!user) {
      const newUser = new User({
        userFullName: fullName,
        email: userEmailId,
        userPermissions: permission,
      });
      await newUser.save();
      res.status(200).json({ message: "new user created" });
    } else {
      const userLastUpdated = new Date(user.updatedAt).getTime();

      if (userLastUpdated < csvLastModified) {
        user.userPermissions = permission;
        await user.save();
      }
      res.status(200).json({ message: "user updated" });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
