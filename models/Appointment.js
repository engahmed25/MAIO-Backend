const mongoose = require("mongoose");
const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      startTime: { type: String, required: true }, // "09:00"
      endTime: { type: String, required: true }, // "09:30"
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "cancelled", "completed", "no-show"],
      default: "scheduled",
    },
    reasonForVisit: {
      type: String,
      required: true,
    },
    notes: String,
    prescription: String,
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
    },
    cancellationReason: String,
  },
  { timestamps: true }
);

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
