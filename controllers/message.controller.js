const ChatService = require("../services/ChatService");
const Doctor = require("../models/Doctor");

const getMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Get doctor profile from user ID
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const result = await ChatService.getMessages(
      roomId,
      doctorProfile._id.toString(),
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    if (error.message === "Access denied") {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === "Room not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get doctor profile from user ID
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    // Get unread messages count
    const unreadMessages = await ChatService.getUnreadMessages(
      roomId,
      doctorProfile._id.toString()
    );

    res.json({
      success: true,
      unreadCount: unreadMessages ? unreadMessages.length : 0
    });
  } catch (error) {
    if (error.message === "Access denied") {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === "Room not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getMessage, getUnreadCount };
