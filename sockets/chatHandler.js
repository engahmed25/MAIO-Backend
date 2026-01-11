const ChatService = require("../services/ChatService");
const Doctor = require("../models/Doctor");
const { notifyUser } = require("../services/notification.service");
const Room = require("../models/Room");

// Track online doctors
const onlineDoctors = new Map();

const chatHandler = async (io, socket) => {
  try {
    // Fetch doctor profile
    const doctorProfile = await Doctor.findOne({
      userId: socket.userId,
    }).lean();

    if (!doctorProfile) {
      socket.emit("error", { message: "Doctor profile not found" });
      socket.disconnect();
      return;
    }

    // Store doctor info on socket
    socket.doctorProfile = doctorProfile;
    socket.doctorId = doctorProfile._id.toString();

    console.log(
      `✅ Doctor connected: ${doctorProfile.firstName} ${doctorProfile.lastName} (ID: ${socket.doctorId})`
    );

    // Mark doctor as online
    onlineDoctors.set(socket.doctorId, socket.id);

    /**
     * JOIN ROOM
     */
    socket.on("join_room", async ({ roomId }) => {
      try {
        // Verify access via service
        await ChatService.joinRoom(roomId, socket.doctorId);

        socket.join(roomId);
        console.log(`Doctor ${doctorProfile.firstName} joined room: ${roomId}`);

        socket.emit("joined_room", {
          roomId,
          message: "Successfully joined room",
        });

        // Fetch unread messages
        const unreadMessages = await ChatService.getUnreadMessages(
          roomId,
          socket.doctorId
        );

        unreadMessages.forEach((msg) => {
          socket.emit("new_message", {
            id: msg._id,
            roomId: msg.room,
            sender: msg.sender,
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            attachments: msg.attachments || [],
            messageType: msg.messageType || "text",
          });
        });

        // Also fetch all messages for this room
        const result = await ChatService.getMessages(roomId, socket.doctorId);
        socket.emit("room_messages", result);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: error.message });
      }
    });

    /**
     * SEND MESSAGE
     */
    socket.on(
      "send_message",
      async ({ roomId, content, attachments, messageType }) => {
        try {
          const populatedMessage = await ChatService.sendMessage(
            roomId,
            socket.doctorId,
            content,
            attachments,
            messageType
          );

          // Emit message to everyone in the room
          io.to(roomId).emit("new_message", {
            id: populatedMessage._id,
            roomId: populatedMessage.room,
            sender: populatedMessage.sender,
            content: populatedMessage.content,
            createdAt: populatedMessage.createdAt,
            isRead: populatedMessage.isRead,
            attachments: populatedMessage.attachments,
            messageType: populatedMessage.messageType,
          });

          console.log(
            `Message sent in room ${roomId} by ${doctorProfile.firstName}`
          );

          // ✅ Notify the other doctor about the new message
          try {
            // Get room details to find the other doctor
            const room = await Room.findById(roomId).lean();

            if (room) {
              // Determine which doctor to notify (the one who didn't send the message)
              const otherDoctorId = room.doctorAId.toString() === socket.doctorId
                ? room.doctorBId
                : room.doctorAId;

              // Get the other doctor's userId for notification
              const otherDoctor = await Doctor.findById(otherDoctorId).select('userId firstName lastName');

              if (otherDoctor && otherDoctor.userId) {
                const senderName = `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}`;

                await notifyUser(
                  otherDoctor.userId,
                  'Doctor',
                  `You have a new message from ${senderName}`,
                  'new_message',
                  'message',
                  populatedMessage._id,
                  null,
                  {
                    senderId: socket.doctorId,
                    senderName: senderName,
                    roomId: roomId,
                    messagePreview: content ? content.substring(0, 50) : 'New message'
                  }
                );
              }
            }
          } catch (notifyError) {
            console.error('Error sending message notification:', notifyError.message);
            // Don't fail message sending if notification fails
          }
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: error.message });
        }
      }
    );

    /**
     * MESSAGE SEEN
     */
    socket.on("message_seen", async ({ roomId }) => {
      try {
        await ChatService.markMessagesAsSeen(roomId, socket.doctorId);

        socket.to(roomId).emit("messages_seen", {
          roomId,
          seenBy: socket.doctorId,
        });
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    });

    /**
     * TYPING INDICATORS
     */
    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("user_typing", {
        doctorName: `${doctorProfile.firstName} ${doctorProfile.lastName}`,
        doctorId: socket.doctorId,
        roomId,
      });
    });

    socket.on("stop_typing", ({ roomId }) => {
      socket.to(roomId).emit("user_stop_typing", {
        doctorName: `${doctorProfile.firstName} ${doctorProfile.lastName}`,
        doctorId: socket.doctorId,
        roomId,
      });
    });

    /**
     * LEAVE ROOM
     */
    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
      console.log(`Doctor ${doctorProfile.firstName} left room: ${roomId}`);
    });

    /**
     * DISCONNECT
     */
    socket.on("disconnect", () => {
      onlineDoctors.delete(socket.doctorId);
      console.log(
        `❌ Doctor disconnected: ${doctorProfile.firstName} ${doctorProfile.lastName}`
      );
    });
  } catch (error) {
    console.error("Error in chat handler:", error);
    socket.emit("error", { message: "Failed to initialize chat" });
    socket.disconnect();
  }
};

module.exports = chatHandler;
