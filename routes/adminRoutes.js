const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  login,
  getUsers,
  getPendingUsers,
  getAppointments,
  getUser,
  updateStatus,
  softDelete,
  updateVerification,
  getMetrics,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const {
  adminRegistrationSchema,
  loginSchema,
  statusUpdateSchema,
  verificationUpdateSchema,
} = require("../validators/authValidator");

// Admin auth
router.post("/register", validate(adminRegistrationSchema), registerAdmin);
router.post("/login", validate(loginSchema), login);

// Dashboard metrics
router.get(
  "/dashboard/metrics",
  protect,
  authorize("admin"),
  getMetrics
);

router.get(
  "/appointments",
  protect,
  authorize("admin"),
  getAppointments
);

// Admin-only user management
router.get(
  "/users",
  protect,
  authorize("admin"),
  getUsers
);
router.get(
  "/users/pending",
  protect,
  authorize("admin"),
  getPendingUsers
);
router.get(
  "/users/:id",
  protect,
  authorize("admin"),
  getUser
);
router.patch(
  "/users/:id/status",
  protect,
  authorize("admin"),
  validate(statusUpdateSchema),
  updateStatus
);
router.patch(
  "/users/:id/verification",
  protect,
  authorize("admin"),
  validate(verificationUpdateSchema),
  updateVerification
);
router.delete(
  "/users/:id",
  protect,
  authorize("admin"),
  softDelete
);

module.exports = router;
