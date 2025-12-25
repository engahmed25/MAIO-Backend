const express = require("express");
const router = express.Router();
const controller = require("../controllers/reservation.controller");
const { protect, authorize } = require("../middleware/auth");

// POST /api/reservations
// Protect route and allow only patients to reserve
router.post("/", protect, authorize("patient"), controller.reserveSlot);

module.exports = router;
