const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { sendContactVerificationEmail } = require("./emailService");

// Map files to subdirectories
const getUploadDirectory = (fieldName) => {
  if (fieldName === "profilePicture") return "profilePicture";
  if (fieldName === "medicalDocument") return "medicalDocuments";
  return "";
};

const persistFileFromBuffer = async (fileBuffer, fieldName) => {
  const uploadDir = "uploads";
  const subDir = getUploadDirectory(fieldName);
  const fullDir = path.join(uploadDir, subDir);

  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileName = `${fieldName}-${uniqueSuffix}${path.extname(
    fileBuffer.originalname
  )}`;
  const filePath = path.join(fullDir, fileName);

  fs.writeFileSync(filePath, fileBuffer.buffer);
  return filePath;
};

const deleteOldFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

const mapPatientProfile = (patientDoc) => {
  const patient = patientDoc.toObject ? patientDoc.toObject() : patientDoc;
  return {
    ...patient,
    email: patient.userId?.email,
    status: patient.userId?.status,
    profilePicture: patient.userId?.profilePicture,
    phoneNumber: patient.userId?.phoneNumber,
    isDeleted: patient.userId?.isDeleted,
    userId: patient.userId?._id,
  };
};

const getPatientByUserId = async (userId) => {
  const patient = await Patient.findOne({ userId })
    .populate("userId", "email status profilePicture isDeleted phoneNumber")
    .lean();

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  return patient;
};

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.getPatientProfileService = async (userId) => {
  const patient = await getPatientByUserId(userId);
  return mapPatientProfile(patient);
};

exports.getPublicProfileService = async (patientId) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  const patient = await Patient.findById(patientId)
    .populate("userId", "profilePicture")
    .lean();

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  return {
    patientId: patient._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    gender: patient.gender,
    profilePicture: patient.userId?.profilePicture || null,
    illnesses: patient.illnesses || [],
  };
};

exports.updatePatientProfileService = async (userId, updateData) => {
  const patient = await Patient.findOne({ userId });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "age",
    "gender",
    "emergencyContactNumber",
    "reasonForSeeingDoctor",
    "drugAllergies",
    "illnesses",
    "otherIllness",
    "operations",
    "currentMedications",
    "smoking",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      patient[field] = updateData[field];
    }
  });

  await patient.save();

  const updated = await Patient.findById(patient._id)
    .populate("userId", "email status profilePicture phoneNumber")
    .lean();

  return mapPatientProfile(updated);
};

exports.updateProfilePictureService = async (userId, fileBuffer) => {
  if (!fileBuffer) {
    throw new Error("Profile picture file is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const newPath = await persistFileFromBuffer(fileBuffer, "profilePicture");
  deleteOldFile(user.profilePicture);

  user.profilePicture = newPath;
  await user.save();

  return exports.getPatientProfileService(userId);
};

exports.deleteProfilePictureService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  deleteOldFile(user.profilePicture);
  user.profilePicture = null;
  await user.save();

  return exports.getPatientProfileService(userId);
};

exports.addMedicalHistoryService = async (userId, historyData) => {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error("Patient profile not found");
  }

  patient.medicalHistory = patient.medicalHistory || {
    chronicDiseases: [],
    allergies: [],
    notes: "",
  };

  const { chronicDiseases = [], allergies = [], notes } = historyData;

  // merge unique values
  const mergeUnique = (existing = [], incoming = []) => [
    ...new Set([...(existing || []), ...incoming]),
  ];

  patient.medicalHistory.chronicDiseases = mergeUnique(
    patient.medicalHistory.chronicDiseases,
    chronicDiseases
  );
  patient.medicalHistory.allergies = mergeUnique(
    patient.medicalHistory.allergies,
    allergies
  );
  if (notes) {
    patient.medicalHistory.notes = notes;
  }

  await patient.save();
  return mapPatientProfile(
    await Patient.findById(patient._id)
      .populate("userId", "email status profilePicture phoneNumber")
      .lean()
  );
};

exports.updateMedicalHistoryService = async (userId, historyData) => {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error("Patient profile not found");
  }

  patient.medicalHistory = patient.medicalHistory || {
    chronicDiseases: [],
    allergies: [],
    notes: "",
  };

  // Replace (not merge) - check if field exists in request (allows empty arrays to clear)
  if (Object.prototype.hasOwnProperty.call(historyData, "chronicDiseases")) {
    patient.medicalHistory.chronicDiseases = historyData.chronicDiseases || [];
  }
  if (Object.prototype.hasOwnProperty.call(historyData, "allergies")) {
    patient.medicalHistory.allergies = historyData.allergies || [];
  }
  if (Object.prototype.hasOwnProperty.call(historyData, "notes")) {
    patient.medicalHistory.notes = historyData.notes || "";
  }

  await patient.save();
  return mapPatientProfile(
    await Patient.findById(patient._id)
      .populate("userId", "email status profilePicture phoneNumber")
      .lean()
  );
};

exports.uploadMedicalDocumentService = async (userId, fileBuffer, meta) => {
  if (!fileBuffer) {
    throw new Error("Medical document file is required");
  }
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const filePath = await persistFileFromBuffer(fileBuffer, "medicalDocument");
  patient.medicalDocuments.push({
    title: meta.title || fileBuffer.originalname,
    filePath,
    fileType: fileBuffer.mimetype,
  });
  await patient.save();

  return patient.medicalDocuments[patient.medicalDocuments.length - 1];
};

exports.getMedicalRecordsService = async (userId) => {
  const patient = await Patient.findOne({ userId })
    .select("medicalHistory medicalDocuments firstName lastName")
    .populate("userId", "profilePicture")
    .lean();

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  return {
    name: `${patient.firstName} ${patient.lastName}`,
    profilePicture: patient.userId?.profilePicture || null,
    medicalHistory: patient.medicalHistory || {
      chronicDiseases: [],
      allergies: [],
      notes: "",
    },
    medicalDocuments: patient.medicalDocuments || [],
  };
};

