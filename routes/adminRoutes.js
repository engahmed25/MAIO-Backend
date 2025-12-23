const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  login,
  getUsers,
  getPendingUsers,
  getUser,
  updateStatus,
  softDelete,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const {
  adminRegistrationSchema,
  loginSchema,
  statusUpdateSchema,
} = require("../validators/authValidator");

// Admin auth
router.post("/register", validate(adminRegistrationSchema), registerAdmin);
router.post("/login", validate(loginSchema), login);

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
router.delete(
  "/users/:id",
  protect,
  authorize("admin"),
  softDelete
);

module.exports = router;
