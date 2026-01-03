const express = require("express");
const { getMessage } = require("../controllers/message.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Get messages for a room
router.get("/:roomId", protect, getMessage);

module.exports = router;
