const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "insurance", "online", "bank_transfer"],
      default: "card",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    transactionId: String,
    paymentGateway: {
      type: String,
      default: "stripe",
    },
    paymentDetails: mongoose.Schema.Types.Mixed,
    paidAt: Date,
    refundedAt: Date,
    refundReason: String,
    invoice: {
      invoiceNumber: String,
      invoiceUrl: String,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ patientId: 1, status: 1 });
paymentSchema.index({ doctorId: 1, createdAt: -1 });
paymentSchema.index({ reservationId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
