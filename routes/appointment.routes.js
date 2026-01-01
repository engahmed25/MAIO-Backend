const express = require("express");
const router = express.Router();
const controller = require("../controllers/appointment.controller");
const { protect, authorize } = require("../middleware/auth");

// POST /api/appointments/confirm
// Protected: only authenticated patients may confirm their reservation
router.post(
  "/confirm",
  protect,
  authorize("patient"),
  controller.confirmAppointment
);

// GET /api/appointments/my?type=upcoming&page=1&limit=5
// POST /api/appointments/my
// Protected: only authenticated patients may confirm their reservation
router.get("/my", protect, authorize("patient"), controller.getMyAppointments);

//GET /api/appointments/:appointmentId
// POST /api/appointments/:appointmentId
// Protected: only authenticated patients may confirm their reservation
router.get(
  "/:appointmentId",
  protect,
  authorize("patient"),
  controller.getAppointmentDetails
);

/* 
All History : GET /api/appointments/history
Filter by Doctor : GET /api/appointments/history?doctorId=65bf98a1c999111111abcd99
Filter by Date Range : GET /api/appointments/history?startDate=2024-01-01&endDate=2024-12-31
All can have in same one + Pagination 
*/
// POST /api/appointments/history
// Protected: only authenticated patients may confirm their reservation
router.get(
  "/history",
  protect,
  authorize("patient"),
  controller.getAppointmentDetails
);

// PUT /api/appointments/:appointmentId/reschedule
router.put(
  "/:appointmentId/reschedule",
  protect,
  authorize("patient"),
  controller.rescheduleAppointment
);

// DELETE /api/appointments/:appointmentId
router.delete(
  "/:appointmentId",
  protect,
  authorize("patient"),
  controller.cancelAppointment
);

module.exports = router;
