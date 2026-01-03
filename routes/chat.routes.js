const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const chatController = require("../controllers/chat.controller");

router.get("/rooms/:roomId/messages", auth, chatController.getRoomMessages);

module.exports = router;
