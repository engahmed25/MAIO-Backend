const User = require("../models/User");
const Admin = require("../models/Admin");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

// Helper to normalize pagination params
const buildPagination = (page = 1, limit = 10) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

const normalizeStatusInput = (status) => {
  if (!status) return undefined;
  const lowered = String(status).toLowerCase();
  const allowed = ["pending", "approved", "active", "suspended"];
  return allowed.includes(lowered) ? lowered : null;
};

const buildSearchRegex = (search) =>
  search && search.trim()
    ? new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : null;

const isFilled = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const calculateDoctorCompletion = (doctorProfile = {}, user = {}) => {
  const fields = [
    doctorProfile.firstName,
    doctorProfile.lastName,
    doctorProfile.phoneNumber,
    doctorProfile.gender,
    doctorProfile.yearsOfExperience,
    doctorProfile.specialization,
    doctorProfile.clinicAddress,
    doctorProfile.phdCertificate,
    doctorProfile.medicalLicense,
    doctorProfile.idProof,
    user.profilePicture,
  ];
  const filled = fields.filter(isFilled).length;
  return Math.round((filled / fields.length) * 100) || 0;
};

const calculatePatientCompletion = (patientProfile = {}, user = {}) => {
  const fields = [
    patientProfile.firstName,
    patientProfile.lastName,
    patientProfile.age,
    patientProfile.gender,
    patientProfile.emergencyContactNumber,
    patientProfile.reasonForSeeingDoctor,
    patientProfile.currentMedications,
    user.profilePicture,
    user.phoneNumber,
  ];
  const filled = fields.filter(isFilled).length;
  return Math.round((filled / fields.length) * 100) || 0;
};

const calculateAdminCompletion = (adminProfile = {}, user = {}) => {
  const fields = [
    adminProfile.firstName,
    adminProfile.lastName,
    adminProfile.phoneNumber,
    user.email,
  ];
  const filled = fields.filter(isFilled).length;
  return Math.round((filled / fields.length) * 100) || 0;
};

const calculateProfileCompletion = (
  user,
  doctorProfile,
  patientProfile,
  adminProfile
) => {
  if (!user) return 0;
  if (user.role === "doctor" && doctorProfile) {
    return calculateDoctorCompletion(doctorProfile, user);
  }
  if (user.role === "patient" && patientProfile) {
    return calculatePatientCompletion(patientProfile, user);
  }
  if (user.role === "admin" && adminProfile) {
    return calculateAdminCompletion(adminProfile, user);
  }
  return 0;
};

exports.createAdmin = async (data) => {
  const { email, password, firstName, lastName, phoneNumber } = data;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email is already registered");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.create({
    email,
    password,
    role: "admin",
    status: "approved",
    verificationStatus: "approved",
    verifiedAt: new Date(),
  });

  const adminProfile = await Admin.create({
    userId: user._id,
    firstName,
    lastName,
    phoneNumber,
  });

  return {
    userId: user._id,
    adminId: adminProfile._id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
};

exports.loginAdmin = async (email, password, loginFn) => {
  const result = await loginFn(email, password);
  if (result.user.role !== "admin") {
    const err = new Error("Only admins can log in here");
    err.statusCode = 403;
    throw err;
  }
  return result;
};

