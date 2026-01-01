const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

// Helper function to persist files from buffer to disk (reused from authService)
const persistFileFromBuffer = async (fileBuffer, fieldName) => {
  try {
    const uploadDir = "uploads";

    // Determine subdirectory based on field name
    let subDir = "";
    if (fieldName === "phdCertificate" || fieldName === "PHDCertificate") {
      subDir = "PHDCertificate";
    } else if (fieldName === "medicalLicense") {
      subDir = "MedicalLicense";
    } else if (fieldName === "idProof" || fieldName === "IDProof") {
      subDir = "IDProof";
    } else if (fieldName === "profilePicture") {
      subDir = "profilePicture";
    }

    const fullDir = path.join(uploadDir, subDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = `${fieldName}-${uniqueSuffix}${path.extname(
      fileBuffer.originalname
    )}`;
    const filePath = path.join(fullDir, fileName);

    // Write buffer to disk
    fs.writeFileSync(filePath, fileBuffer.buffer);

    return filePath; // Return relative path for database storage
  } catch (error) {
    console.error(`Error persisting file for ${fieldName}:`, error);
    throw new Error(`Failed to save ${fieldName}: ${error.message}`);
  }
};

// Helper function to safely delete old file
const deleteOldFile = (filePath) => {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old file: ${filePath}`);
    }
  } catch (error) {
    // Log error but don't throw - file cleanup failure shouldn't break the operation
    console.error(`Error deleting old file ${filePath}:`, error);
  }
};

// @desc    Get doctor profile by userId
// @access  Private
exports.getDoctorProfileService = async (userId) => {
  const doctor = await Doctor.findOne({ userId })
    .populate("userId", "email status profilePicture")
    .lean();

  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Get total unique patients from appointments
  const totalPatients = await Appointment.distinct("patientId", {
    doctorId: doctor._id,
    status: { $in: ["confirmed", "completed"] }, // Only count confirmed or completed appointments
  }).then((patientIds) => patientIds.length);

  // Combine doctor and user data
  const profile = {
    ...doctor,
    email: doctor.userId?.email,
    status: doctor.userId?.status,
    profilePicture: doctor.userId?.profilePicture,
    totalPatients,
  };

  // Remove userId object, keep only the ID
  profile.userId = doctor.userId?._id;

  return profile;
};

// @desc    Get doctor profile by doctorId
// @access  Private
exports.getDoctorProfileByIdService = async (doctorId) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new Error("Invalid doctor ID format");
  }

  const doctor = await Doctor.findById(doctorId)
    .populate("userId", "email status profilePicture")
    .lean();

  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Combine doctor and user data
  const profile = {
    ...doctor,
    email: doctor.userId?.email,
    status: doctor.userId?.status,
    profilePicture: doctor.userId?.profilePicture,
  };

  // Remove userId object, keep only the ID
  profile.userId = doctor.userId?._id;

  return profile;
};

// @desc    Update doctor profile
// @access  Private (Doctor only)
exports.updateDoctorProfileService = async (userId, updateData) => {
  // Find doctor by userId
  const doctor = await Doctor.findOne({ userId });

  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Allowed fields for update (exclude verification documents)
  const allowedFields = [
    "firstName",
    "lastName",
    "phoneNumber",
    "gender",
    "yearsOfExperience",
    "specialization",
    "otherSpecialization",
    "clinicAddress",
    "bio",
    "ratePerSession",
  ];

  // Filter updateData to only include allowed fields
  const filteredUpdate = {};
  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      filteredUpdate[key] = updateData[key];
    }
  });

  // If specialization is not "Other", clear otherSpecialization
  if (
    filteredUpdate.specialization &&
    filteredUpdate.specialization !== "Other"
  ) {
    filteredUpdate.otherSpecialization = undefined;
  }

  // Update doctor profile
  Object.assign(doctor, filteredUpdate);
  await doctor.save();

  // Populate and return updated profile
  const updatedDoctor = await Doctor.findById(doctor._id)
    .populate("userId", "email status profilePicture")
    .lean();

  const profile = {
    ...updatedDoctor,
    email: updatedDoctor.userId?.email,
    status: updatedDoctor.userId?.status,
    profilePicture: updatedDoctor.userId?.profilePicture,
  };

  profile.userId = updatedDoctor.userId?._id;

  return profile;
};

// @desc    Upload verification documents
// @access  Private (Doctor only)
exports.uploadVerificationDocumentsService = async (userId, files) => {
  // Find doctor by userId
  const doctor = await Doctor.findOne({ userId });

  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Validate at least one file is provided
  const fileFields = ["phdCertificate", "medicalLicense", "idProof"];
  const hasFiles = fileFields.some(
    (field) => files && files[field] && files[field][0]
  );

  if (!hasFiles) {
    throw new Error("At least one verification document is required");
  }

  const savedFiles = {};
  const filesToUpdate = {};

  try {
    // Process each provided file
    for (const fieldName of fileFields) {
      if (files && files[fieldName] && files[fieldName][0]) {
        const fileBuffer = files[fieldName][0];

        // Delete old file if exists
        const oldFilePath = doctor[fieldName];
        if (oldFilePath) {
          deleteOldFile(oldFilePath);
        }

        // Save new file
        const newFilePath = await persistFileFromBuffer(fileBuffer, fieldName);
        savedFiles[fieldName] = newFilePath;
        filesToUpdate[fieldName] = newFilePath;
      }
    }

    // Update doctor document with new file paths
    Object.assign(doctor, filesToUpdate);
    await doctor.save();

    // Update User status to "pending" for re-verification
    await User.findByIdAndUpdate(userId, {
      status: "pending",
      verificationStatus: "pending",
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
    });

    // Populate and return updated profile
    const updatedDoctor = await Doctor.findById(doctor._id)
      .populate("userId", "email status profilePicture")
      .lean();

    const profile = {
      ...updatedDoctor,
      email: updatedDoctor.userId?.email,
      status: updatedDoctor.userId?.status,
      profilePicture: updatedDoctor.userId?.profilePicture,
    };

    profile.userId = updatedDoctor.userId?._id;

    return profile;
  } catch (error) {
    // Cleanup saved files on error
    for (const filePath of Object.values(savedFiles)) {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupErr) {
          console.error(`Error cleaning up file ${filePath}:`, cleanupErr);
        }
      }
    }
    throw error;
  }
};
