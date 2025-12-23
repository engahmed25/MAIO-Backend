const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const {
  validate,
  validateFiles,
  checkEmailExists,
} = require("../middleware/validation");

const {
  doctorRegistrationSchema,
  patientRegistrationSchema,
  loginSchema,
} = require("../validators/authValidator");

const upload = require("../config/multer");

const User = require("../models/User");

const { protect } = require("../middleware/auth");
// Registration Routes
router.post(
  "/register/doctor",
  upload.memory.fields([
    { name: "phdCertificate", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
    { name: "medicalLicense", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  (req, res, next) => {
    // Debug middleware - log what was received
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("File keys:", req.files ? Object.keys(req.files) : "no files");
    next();
  },
  validate(doctorRegistrationSchema),
  checkEmailExists(User),
  validateFiles([
    "phdCertificate",
    "idProof",
    "medicalLicense",
    "profilePicture",
  ]),
  authController.registerDoctor
);

router.post(
  "/register/patient",
  // accept any uploaded file(s) and let controller/middleware pick the expected one
  upload.memory.any(),
  (req, res, next) => {
    // Debug middleware - log what was received
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("File keys:", req.files ? Object.keys(req.files) : "no files");
    next();
  },
  validate(patientRegistrationSchema),
  checkEmailExists(User),
  validateFiles(["profilePicture"]),
  authController.registerPatient
);
// router.post("/register/admin", authController.registerAdmin);

// Login
router.post(
  "/login",
  (req, res, next) => {
    console.log("Request body:", req.body);
    next();
  },
  validate(loginSchema),
  authController.login
);

// Refresh
router.post("/refresh", authController.refreshToken);

// Logout
router.post("/logout", protect, authController.logout);

// Reset Password Routes
router.get("/reset", authController.requestResetPassword);

router.post("/reset", authController.submitNewPassword);

module.exports = router;
