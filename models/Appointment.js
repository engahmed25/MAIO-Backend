const mongoose = require("mongoose");
const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    // These MUST match a generated slot exactly
    startTime: {
      type: String, // "19:00"
      required: true,
    },

    endTime: {
      type: String, // "19:30"
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "cancelled", "completed", "no-show"],
      default: "scheduled",
      index: true,
    },
    reasonForVisit: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
appointmentSchema.index(
  {
    doctorId: 1,
    appointmentDate: 1,
    startTime: 1,
    endTime: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
