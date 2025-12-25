const express = require("express");
const router = express.Router();
const availabilityController = require("../controllers/availability.controller");

// GET /api/doctors/:doctorId/availability?date=2025-01-10
router.get(
  "/doctors/:doctorId/availability",
  availabilityController.getDoctorAvailability
);

module.exports = router;