exports.listUsers = async ({
  page = 1,
  limit = 10,
  role,
  status,
  search,
  verificationStatus,
  sortBy = "createdAt",
  sortOrder = "desc",
  includeDeleted = false,
}) => {
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(
    page,
    limit
  );

  const matchStage = {};
  if (!includeDeleted) {
    matchStage.isDeleted = { $ne: true };
  }
  if (role) {
    matchStage.role = String(role).toLowerCase();
  }

  const normalizedStatus = normalizeStatusInput(status);
  if (status && normalizedStatus === null) {
    const err = new Error("Invalid status filter");
    err.statusCode = 400;
    throw err;
  }

  if (normalizedStatus) {
    matchStage.status =
      normalizedStatus === "approved" || normalizedStatus === "active"
        ? { $in: ["approved", "active"] }
        : normalizedStatus;
  }

  const normalizedVerification =
    verificationStatus && typeof verificationStatus === "string"
      ? verificationStatus.toLowerCase()
      : verificationStatus;

  if (normalizedVerification) {
    const allowedVerification = ["pending", "approved", "rejected"];
    if (!allowedVerification.includes(normalizedVerification)) {
      const err = new Error(
        "verificationStatus must be pending, approved, or rejected"
      );
      err.statusCode = 400;
      throw err;
    }
    matchStage.verificationStatus =
      normalizedVerification === "pending"
        ? { $in: ["pending", null] }
        : normalizedVerification;
  }

  const searchRegex = buildSearchRegex(search);

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "doctors",
        localField: "_id",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "userId",
        as: "patientProfile",
      },
    },
    {
      $lookup: {
        from: "admins",
        localField: "_id",
        foreignField: "userId",
        as: "adminProfile",
      },
    },
    {
      $addFields: {
        firstName: {
          $ifNull: [
            { $arrayElemAt: ["$doctorProfile.firstName", 0] },
            {
              $ifNull: [
                { $arrayElemAt: ["$patientProfile.firstName", 0] },
                { $arrayElemAt: ["$adminProfile.firstName", 0] },
              ],
            },
          ],
        },
        lastName: {
          $ifNull: [
            { $arrayElemAt: ["$doctorProfile.lastName", 0] },
            {
              $ifNull: [
                { $arrayElemAt: ["$patientProfile.lastName", 0] },
                { $arrayElemAt: ["$adminProfile.lastName", 0] },
              ],
            },
          ],
        },
      },
    },
  ];

  if (searchRegex) {
    pipeline.push({
      $match: {
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      },
    });
  }

  const sortField =
    sortBy === "lastLogin" || sortBy === "lastLoginAt"
      ? "lastLoginAt"
      : "createdAt";
  const sortDirection =
    String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

  pipeline.push(
    { $sort: { [sortField]: sortDirection, _id: -1 } },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        resetToken: 0,
        resetTokenExpiration: 0,
        contactVerificationCode: 0,
        contactVerificationExpires: 0,
        doctorProfile: 0,
        patientProfile: 0,
        adminProfile: 0,
      },
    },
    {
      $facet: {
        docs: [{ $skip: skip }, { $limit: parsedLimit }],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const result = await User.aggregate(pipeline);
  const docs = (result[0] && result[0].docs) || [];
  const total =
    result[0] && result[0].totalCount[0]
      ? result[0].totalCount[0].count
      : 0;

  return {
    users: docs,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit) || 0,
    },
  };
};

exports.getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select(
      "-password -refreshToken -resetToken -resetTokenExpiration -contactVerificationCode -contactVerificationExpires"
    )
    .lean();

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const [doctorProfile, patientProfile, adminProfile] = await Promise.all([
    Doctor.findOne({ userId }).lean(),
    Patient.findOne({ userId }).lean(),
    Admin.findOne({ userId }).lean(),
  ]);

  const profileCompletion = calculateProfileCompletion(
    user,
    doctorProfile,
    patientProfile,
    adminProfile
  );

  return {
    ...user,
    doctorProfile: doctorProfile || null,
    patientProfile: patientProfile || null,
    adminProfile: adminProfile || null,
    profileCompletion,
  };
};

exports.updateUserStatus = async (userId, status, actingAdminId) => {
  const normalizedStatus = normalizeStatusInput(status);
  if (!normalizedStatus) {
    const err = new Error("Status must be pending, approved, active, or suspended");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.isDeleted) {
    const err = new Error("Cannot update status of a deleted user");
    err.statusCode = 400;
    throw err;
  }

  if (actingAdminId && String(user._id) === String(actingAdminId)) {
    const err = new Error("Admins cannot modify their own status");
    err.statusCode = 403;
    throw err;
  }

  const nextStatus =
    normalizedStatus === "approved" ? "approved" : normalizedStatus;

  user.status = nextStatus;
  if (!["approved", "active"].includes(nextStatus)) {
    user.refreshToken = null;
  }
  await user.save();

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    verificationStatus: user.verificationStatus,
  };
};

exports.softDeleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.isDeleted) {
    return { success: true, message: "User already deleted" };
  }

  user.isDeleted = true;
  user.status = "suspended";
  user.refreshToken = null;
  await user.save();

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    isDeleted: user.isDeleted,
  };
};

