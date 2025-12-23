const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Admin = require("../models/Admin");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/Tokens");
const {
  sendPatientWelcomeEmail,
  sendDoctorWelcomeEmail,
  sendResetEmail,
} = require("../services/emailService");

const { createDoctorTimeSlots } = require("./timeSlotService");

// Helper function to persist files from buffer to disk
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

// @desc    Register Doctor Service
// @access  Private
exports.registerDoctorService = async (data, files) => {
  let savedFiles = null;
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      gender,
      yearsOfExperience,
      specialization,
      otherSpecialization,
      clinicAddress,
      bio,
      ratePerSession,
      slots,
    } = data;

    // Check required files
    if (
      !files ||
      !files.phdCertificate ||
      !files.idProof ||
      !files.medicalLicense ||
      !files.profilePicture
    ) {
      throw new Error(
        "phdCertificate, medicalLicense, idProof and profilePicture are required"
      );
    }

    // Persist uploaded files from memory to disk (only after validation passed)
    savedFiles = {};
    // profilePicture is required for doctors
    savedFiles.profilePicture = await persistFileFromBuffer(
      files.profilePicture[0],
      "profilePicture"
    );
    savedFiles.phdCertificate = await persistFileFromBuffer(
      files.phdCertificate[0],
      "PHDCertificate"
    );
    savedFiles.medicalLicense = await persistFileFromBuffer(
      files.medicalLicense[0],
      "medicalLicense"
    );
    savedFiles.idProof = await persistFileFromBuffer(
      files.idProof[0],
      "IDProof"
    );

    // Create User
    const user = await User.create({
      email,
      password,
      role: "doctor",
      status: "pending",
      profilePicture: savedFiles.profilePicture || null,
    });

    // Create Doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      firstName,
      lastName,
      phoneNumber,
      gender,
      yearsOfExperience: Number(yearsOfExperience),
      specialization,
      otherSpecialization: otherSpecialization || "",
      clinicAddress: clinicAddress,
      medicalLicense: savedFiles.medicalLicense,
      phdCertificate: savedFiles.phdCertificate,
      idProof: savedFiles.idProof,
      bio,
      ratePerSession: ratePerSession ? Number(ratePerSession) : 0,
    });

    // // Generate tokens
    // const accessToken = generateAccessToken(user._id);
    // const refreshToken = generateRefreshToken(user._id);

    // if (!accessToken || !refreshToken) {
    //   throw new Error("Failed to generate authentication tokens");
    // }

    // // Save refresh token
    // user.refreshToken = refreshToken;
    await user.save();
    await doctor.save();
    await createDoctorTimeSlots(doctor._id, slots);
    await sendDoctorWelcomeEmail(doctor.fullName, user.email);

    return {
      user: {
        userId: user._id,
        doctorId: doctor._id,
        email: user.email,
        status: user.status,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        role: user.role,
      },
    };
  } catch (error) {
    // Cleanup saved files on error
    if (savedFiles) {
      for (const key of Object.keys(savedFiles)) {
        const p = savedFiles[key];
        if (p && fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
          } catch (cleanupErr) {
            console.error(`Error cleaning up file ${p}:`, cleanupErr);
          }
        }
      }
    }
    throw error;
  }
};

// @desc    Register Patient Service
// @access  Private
exports.registerPatientService = async (data, file) => {
  let savedFiles = null;
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      age,
      gender,
      emergencyContactNumber,
      reasonForSeeingDoctor,
      drugAllergies,
      illnesses,
      otherIllness,
      operations,
      currentMedications,
      smoking,
    } = data;

    // Check required files
    if (!file) {
      throw new Error("profilePicture is required");
    }

    savedFiles = {};
    savedFiles.profilePicture = await persistFileFromBuffer(
      file,
      "profilePicture"
    );
    // Create User
    const user = await User.create({
      email,
      password,
      role: "patient",
      status: "approved",
      profilePicture: savedFiles.profilePicture || null,
    });

    // Create Patient profile
    const patient = await Patient.create({
      userId: user._id,
      firstName,
      lastName,
      age: Number(age),
      gender,
      emergencyContactNumber,
      reasonForSeeingDoctor,
      drugAllergies: drugAllergies || "",
      illnesses: illnesses,
      otherIllness: otherIllness || "",
      operations: operations,
      currentMedications,
      smoking,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    const refreshToken = generateRefreshToken({
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    if (!accessToken || !refreshToken) {
      throw new Error("Failed to generate authentication tokens");
    }

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();
    await patient.save();
    await sendPatientWelcomeEmail(patient.fullName, user.email);

    return {
      user: {
        userId: user._id,
        patientId: patient._id,
        email: user.email,
        status: user.status,
        firstName: patient.firstName,
        lastName: patient.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    // Cleanup saved files on error
    if (savedFiles) {
      for (const key of Object.keys(savedFiles)) {
        const p = savedFiles[key];
        if (p && fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
          } catch (cleanupErr) {
            console.error(`Error cleaning up file ${p}:`, cleanupErr);
          }
        }
      }
    }
    throw error;
  }
};
exports.loginService = async (email, password) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    if (user.isDeleted) {
      const err = new Error("Your account has been disabled");
      err.statusCode = 403;
      throw err;
    }

    // Check account status
    if (user.status === "pending") {
      const err = new Error("Your account is pending approval.");
      err.statusCode = 403;
      err.status = "pending";
      throw err;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    const refreshToken = generateRefreshToken({
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    if (!accessToken || !refreshToken) {
      const err = new Error("Failed to generate authentication tokens");
      err.statusCode = 500;
      throw err;
    }

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        userId: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Login service error:", error);
    throw error;
  }
};

exports.refreshTokens = async (refreshToken) => {
  try {
    if (!refreshToken) {
      const err = new Error("Refresh token is required");
      err.statusCode = 400;
      throw err;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 401;
      throw err;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(
      user._id,
      user.email,
      user.role,
      user.status
    );
    const newRefreshToken = generateRefreshToken(
      user._id,
      user.email,
      user.role,
      user.status
    );

    // Save new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error("Refresh token service error:", error);
    throw error;
  }
};
exports.logout = async (userId) => {
  try {
    if (!userId) {
      const err = new Error("User ID is required");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { refreshToken: null },
      { new: true }
    );

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return { success: true };
  } catch (error) {
    console.error("Logout service error:", error);
    throw error;
  }
};
exports.resetPassword = async (email) => {
  try {
    if (!email) {
      const err = new Error("Email is required");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const err = new Error("User not found with this email");
      err.statusCode = 404;
      throw err;
    }

    // Generate reset token using promises instead of callback
    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 18000000; // 5 hours in milliseconds

    await user.save();

    // TODO: Implement sendResetEmail function
    // For now, return the token (in production, send via email)
    console.log(`Reset token for ${email}: ${token}`);
    sendResetEmail(user.email, user.fullName, token);

    return {
      message: "Reset token generated successfully",
      token: token, // Remove in production - only send via email
    };
  } catch (error) {
    console.error("Reset password service error:", error);
    throw error;
  }
};
exports.submitNewPassword = async (token, newPassword) => {
  try {
    if (!token) {
      const err = new Error("Reset token is required");
      err.statusCode = 400;
      throw err;
    }

    if (!newPassword || newPassword.length < 6) {
      const err = new Error("Password must be at least 6 characters");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      const err = new Error("Invalid or expired reset token");
      err.statusCode = 400;
      throw err;
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;

    await user.save();

    return {
      message: "Password reset successfully",
    };
  } catch (error) {
    console.error("Submit new password error:", error);
    throw error;
  }
};
