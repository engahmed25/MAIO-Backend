const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

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
      enum: ["PENDING"],
      default: "PENDING",
    },

    // TTL field
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

/**
 * Prevent multiple reservations
 * for the same slot
 */
reservationSchema.index(
  {
    doctorId: 1,
    appointmentDate: 1,
    startTime: 1,
    endTime: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
