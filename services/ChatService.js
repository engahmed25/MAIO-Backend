// services/ChatService.js

const Room = require("../models/Room");
const Message = require("../models/Message");

class ChatService {
  /**
   * Verify and join room
   */
  async joinRoom(roomId, doctorId) {
    const room = await Room.findById(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    // Check if this doctor is part of the room
    const isDoctorA = room.doctorA.toString() === doctorId.toString();
    const isDoctorB = room.doctorB.toString() === doctorId.toString();

    if (!isDoctorA && !isDoctorB) {
      throw new Error("Access denied");
    }

    return room;
  }

  /**
   * Get unread messages for a doctor in a room
   */
  async getUnreadMessages(roomId, doctorId) {
    const messages = await Message.find({
      room: roomId,
      sender: { $ne: doctorId }, // Messages not sent by this doctor
      isRead: false,
    })
      .populate("sender", "firstName lastName")
      .sort({ createdAt: 1 })
      .lean();

    return messages;
  }

  /**
   * Send message
   */
  async sendMessage(
    roomId,
    senderId,
    content,
    attachments = [],
    messageType = "text"
  ) {
    // Verify room access
    await this.joinRoom(roomId, senderId);

    const message = new Message({
      room: roomId,
      sender: senderId,
      content,
      attachments,
      messageType,
      isRead: false,
    });

    await message.save();

    // Update room's last activity
    await Room.findByIdAndUpdate(roomId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // Populate sender info before returning
    await message.populate("sender", "firstName lastName");

    return message;
  }

  /**
   * Mark messages as seen
   */
  async markMessagesAsSeen(roomId, doctorId) {
    await Message.updateMany(
      {
        room: roomId,
        sender: { $ne: doctorId },
        isRead: false,
      },
      {
        isRead: true,
      }
    );
  }

  /**
   * Get room by ID with full details
   */
  async getRoomById(roomId, doctorId) {
    const room = await Room.findById(roomId)
      .populate("doctorA", "firstName lastName specialization")
      .populate("doctorB", "firstName lastName specialization")
      .populate("patient", "firstName lastName age gender")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "firstName lastName",
        },
      })
      .lean();

    if (!room) {
      throw new Error("Room not found");
    }

    // Verify access
    const isDoctorA = room.doctorA._id.toString() === doctorId.toString();
    const isDoctorB = room.doctorB._id.toString() === doctorId.toString();

    if (!isDoctorA && !isDoctorB) {
      throw new Error("Access denied");
    }

    return room;
  }

  /**
   * Get messages (alias for controller compatibility)
   */
  async getMessages(roomId, doctorId, page = 1, limit = 50) {
    // Verify access
    await this.joinRoom(roomId, doctorId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ room: roomId })
        .populate("sender", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ room: roomId }),
    ]);

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all messages in a room (same as getMessages)
   */
  async getRoomMessages(roomId, doctorId, page = 1, limit = 50) {
    return this.getMessages(roomId, doctorId, page, limit);
  }
}

module.exports = new ChatService();