exports.updateVerificationStatus = async (
  userId,
  verificationStatus,
  actingAdminId,
  rejectionReason
) => {
  const normalizedStatus = verificationStatus
    ? String(verificationStatus).toLowerCase()
    : verificationStatus;
  const allowed = ["pending", "approved", "rejected"];
  if (!allowed.includes(normalizedStatus)) {
    const err = new Error(
      "verificationStatus must be pending, approved, or rejected"
    );
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.isDeleted) {
    const err = new Error("Cannot verify a deleted user");
    err.statusCode = 400;
    throw err;
  }

  if (actingAdminId && String(user._id) === String(actingAdminId)) {
    const err = new Error("Admins cannot verify their own profile");
    err.statusCode = 403;
    throw err;
  }

  if (normalizedStatus === "rejected" && !rejectionReason) {
    const err = new Error("rejectionReason is required when rejecting a profile");
    err.statusCode = 400;
    throw err;
  }

  const updates = {
    verificationStatus: normalizedStatus,
    verifiedBy: normalizedStatus === "pending" ? null : actingAdminId || null,
    verifiedAt: normalizedStatus === "pending" ? null : new Date(),
    rejectionReason: normalizedStatus === "rejected" ? rejectionReason : null,
  };

  if (normalizedStatus === "pending") {
    updates.status = "pending";
  }

  if (normalizedStatus === "approved" && user.status === "pending") {
    updates.status = "approved";
  }

  Object.assign(user, updates);
  if (normalizedStatus !== "approved") {
    user.refreshToken = null;
  }
  await user.save();

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    verificationStatus: user.verificationStatus,
    verifiedAt: user.verifiedAt,
    verifiedBy: user.verifiedBy,
    rejectionReason: user.rejectionReason,
  };
};

exports.getDashboardMetrics = async () => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const startOfMonth = new Date(now);
  startOfMonth.setHours(0, 0, 0, 0);
  startOfMonth.setDate(startOfMonth.getDate() - 29);

  const activeUsersMatch = { isDeleted: { $ne: true } };

  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    verificationBreakdown,
    roleBreakdown,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    activeToday,
    activeWeek,
    activeMonth,
    totalAppointments,
  ] = await Promise.all([
    User.countDocuments(activeUsersMatch),
    User.countDocuments({ ...activeUsersMatch, role: "patient" }),
    User.countDocuments({ ...activeUsersMatch, role: "doctor" }),
    User.countDocuments({ ...activeUsersMatch, role: "admin" }),
    User.aggregate([
      { $match: activeUsersMatch },
      { $group: { _id: "$verificationStatus", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: activeUsersMatch },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    User.countDocuments({ ...activeUsersMatch, createdAt: { $gte: startOfToday } }),
    User.countDocuments({ ...activeUsersMatch, createdAt: { $gte: startOfWeek } }),
    User.countDocuments({ ...activeUsersMatch, createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ ...activeUsersMatch, lastLoginAt: { $gte: startOfToday } }),
    User.countDocuments({ ...activeUsersMatch, lastLoginAt: { $gte: startOfWeek } }),
    User.countDocuments({ ...activeUsersMatch, lastLoginAt: { $gte: startOfMonth } }),
    Appointment.countDocuments(),
  ]);

  const reduceCounts = (arr = []) =>
    arr.reduce((acc, item) => {
      acc[item._id || "unknown"] = item.count;
      return acc;
    }, {});

  const verificationMap = reduceCounts(verificationBreakdown);
  const roleMap = reduceCounts(roleBreakdown);
  const pendingVerificationCount =
    (verificationMap.pending || 0) + (verificationMap.unknown || 0);
  const approvedVerificationCount = verificationMap.approved || 0;
  const rejectedVerificationCount = verificationMap.rejected || 0;

  return {
    totals: {
      users: totalUsers,
      patients: totalPatients,
      doctors: totalDoctors,
      admins: totalAdmins,
      appointments: totalAppointments,
    },
    usersByRole: {
      patient: roleMap.patient || 0,
      doctor: roleMap.doctor || 0,
      admin: roleMap.admin || 0,
    },
    verification: {
      pending: pendingVerificationCount,
      approved: approvedVerificationCount,
      rejected: rejectedVerificationCount,
      verifiedVsUnverified: {
        verified: approvedVerificationCount,
        unverified:
          pendingVerificationCount + rejectedVerificationCount,
      },
    },
    newUsers: {
      today: newUsersToday,
      last7Days: newUsersWeek,
      last30Days: newUsersMonth,
    },
    activeUsers: {
      today: activeToday,
      last7Days: activeWeek,
      last30Days: activeMonth,
    },
  };
};
