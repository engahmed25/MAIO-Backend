const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Patient = require("../models/Patient");
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

const mapDoctorProfile = (doctorDoc) => {
  const doctor = doctorDoc?.toObject ? doctorDoc.toObject() : doctorDoc;

  return {
    ...doctor,
    email: doctor.userId?.email,
    status: doctor.userId?.status,
    profilePicture: doctor.userId?.profilePicture,
    userId: doctor.userId?._id,
  };
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
    yearsOfExperience: doctor.yearsOfExperience || null,
    ratePerSession: doctor.ratePerSession || null,
    bio: doctor.bio || null,
    clinicAddress: doctor.clinicAddress || null,
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

// @desc    Update doctor profile picture
// @access  Private (Doctor only)
exports.updateDoctorProfilePictureService = async (userId, fileBuffer) => {
  if (!fileBuffer) {
    throw new Error("Profile picture file is required");
  }

  // Update the User model (where profilePicture is stored)
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check if this user has a doctor profile
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Upload new profile picture
  const newPath = await persistFileFromBuffer(fileBuffer, "profilePicture");

  // Delete old profile picture
  deleteOldFile(user.profilePicture);

  // Update user's profile picture
  user.profilePicture = newPath;
  await user.save();

  // Return updated doctor profile
  return exports.getDoctorProfileService(userId);
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

// @desc    List all other doctors a patient has seen, available to a doctor with an appointment
// @access  Private (Doctor only)
exports.getPatientDoctorsForDoctorService = async ({
  doctorUserId,
  patientUserId,
}) => {
  if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
    throw new Error("Invalid patient ID format");
  }

  const patient =
    (await Patient.findById(patientUserId).select("_id")) ||
    (await Patient.findOne({ userId: patientUserId }).select("_id"));

  const doctor = await Doctor.findOne({ userId: doctorUserId }).select("_id");

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  const hasAppointment = await Appointment.exists({
    patientId: patient._id,
    doctorId: doctor._id,
    status: { $ne: "cancelled" },
  });

  if (!hasAppointment) {
    const error = new Error("Access denied: no appointment with this patient");
    error.statusCode = 403;
    throw error;
  }

  const doctorIds = await Appointment.distinct("doctorId", {
    patientId: patient._id,
    status: { $ne: "cancelled" },
  });

  const otherDoctorIds = doctorIds.filter(
    (id) => id?.toString() !== doctor._id.toString()
  );

  if (otherDoctorIds.length === 0) {
    return [];
  }

  const doctors = await Doctor.find({ _id: { $in: otherDoctorIds } })
    .populate("userId", "email status profilePicture")
    .lean();

  return doctors.map(mapDoctorProfile);
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

  // Return updated profile using existing service
  return exports.getDoctorProfileService(userId);
};

// @desc    Add prescription for a patient
// @access  Private (Doctor only)
exports.addPrescriptionService = async ({
  doctorUserId,
  patientId,
  prescriptionData,
}) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ userId: doctorUserId }).select("_id");
  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Find patient profile (can be by _id or userId)
  let patient =
    (await Patient.findById(patientId)) ||
    (await Patient.findOne({ userId: patientId }));

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Verify doctor has appointment with patient
  const hasAppointment = await Appointment.exists({
    patientId: patient._id,
    doctorId: doctor._id,
    status: { $ne: "cancelled" },
  });

  if (!hasAppointment) {
    const error = new Error("Access denied: no appointment with this patient");
    error.statusCode = 403;
    throw error;
  }

  // Create prescription object
  const newPrescription = {
    drugName: prescriptionData.drugName,
    concentration: prescriptionData.concentration,
    timesPerDay: prescriptionData.timesPerDay,
    dosageTiming: prescriptionData.dosageTiming,
    prescribedBy: doctor._id,
    startDate: prescriptionData.startDate || new Date(),
    status: "active",
    notes: prescriptionData.notes || "",
  };

  // Add prescription to patient
  patient.prescriptions.push(newPrescription);
  await patient.save();

  // Get the newly added prescription
  const addedPrescription =
    patient.prescriptions[patient.prescriptions.length - 1];

  // Populate doctor info
  await patient.populate({
    path: "prescriptions.prescribedBy",
    select: "firstName lastName specialization",
  });

  // Return the prescription with populated doctor info
  const populatedPrescription = patient.prescriptions.id(addedPrescription._id);

  return {
    _id: populatedPrescription._id,
    drugName: populatedPrescription.drugName,
    concentration: populatedPrescription.concentration,
    timesPerDay: populatedPrescription.timesPerDay,
    dosageTiming: populatedPrescription.dosageTiming,
    prescribedBy: {
      _id: populatedPrescription.prescribedBy._id,
      fullName: `Dr. ${populatedPrescription.prescribedBy.firstName} ${populatedPrescription.prescribedBy.lastName}`,
      specialization: populatedPrescription.prescribedBy.specialization,
    },
    startDate: populatedPrescription.startDate,
    status: populatedPrescription.status,
    notes: populatedPrescription.notes,
  };
};

