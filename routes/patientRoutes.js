const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const appointmentController = require("../controllers/appointment.controller");
const { validate } = require("../middleware/validation");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../config/multer");
const {
  updateProfileSchema,
  medicalHistorySchema,
  medicalDocumentMetaSchema,
  changePasswordSchema,
  contactUpdateRequestSchema,
  contactConfirmSchema,
  accountStatusSchema,
} = require("../validators/patientValidator");

// Authenticated patient profile
router.get(
  "/me",
  protect,
  authorize("patient"),
  patientController.getMyProfile
);

router.get(
  "/me/appointments/upcoming",
  protect,
  authorize("patient"),
  appointmentController.getUpcomingForPatient
);

router.patch(
  "/me",
  protect,
  authorize("patient"),
  validate(updateProfileSchema),
  patientController.updateMyProfile
);

// Profile picture
router.patch(
  "/me/profile-picture",
  protect,
  authorize("patient"),
  upload.memory.single("profilePicture"),
  patientController.updateProfilePicture
);

router.delete(
  "/me/profile-picture",
  protect,
  authorize("patient"),
  patientController.deleteProfilePicture
);

// Medical history
router.post(
  "/me/medical-history",
  protect,
  authorize("patient"),
  validate(medicalHistorySchema),
  patientController.addMedicalHistory
);

router.put(
  "/me/medical-history",
  protect,
  authorize("patient"),
  validate(medicalHistorySchema),
  patientController.updateMedicalHistory
);

router.get(
  "/me/medical-history",
  protect,
  authorize("patient"),
  patientController.getMyMedicalHistory
);

// Medical documents
router.post(
  "/me/medical-documents",
  protect,
  authorize("patient"),
  upload.memory.single("medicalDocument"),
  validate(medicalDocumentMetaSchema),
  patientController.uploadMedicalDocument
);

router.get(
  "/me/medical-records",
  protect,
  authorize("patient"),
  patientController.getMedicalRecords
);

router.get(
  "/medical-history/:patientId",
  protect,
  authorize("doctor"),
  patientController.getPatientMedicalHistory
);

router.get(
  "/medical-documents/:patientId",
  protect,
  authorize("doctor"),
  patientController.getPatientMedicalDocuments
);

router.delete(
  "/me/medical-documents/:documentId",
  protect,
  authorize("patient"),
  patientController.deleteMedicalDocument
);

// Account & security
router.post(
  "/me/change-password",
  protect,
  authorize("patient"),
  validate(changePasswordSchema),
  patientController.changePassword
);

router.post(
  "/me/contact/request-code",
  protect,
  authorize("patient"),
  validate(contactUpdateRequestSchema),
  patientController.requestContactUpdate
);

router.post(
  "/me/contact/confirm-code",
  protect,
  authorize("patient"),
  validate(contactConfirmSchema),
  patientController.confirmContactUpdate
);

router.patch(
  "/me/account-status",
  protect,
  authorize("patient"),
  validate(accountStatusSchema),
  patientController.updateAccountStatus
);

router.post(
  "/me/logout-all",
  protect,
  authorize("patient"),
  patientController.logoutAllDevices
);

router.delete(
  "/me",
  protect,
  authorize("patient"),
  patientController.softDeleteAccount
);
// Public limited profile
router.get("/:patientId/public", patientController.getPublicProfile);

// Get Assigned Doctor using Authenticated Patient IS
router.get(
  "/assignedDoctor/:patientId",
  protect,
  authorize("patient"),
  patientController.getAssignedDoctor
);

// @route   GET /api/patients/me/prescriptions
// @desc    Get all prescriptions for authenticated patient
// @access  Private (Patient only)
router.get(
  "/me/prescriptions",
  protect,
  authorize("patient"),
  patientController.getMyPrescriptions
);

module.exports = router;
