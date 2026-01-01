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
  doctorController.updateMyProfile
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

// @route   GET /api/doctors/me/appointments/date/:date
// @desc    Get all appointments for authenticated doctor on a specific date
// @access  Private (Doctor only)
router.get(
  "/me/appointments/date/:date",
  protect,
  authorize("doctor"),
  appointmentController.getDoctorAppointmentsByDate
);

// @route   GET /api/doctors/me/patients
// @desc    Get all patients for authenticated doctor with overview details
// @access  Private (Doctor only)
router.get(
  "/me/patients",
  protect,
  authorize("doctor"),
  appointmentController.getDoctorPatients
);

// @route   PATCH /api/doctors/me/profile-picture
// @desc    Update doctor profile picture
// @access  Private (Doctor only)
router.patch(
  "/me/profile-picture",
  protect,
  authorize("doctor"),
  upload.memory.single("profilePicture"),
  doctorController.updateDoctorProfilePicture
);

// @route   POST /api/doctors/patients/:patientId/prescriptions
// @desc    Add prescription for a patient
// @access  Private (Doctor only)
router.post(
  "/patients/:patientId/prescriptions",
  protect,
  authorize("doctor"),
  doctorController.addPrescription
);

// @route   PATCH /api/doctors/patients/:patientId/prescriptions/:prescriptionId
// @desc    Update prescription status (discontinue, complete, etc.)
// @access  Private (Doctor only)
router.patch(
  "/patients/:patientId/prescriptions/:prescriptionId",
  protect,
  authorize("doctor"),
  doctorController.updatePrescription
);

// @route   GET /api/doctors/patients/:patientId/prescriptions
// @desc    Get all prescriptions written by doctor for a specific patient
// @access  Private (Doctor only)
router.get(
  "/patients/:patientId/prescriptions",
  protect,
  authorize("doctor"),
  doctorController.getPatientPrescriptions
);

// @route   GET /api/doctors/patients/:patientId/prescriptions/:prescriptionId
// @desc    Get specific prescription details written by doctor
// @access  Private (Doctor only)
router.get(
  "/patients/:patientId/prescriptions/:prescriptionId",
  protect,
  authorize("doctor"),
  doctorController.getPatientPrescriptionDetails
);
module.exports = router;
