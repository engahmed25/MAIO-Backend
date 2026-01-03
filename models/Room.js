const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    doctorA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    doctorB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create unique room name based on doctors and patient
roomSchema.pre("save", function (next) {
  if (!this.roomName) {
    const ids = [this.doctorA, this.doctorB].sort();
    this.roomName = `room_${ids[0]}_${ids[1]}_${this.patient}`;
  }
});

module.exports = mongoose.model("Room", roomSchema);