// @desc    Update prescription status
// @access  Private (Doctor only)
exports.updatePrescriptionService = async ({
  doctorUserId,
  patientId,
  prescriptionId,
  drugName,
  concentration,
  timesPerDay,
  dosageTiming,
  status,
  notes,
}) => {
  // Validate ObjectId formats
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    throw new Error("Invalid prescription ID format");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ userId: doctorUserId }).select("_id");
  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Find patient profile
  let patient =
    (await Patient.findById(patientId)) ||
    (await Patient.findOne({ userId: patientId }));

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Verify doctor has appointment with patient
  const hasAppointment = await Appointment.exists({
    patientId: patient._id,
    doctorId: doctor._id,
    status: { $ne: "cancelled" },
  });

  if (!hasAppointment) {
    const error = new Error("Access denied: no appointment with this patient");
    error.statusCode = 403;
    throw error;
  }

  // Find the prescription
  const prescription = patient.prescriptions.id(prescriptionId);
  if (!prescription) {
    throw new Error("Prescription not found");
  }

  // Update prescription
  if (drugName) {
    prescription.drugName = drugName;
  }
  if (concentration) {
    prescription.concentration = concentration;
  }
  if (timesPerDay) {
    prescription.timesPerDay = timesPerDay;
  }
  if (dosageTiming) {
    prescription.dosageTiming = dosageTiming;
  }
  if (status) {
    prescription.status = status;
  }
  if (notes) {
    prescription.notes = notes;
  }

  await patient.save();

  // Populate doctor info
  await patient.populate({
    path: "prescriptions.prescribedBy",
    select: "firstName lastName specialization",
  });

  const updatedPrescription = patient.prescriptions.id(prescriptionId);

  return {
    _id: updatedPrescription._id,
    drugName: updatedPrescription.drugName,
    concentration: updatedPrescription.concentration,
    timesPerDay: updatedPrescription.timesPerDay,
    dosageTiming: updatedPrescription.dosageTiming,
    prescribedBy: {
      _id: updatedPrescription.prescribedBy._id,
      fullName: `Dr. ${updatedPrescription.prescribedBy.firstName} ${updatedPrescription.prescribedBy.lastName}`,
      specialization: updatedPrescription.prescribedBy.specialization,
    },
    startDate: updatedPrescription.startDate,
    status: updatedPrescription.status,
    notes: updatedPrescription.notes,
  };
};

