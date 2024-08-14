const express = require("express");

const chattingController = require("../controller/chatting");

const router = express.Router();

router.get("/all-chats", chattingController.getAllChats);

router.get("/fetch-chat", chattingController.getSpecificChat);

router.get("/random-question", chattingController.getRandomQuestions);

router.post("/filtered-question", chattingController.postFilteredQuestion);

router.post("/storeQuestionsInMongo", chattingController.postQuestionsToMongo);

router.put("/change-title", chattingController.putChangeTitle);

router.put("/bookmark", chattingController.putBookmark);

router.put("/chat-feedback", chattingController.putChatFeedbck);

router.delete("/delete-chat/:chatId", chattingController.deleteChat);

module.exports = router;
