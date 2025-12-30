const express = require("express");
const router = express.Router();
const controller = require("../controllers/payment.controller");
const { protect, authorize } = require("../middleware/auth");

// POST /api/payments/intent
// Creates a Stripe PaymentIntent for a reservation
router.post(
  "/intent",
  protect,
  authorize("patient"),
  controller.createPaymentIntent
);

// POST /api/payments/confirm
// Verifies PaymentIntent succeeded and books the appointment
router.post(
  "/confirm",
  protect,
  authorize("patient"),
  controller.confirmPaymentIntent
);

module.exports = router;
