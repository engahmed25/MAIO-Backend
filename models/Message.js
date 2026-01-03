const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.attachments || this.attachments.length === 0;
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    readAt: Date,
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "document", "folder"],
        },
        url: String,
        filename: String,
        size: Number,
      },
    ],
    messageType: {
      type: String,
      enum: ["text", "file"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
