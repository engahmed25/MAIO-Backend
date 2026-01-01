const {
  getPatientProfileService,
  getPublicProfileService,
  updatePatientProfileService,
  updateProfilePictureService,
  deleteProfilePictureService,
  addMedicalHistoryService,
  updateMedicalHistoryService,
  uploadMedicalDocumentService,
  getMedicalRecordsService,
  deleteMedicalDocumentService,
  changePasswordService,
  requestContactUpdateService,
  confirmContactUpdateService,
  updateAccountStatusService,
  logoutAllDevicesService,
  softDeleteAccountService,
  getPatientMedicalDocumentsService,
  getAssignedDoctorService,
  getPatientMedicalHistoryService,
} = require("../services/patientService");

// @desc    Get authenticated patient's profile
// @route   GET /api/patients/me
// @access  Private (patient)
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const profile = await getPatientProfileService(req.user._id);
    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Get patient profile error:", error);
    const status = error.message === "Patient profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve profile",
    });
  }
};

// @desc    Get public patient profile (limited fields)
// @route   GET /api/patients/:patientId/public
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const profile = await getPublicProfileService(patientId);
    return res.status(200).json({
      success: true,
      message: "Public profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Get public patient profile error:", error);
    const status =
      error.message === "Invalid patient ID format"
        ? 400
        : error.message === "Patient profile not found"
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve public profile",
    });
  }
};

// @desc    Update patient personal information
// @route   PATCH /api/patients/me
// @access  Private (patient)
exports.updateMyProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const updateData = req.validatedData || req.body;
    const updated = await updatePatientProfileService(req.user._id, updateData);

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

// @desc    Upload or update profile picture
// @route   PATCH /api/patients/me/profile-picture
// @access  Private (patient)
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const file =
      (req.file && req.file) ||
      (Array.isArray(req.files) && req.files[0]) ||
      (req.files && req.files.profilePicture
        ? req.files.profilePicture[0]
        : null);

    const updated = await updateProfilePictureService(req.user._id, file);

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update profile picture error:", error);
    let status = 500;
    if (
      error.message === "User not found" ||
      error.message === "Patient profile not found"
    ) {
      status = 404;
    } else if (error.message === "Profile picture file is required") {
      status = 400;
    }
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update profile picture",
    });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/patients/me/profile-picture
// @access  Private (patient)
exports.deleteProfilePicture = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const updated = await deleteProfilePictureService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    const status =
      error.message === "User not found" ||
      error.message === "Patient profile not found"
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete profile picture",
    });
  }
};

// @desc    Add medical history entries (merge)
// @route   POST /api/patients/me/medical-history
// @access  Private (patient)
exports.addMedicalHistory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const historyData = req.validatedData || req.body;
    const updated = await addMedicalHistoryService(req.user._id, historyData);

    return res.status(200).json({
      success: true,
      message: "Medical history updated",
      data: updated,
    });
  } catch (error) {
    console.error("Add medical history error:", error);
    const status = error.message === "Patient profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to add medical history",
    });
  }
};

// @desc    Replace medical history
// @route   PUT /api/patients/me/medical-history
// @access  Private (patient)
exports.updateMedicalHistory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const historyData = req.validatedData || req.body;
    const updated = await updateMedicalHistoryService(
      req.user._id,
      historyData
    );

    return res.status(200).json({
      success: true,
      message: "Medical history replaced",
      data: updated,
    });
  } catch (error) {
    console.error("Update medical history error:", error);
    const status = error.message === "Patient profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update medical history",
    });
  }
};

// @desc    Upload a medical document
// @route   POST /api/patients/me/medical-documents
// @access  Private (patient)
exports.uploadMedicalDocument = async (req, res) => {
  console.log("WeAreHere");
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const file =
      (req.file && req.file) ||
      (Array.isArray(req.files) && req.files[0]) ||
      (req.files && req.files.medicalDocument
        ? req.files.medicalDocument[0]
        : null);

    const document = await uploadMedicalDocumentService(
      req.user._id,
      file,
      req.body || {}
    );

    return res.status(201).json({
      success: true,
      message: "Medical document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Upload medical document error:", error);
    let status = 500;
    if (error.message === "Patient profile not found") {
      status = 404;
    } else if (error.message === "Medical document file is required") {
      status = 400;
    }
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to upload medical document",
    });
  }
};

// @desc    Get medical history and documents
// @route   GET /api/patients/me/medical-records
// @access  Private (patient)
exports.getMedicalRecords = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const records = await getMedicalRecordsService(req.user._id);
    return res.status(200).json({
      success: true,
      message: "Medical records retrieved successfully",
      data: records,
    });
  } catch (error) {
    console.error("Get medical records error:", error);
    const status = error.message === "Patient profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve medical records",
    });
  }
};

// @desc    Get my medical history snapshot (patient self)
// @route   GET /api/patients/me/medical-history
// @access  Private (patient)
exports.getMyMedicalHistory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const history = await getPatientMedicalHistoryService(req.user._id);
    return res.status(200).json({
      success: true,
      message: "Medical history retrieved successfully",
      data: history,
    });
  } catch (error) {
    console.error("Get my medical history error:", error);
    const status =
      error.message === "Patient profile not found"
        ? 404
        : error.message === "Invalid patient ID format"
        ? 400
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve medical history",
    });
  }
};

