const express = require("express");
const router = express.Router();

const doctorController = require("../controllers/doctor.controller");
const doctorSearchController = require("../controllers/doctorSearch.controller");
const appointmentController = require("../controllers/appointment.controller");
const { validate, validateFiles } = require("../middleware/validation");
const { protect, authorize } = require("../middleware/auth");
const { updateProfileSchema } = require("../validators/doctorValidator");
const upload = require("../config/multer");

// @route   GET /api/doctors/search
// @desc    Search doctors with filters and pagination
// @access  Public
router.get("/search", doctorSearchController.searchDoctors);

// @route   GET /api/doctors/me
// @desc    Get own doctor profile
// @access  Private (Doctor only)
router.get("/me", protect, authorize("doctor"), doctorController.getMyProfile);

// @route   GET /api/doctors/me/appointments/upcoming
// @desc    Get upcoming appointments for authenticated doctor
// @access  Private (Doctor only)
router.get(
  "/me/appointments/upcoming",
  protect,
  authorize("doctor"),
  appointmentController.getUpcomingForDoctor
);

// @route   GET /api/doctors/patients/:patientId/doctors
// @desc    Get all other doctors a patient has seen (requires an appointment with the authenticated doctor)
// @access  Private (Doctor only)
router.get(
  "/patients/:patientId/doctors",
  protect,
  authorize("doctor"),
  doctorController.getPatientDoctors
);

// @route   GET /api/doctors/:doctorId
// @desc    Get doctor profile by ID
// @access  Private (Authenticated users)
router.get("/:doctorId", doctorController.getDoctorProfile);

// @route   PATCH /api/doctors/me
// @desc    Update own doctor profile
// @access  Private (Doctor only)
router.patch(
  "/me",
  protect,
  authorize("doctor"),
  validate(updateProfileSchema),
  doctorController.updateDoctorProfile
);

// @route   POST /api/doctors/me/documents
// @desc    Upload verification documents
// @access  Private (Doctor only)
router.post(
  "/me/documents",
  protect,
  authorize("doctor"),
  upload.memory.fields([
    { name: "phdCertificate", maxCount: 1 },
    { name: "medicalLicense", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  doctorController.uploadVerificationDocuments
);

module.exports = router;
