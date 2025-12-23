const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
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
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    transactionId: String,
    paymentGateway: String,
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

module.exports = mongoose.model("Payment", paymentSchema);