exports.getPatientMedicalDocumentsService = async (patientId) => {
  const patient = await Patient.findOne({ userId: patientId })
    .select(
      "medicalDocuments firstName lastName gender age emergencyContactNumber reasonForSeeingDoctor drugAllergies illnesses otherIllness operations currentMedications smoking medicalHistory assignedDoctors"
    )
    .populate("userId", "profilePicture")
    .lean();

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  return {
    name: `${patient.firstName} ${patient.lastName}`,
    profilePicture: patient.userId?.profilePicture || null,
    gender: patient.gender,
    age: patient.age,
    emergencyContactNumber: patient.emergencyContactNumber,
    reasonForSeeingDoctor: patient.reasonForSeeingDoctor,
    drugAllergies: patient.drugAllergies,
    illnesses: patient.illnesses,
    otherIllness: patient.otherIllness,
    operations: patient.operations,
    currentMedications: patient.currentMedications,
    smoking: patient.smoking,
    medicalHistory: patient.medicalHistory || {
      chronicDiseases: [],
      allergies: [],
      notes: "",
    },
    medicalDocuments: patient.medicalDocuments || [],
    assignedDoctors: patient.assignedDoctors || [],
  };
};
exports.deleteMedicalDocumentService = async (userId, documentId) => {
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new Error("Invalid document ID format");
  }

  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const doc = patient.medicalDocuments.id(documentId);
  if (!doc) {
    throw new Error("Medical document not found");
  }

  deleteOldFile(doc.filePath);
  doc.deleteOne();
  await patient.save();

  return patient.medicalDocuments;
};

exports.changePasswordService = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const err = new Error("Current password is incorrect");
    err.statusCode = 400;
    throw err;
  }

  user.password = newPassword;
  user.refreshToken = null; // force re-login everywhere
  await user.save();
};

exports.requestContactUpdateService = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const { email, phoneNumber } = payload;

  if (email && email.toLowerCase() === user.email.toLowerCase()) {
    const err = new Error("New email matches the current email");
    err.statusCode = 400;
    throw err;
  }

  if (email) {
    const existing = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existing) {
      const err = new Error("Email is already in use");
      err.statusCode = 400;
      throw err;
    }
  }

  if (phoneNumber) {
    const existingPhone = await User.findOne({
      phoneNumber,
      _id: { $ne: userId },
    });
    if (existingPhone) {
      const err = new Error("Phone number is already in use");
      err.statusCode = 400;
      throw err;
    }
  }

  const code = generateVerificationCode();
  const hashedCode = await bcrypt.hash(code, 10);
  user.pendingEmail = email || user.pendingEmail || null;
  user.pendingPhoneNumber = phoneNumber || user.pendingPhoneNumber || null;
  user.contactVerificationCode = hashedCode;
  user.contactVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  const emailTarget = email || user.email;
  if (emailTarget) {
    await sendContactVerificationEmail(emailTarget, code);
  }

  return {
    pendingEmail: user.pendingEmail,
    pendingPhoneNumber: user.pendingPhoneNumber,
    expiresAt: user.contactVerificationExpires,
    // expose code only in non-production to ease testing
    code:
      process.env.NODE_ENV && process.env.NODE_ENV !== "production"
        ? code
        : undefined,
  };
};

exports.confirmContactUpdateService = async (userId, code) => {
  const user = await User.findById(userId).select(
    "+contactVerificationCode +contactVerificationExpires"
  );
  if (!user) {
    throw new Error("User not found");
  }

  if (
    !user.contactVerificationCode ||
    !user.contactVerificationExpires ||
    user.contactVerificationExpires < Date.now()
  ) {
    const err = new Error("Verification code is expired or missing");
    err.statusCode = 400;
    throw err;
  }

  if (!user.pendingEmail && !user.pendingPhoneNumber) {
    const err = new Error("No pending contact changes to confirm");
    err.statusCode = 400;
    throw err;
  }

  const isValid = await bcrypt.compare(code, user.contactVerificationCode);
  if (!isValid) {
    const err = new Error("Invalid verification code");
    err.statusCode = 400;
    throw err;
  }

  if (user.pendingEmail) {
    user.email = user.pendingEmail.toLowerCase();
  }
  if (user.pendingPhoneNumber) {
    user.phoneNumber = user.pendingPhoneNumber;
  }

  user.pendingEmail = null;
  user.pendingPhoneNumber = null;
  user.contactVerificationCode = null;
  user.contactVerificationExpires = null;

  await user.save();

  return {
    email: user.email,
    phoneNumber: user.phoneNumber,
  };
};

exports.updateAccountStatusService = async (userId, disabled) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.isDeleted = disabled;
  if (disabled) {
    user.refreshToken = null;
  }

  await user.save();
  return { isDeleted: user.isDeleted };
};

exports.logoutAllDevicesService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.refreshToken = null;
  await user.save();
};

exports.softDeleteAccountService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.isDeleted = true;
  user.refreshToken = null;
  user.pendingEmail = null;
  user.pendingPhoneNumber = null;
  user.contactVerificationCode = null;
  user.contactVerificationExpires = null;

  await user.save();
};

exports.getAssignedDoctorService = async (patientId) => {
  const Doctors = await Patient.findOne({ userId: patientId })
    .populate(
      "assignedDoctors",
      "firstName lastName specialization profilePicture contactInfo"
    )
    .lean();
  if (!Doctors) {
    throw new Error("Patient profile not found");
  }
  return Doctors.assignedDoctors || [];
};
