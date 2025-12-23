const {
    getDoctorProfileService,
    getDoctorProfileByIdService,
    updateDoctorProfileService,
    uploadVerificationDocumentsService,
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