// @desc    Get patient medical history snapshot
// @route   GET /api/patients/medical-history/:patientId
// @access  Private (doctor)
exports.getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const history = await getPatientMedicalHistoryService(patientId);
    return res.status(200).json({
      success: true,
      message: "Patient medical history retrieved successfully",
      data: history,
    });
  } catch (error) {
    console.error("Get patient medical history error:", error);
    const status =
      error.message === "Invalid patient ID format"
        ? 400
        : error.message === "Patient profile not found"
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve patient medical history",
    });
  }
};

// @desc    Get patient medical documents
// @route   GET /api/patients/medical-documents/:patientId
// @access  Private (doctor)
exports.getPatientMedicalDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const documents = await getPatientMedicalDocumentsService(patientId);
    return res.status(200).json({
      success: true,
      message: "Patient medical documents retrieved successfully",
      data: documents,
    });
  } catch (error) {
    console.error("Get patient medical documents error:", error);
    const status = error.message === "Patient profile not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve patient medical documents",
    });
  }
};

// @desc    Delete a medical document
// @route   DELETE /api/patients/me/medical-documents/:documentId
// @access  Private (patient)
exports.deleteMedicalDocument = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const { documentId } = req.params;
    const documents = await deleteMedicalDocumentService(
      req.user._id,
      documentId
    );

    return res.status(200).json({
      success: true,
      message: "Medical document deleted successfully",
      data: documents,
    });
  } catch (error) {
    console.error("Delete medical document error:", error);
    const status =
      error.message === "Invalid document ID format" ||
      error.message === "Medical document not found"
        ? 400
        : error.message === "Patient profile not found"
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete medical document",
    });
  }
};

// @desc    Change password
// @route   POST /api/patients/me/change-password
// @access  Private (patient)
exports.changePassword = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const { currentPassword, newPassword } = req.validatedData || req.body;
    await changePasswordService(req.user._id, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully. Please log in again with your new password.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    const status =
      error.statusCode || (error.message === "User not found" ? 404 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
};

// @desc    Request contact update verification code
// @route   POST /api/patients/me/contact/request-code
// @access  Private (patient)
exports.requestContactUpdate = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const payload = req.validatedData || req.body;
    const result = await requestContactUpdateService(req.user._id, payload);

    return res.status(200).json({
      success: true,
      message: "Verification code sent. Please confirm to finalize the update.",
      data: {
        pendingEmail: result.pendingEmail,
        pendingPhoneNumber: result.pendingPhoneNumber,
        expiresAt: result.expiresAt,
        code: result.code, // exposed only in non-production
      },
    });
  } catch (error) {
    console.error("Request contact update error:", error);
    const status =
      error.statusCode || (error.message === "User not found" ? 404 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to request contact update",
    });
  }
};

// @desc    Confirm contact update with verification code
// @route   POST /api/patients/me/contact/confirm-code
// @access  Private (patient)
exports.confirmContactUpdate = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const { code } = req.validatedData || req.body;
    const updated = await confirmContactUpdateService(req.user._id, code);

    return res.status(200).json({
      success: true,
      message: "Contact information updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Confirm contact update error:", error);
    const status =
      error.statusCode || (error.message === "User not found" ? 404 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to confirm contact update",
    });
  }
};

// @desc    Enable or disable account
// @route   PATCH /api/patients/me/account-status
// @access  Private (patient)
exports.updateAccountStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    const { disabled } = req.validatedData || req.body;
    const result = await updateAccountStatusService(
      req.user._id,
      Boolean(disabled)
    );

    return res.status(200).json({
      success: true,
      message: result.isDeleted
        ? "Account disabled successfully"
        : "Account enabled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update account status error:", error);
    const status =
      error.statusCode || (error.message === "User not found" ? 404 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update account status",
    });
  }
};

// @desc    Logout from all devices
// @route   POST /api/patients/me/logout-all
// @access  Private (patient)
exports.logoutAllDevices = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    await logoutAllDevicesService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    console.error("Logout all devices error:", error);
    const status =
      error.statusCode || (error.message === "User not found" ? 404 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to logout from all devices",
    });
  }
};

// @desc    Soft delete account
// @route   DELETE /api/patients/me
// @access  Private (patient)
exports.softDeleteAccount = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }

    await softDeleteAccountService(req.user._id);

    return res.status(200).json({
      success: true,
      message:
        "Account marked as deleted. Contact support if this was unintentional.",
    });
  } catch (error) {
    console.error("Soft delete account error:", error);
    const status =
      error.statusCode || (error.message === "User not found" ? 404 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete account",
    });
  }
};

exports.getAssignedDoctor = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }
    const { patientId } = req.params;

    if (req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient role required",
      });
    }
    const profile = await getAssignedDoctorService(patientId);
    return res.status(200).json({
      success: true,
      message: "Assigned doctor profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Get assigned doctor profile error:", error);
    const status =
      error.message === "Invalid patient ID format"
        ? 400
        : error.message === "Patient profile not found"
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve assigned doctor profile",
    });
  }
};
