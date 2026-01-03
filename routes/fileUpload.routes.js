const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/auth");
const Message = require("../models/Message");
const Room = require("../models/Room");
const Doctor = require("../models/Doctor");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads"); // Fixed path
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed"));
    }
  },
});

// Upload files endpoint
router.post("/upload", protect, upload.array("files", 10), async (req, res) => {
  try {
    const { roomId, message } = req.body;

    // Get doctor profile
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    // Verify doctor is part of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const doctorId = doctorProfile._id.toString();
    if (
      room.doctorA.toString() !== doctorId &&
      room.doctorB.toString() !== doctorId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Process uploaded files
    const attachments = req.files.map((file) => {
      const fileType = file.mimetype.startsWith("image/")
        ? "image"
        : "document";

      return {
        type: fileType,
        url: `/uploads/${file.filename}`,
        filename: file.originalname,
        size: file.size,
      };
    });

    // Create message with attachments
    const newMessage = await Message.create({
      room: roomId,
      sender: doctorProfile._id,
      content: message || "",
      isRead: false,
      attachments,
      messageType: "file",
    });

    const populatedMessage = await newMessage.populate(
      "sender",
      "firstName lastName"
    );

    res.status(201).json({
      message: "Files uploaded successfully",
      data: {
        id: populatedMessage._id,
        roomId: populatedMessage.room,
        sender: populatedMessage.sender,
        content: populatedMessage.content,
        createdAt: populatedMessage.createdAt,
        isRead: populatedMessage.isRead,
        attachments: populatedMessage.attachments,
        messageType: populatedMessage.messageType,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
