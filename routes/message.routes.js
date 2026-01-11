const express = require("express");
const { getMessage, getUnreadCount } = require("../controllers/message.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Get messages for a room
router.get("/:roomId", protect, getMessage);

// Get unread message count for a room
router.get("/:roomId/unread-count", protect, getUnreadCount);

module.exports = router;
