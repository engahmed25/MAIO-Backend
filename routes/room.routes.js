const express = require("express");
const { getAllRooms, createRoom } = require("../controllers/room.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Create a room
router.post(
  "/create",
  (req, res, next) => {
    // Debug middleware - log what was received
    console.log("Request body:", req.body);
    next();
  },
  protect,
  createRoom
);

// Get all rooms for a doctor
router.get("/my-rooms", protect, getAllRooms);

module.exports = router;
