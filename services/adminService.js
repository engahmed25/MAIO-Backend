const User = require("../models/User");
const Admin = require("../models/Admin");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

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
    matchStage.role = role;
  }
  if (status) {
    matchStage.status = status;
  }

  const searchRegex =
    search && search.trim()
      ? new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : null;

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

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        resetToken: 0,
        resetTokenExpiration: 0,
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
    .select("-password -refreshToken -resetToken -resetTokenExpiration")
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

  return { ...user, doctorProfile, patientProfile, adminProfile };
};

exports.updateUserStatus = async (userId, status) => {
  if (!["pending", "approved"].includes(status)) {
    const err = new Error("Status must be pending or approved");
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

  user.status = status;
  await user.save();

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
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
  user.refreshToken = null;
  await user.save();

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    isDeleted: user.isDeleted,
  };
};