// @desc    Get all prescriptions written by doctor for a specific patient
// @access  Private (Doctor only)
exports.getPatientPrescriptionsService = async ({
  doctorUserId,
  patientId,
  status,
}) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ userId: doctorUserId }).select("_id");
  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Find patient profile
  let patient =
    (await Patient.findById(patientId)) ||
    (await Patient.findOne({ userId: patientId }));

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Verify doctor has appointment with patient
  const hasAppointment = await Appointment.exists({
    patientId: patient._id,
    doctorId: doctor._id,
    status: { $ne: "cancelled" },
  });

  if (!hasAppointment) {
    const error = new Error("Access denied: no appointment with this patient");
    error.statusCode = 403;
    throw error;
  }

  // Populate prescriptions
  await patient.populate({
    path: "prescriptions.prescribedBy",
    select: "firstName lastName specialization",
  });

  // Filter prescriptions written by this doctor
  let prescriptions = patient.prescriptions.filter(
    (prescription) =>
      prescription.prescribedBy._id.toString() === doctor._id.toString()
  );

  // Filter by status if provided
  if (status && ["active", "completed", "discontinued"].includes(status)) {
    prescriptions = prescriptions.filter((p) => p.status === status);
  }

  // Format prescriptions
  const formattedPrescriptions = prescriptions.map((prescription) => ({
    _id: prescription._id,
    drugName: prescription.drugName,
    concentration: prescription.concentration,
    timesPerDay: prescription.timesPerDay,
    dosageTiming: prescription.dosageTiming,
    startDate: prescription.startDate,
    status: prescription.status,
    notes: prescription.notes || "",
    createdAt: prescription.createdAt,
  }));

  // Sort by date (newest first)
  formattedPrescriptions.sort((a, b) => b.startDate - a.startDate);

  // Calculate statistics
  const statistics = {
    total: formattedPrescriptions.length,
    active: formattedPrescriptions.filter((p) => p.status === "active").length,
    completed: formattedPrescriptions.filter((p) => p.status === "completed")
      .length,
    discontinued: formattedPrescriptions.filter(
      (p) => p.status === "discontinued"
    ).length,
  };

  return {
    patientInfo: {
      _id: patient._id,
      fullName: `${patient.firstName} ${patient.lastName}`,
      age: patient.age,
      gender: patient.gender,
    },
    statistics,
    prescriptions: formattedPrescriptions,
  };
};

// @desc    Get specific prescription details for a patient
// @access  Private (Doctor only)
exports.getPatientPrescriptionDetailsService = async ({
  doctorUserId,
  patientId,
  prescriptionId,
}) => {
  // Validate ObjectId formats
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    throw new Error("Invalid prescription ID format");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ userId: doctorUserId }).select("_id");
  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  // Find patient profile
  let patient =
    (await Patient.findById(patientId)) ||
    (await Patient.findOne({ userId: patientId }));

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Verify doctor has appointment with patient
  const hasAppointment = await Appointment.exists({
    patientId: patient._id,
    doctorId: doctor._id,
    status: { $ne: "cancelled" },
  });

  if (!hasAppointment) {
    const error = new Error("Access denied: no appointment with this patient");
    error.statusCode = 403;
    throw error;
  }

  // Populate prescriptions
  await patient.populate({
    path: "prescriptions.prescribedBy",
    select: "firstName lastName specialization",
  });

  // Find the prescription
  const prescription = patient.prescriptions.id(prescriptionId);

  if (!prescription) {
    throw new Error("Prescription not found");
  }

  // Verify this doctor prescribed it
  if (prescription.prescribedBy._id.toString() !== doctor._id.toString()) {
    const error = new Error(
      "Access denied: you did not prescribe this medication"
    );
    error.statusCode = 403;
    throw error;
  }

  return {
    _id: prescription._id,
    drugName: prescription.drugName,
    concentration: prescription.concentration,
    timesPerDay: prescription.timesPerDay,
    dosageTiming: prescription.dosageTiming,
    prescribedBy: {
      _id: prescription.prescribedBy._id,
      fullName: `Dr. ${prescription.prescribedBy.firstName} ${prescription.prescribedBy.lastName}`,
      specialization: prescription.prescribedBy.specialization,
    },
    startDate: prescription.startDate,
    status: prescription.status,
    notes: prescription.notes || "",
    createdAt: prescription.createdAt,
    patientInfo: {
      _id: patient._id,
      fullName: `${patient.firstName} ${patient.lastName}`,
      age: patient.age,
      gender: patient.gender,
      drugAllergies: patient.drugAllergies || "None",
      currentMedications: patient.currentMedications || "None",
    },
  };
};
