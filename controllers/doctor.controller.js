const {
  getDoctorProfileService,
  getDoctorProfileByIdService,
  updateDoctorProfilePictureService,
  updateDoctorProfileService,
  uploadVerificationDocumentsService,
  getPatientDoctorsForDoctorService,
  addPrescriptionService,
  getPatientPrescriptionsService,
  updatePrescriptionService,
} = require("../services/doctor.service");

// @desc    Get doctor profile by doctorId
// @route   GET /api/doctors/:doctorId
// @access  Private (Authenticated users)
exports.getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const profile = await getDoctorProfileByIdService(doctorId);

    return res.status(200).json({
      success: true,
      message: "Doctor profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    let status = 500;
    if (error.message === "Doctor profile not found") {
      status = 404;
    } else if (error.message === "Invalid doctor ID format") {
      status = 400;
    }
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve doctor profile",
    });
  }
};

// @desc    Get own doctor profile
// @route   GET /api/doctors/me
// @access  Private (Doctor only)
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const profile = await getDoctorProfileService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Get my profile error:", error);
    const status = error.message === "Doctor profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve profile",
    });
  }
};

// @desc    Update doctor profile
// @route   PATCH /api/doctors/me
// @access  Private (Doctor only)
exports.updateDoctorProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const updateData = req.validatedData || req.body;

    // Ensure verification documents are not updated via this endpoint
    if (
      updateData.phdCertificate ||
      updateData.medicalLicense ||
      updateData.idProof
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verification documents cannot be updated via this endpoint. Use /api/doctors/me/documents",
      });
    }

    const updatedProfile = await updateDoctorProfileService(
      req.user._id,
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    const status = error.message === "Doctor profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// @desc    Upload verification documents
// @route   POST /api/doctors/me/documents
// @access  Private (Doctor only)
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    // Validate at least one file is provided
    const fileFields = ["phdCertificate", "medicalLicense", "idProof"];
    const hasFiles = fileFields.some(
      (field) => req.files && req.files[field] && req.files[field][0]
    );

    if (!hasFiles) {
      return res.status(400).json({
        success: false,
        message: "At least one verification document is required",
        requiredFields: fileFields,
      });
    }

    const updatedProfile = await uploadVerificationDocumentsService(
      req.user._id,
      req.files
    );

    return res.status(200).json({
      success: true,
      message:
        "Verification documents uploaded successfully. Your account status has been set to pending for re-verification.",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Upload verification documents error:", error);
    const status = error.message === "Doctor profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to upload verification documents",
    });
  }
};

// @desc    Get all other doctors a patient has seen (requires an appointment with the patient)
// @route   GET /api/doctors/patients/:patientId/doctors
// @access  Private (Doctor only)
exports.getPatientDoctors = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const doctors = await getPatientDoctorsForDoctorService({
      doctorUserId: req.user._id,
      patientUserId: patientId,
    });

    return res.status(200).json({
      success: true,
      message: "Patient doctors retrieved successfully",
      data: doctors,
    });
  } catch (error) {
    console.error("Get patient doctors error:", error);

    const status =
      error.statusCode ||
      (error.message === "Invalid patient ID format"
        ? 400
        : error.message === "Patient profile not found" ||
          error.message === "Doctor profile not found"
        ? 404
        : error.message === "Access denied: no appointment with this patient"
        ? 403
        : 500);

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve patient doctors",
    });
  }
};

// @desc    Update doctor profile picture
// @access  Private (Doctor only)
exports.updateDoctorProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile picture file is required",
      });
    }
    const file =
      (req.file && req.file) ||
      (Array.isArray(req.files) && req.files[0]) ||
      (req.files && req.files.profilePicture
        ? req.files.profilePicture[0]
        : null);

    const profile = await updateDoctorProfilePictureService(req.user._id, file);

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   PATCH /api/doctors/me
// @desc    Update own doctor profile
// @access  Private (doctor only)
exports.updateMyProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const updateData = req.validatedData || req.body;
    const updated = await updateDoctorProfileService(req.user._id, updateData);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update patient profile error:", error);
    const status = error.message === "Patient profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// @desc    Add prescription for a patient
// @route   POST /api/doctors/patients/:patientId/prescriptions
// @access  Private (Doctor only)
exports.addPrescription = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const { patientId } = req.params;
    const prescriptionData = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Validate required fields
    const requiredFields = [
      "drugName",
      "concentration",
      "timesPerDay",
      "dosageTiming",
    ];
    const missingFields = requiredFields.filter(
      (field) => !prescriptionData[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const prescription = await addPrescriptionService({
      doctorUserId: req.user._id,
      patientId,
      prescriptionData,
    });

    return res.status(201).json({
      success: true,
      message: "Prescription added successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Add prescription error:", error);
    const status =
      error.statusCode ||
      (error.message === "Patient not found" ||
      error.message === "Doctor profile not found"
        ? 404
        : error.message === "Access denied: no appointment with this patient"
        ? 403
        : 400);

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to add prescription",
    });
  }
};

// @desc    Update prescription status
// @route   PATCH /api/doctors/patients/:patientId/prescriptions/:prescriptionId
// @access  Private (Doctor only)
exports.updatePrescription = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const { patientId, prescriptionId } = req.params;
    const {
      drugName,
      concentration,
      timesPerDay,
      dosageTiming,
      status,
      notes,
    } = req.body;

    if (!patientId || !prescriptionId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and Prescription ID are required",
      });
    }

    if (!status || !["active", "completed", "discontinued"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid status is required (active, completed, or discontinued)",
      });
    }

    const prescription = await updatePrescriptionService({
      doctorUserId: req.user._id,
      patientId,
      prescriptionId,
      drugName,
      concentration,
      timesPerDay,
      dosageTiming,
      status,
      notes,
    });

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    const status =
      error.statusCode ||
      (error.message === "Patient not found" ||
      error.message === "Doctor profile not found" ||
      error.message === "Prescription not found"
        ? 404
        : error.message === "Access denied: no appointment with this patient"
        ? 403
        : 400);

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update prescription",
    });
  }
};

// @desc    Get all prescriptions for a specific patient (written by this doctor)
// @route   GET /api/doctors/patients/:patientId/prescriptions
// @access  Private (Doctor only)
exports.getPatientPrescriptions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const { patientId } = req.params;
    const { status } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const result = await getPatientPrescriptionsService({
      doctorUserId: req.user._id,
      patientId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Prescriptions retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get patient prescriptions error:", error);
    const statusCode =
      error.statusCode ||
      (error.message === "Patient not found" ||
      error.message === "Doctor profile not found"
        ? 404
        : error.message === "Access denied: no appointment with this patient"
        ? 403
        : 500);

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve prescriptions",
    });
  }
};

// @desc    Get specific prescription details for a patient
// @route   GET /api/doctors/patients/:patientId/prescriptions/:prescriptionId
// @access  Private (Doctor only)
exports.getPatientPrescriptionDetails = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required",
      });
    }

    const { patientId, prescriptionId } = req.params;

    if (!patientId || !prescriptionId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and Prescription ID are required",
      });
    }

    const prescription =
      await doctorService.getPatientPrescriptionDetailsService({
        doctorUserId: req.user._id,
        patientId,
        prescriptionId,
      });

    return res.status(200).json({
      success: true,
      message: "Prescription details retrieved successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Get prescription details error:", error);
    const statusCode =
      error.statusCode ||
      (error.message === "Patient not found" ||
      error.message === "Doctor profile not found" ||
      error.message === "Prescription not found"
        ? 404
        : error.message === "Access denied: no appointment with this patient"
        ? 403
        : 500);

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve prescription details",
    });
  }
};
