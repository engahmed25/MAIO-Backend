const {
  createAdmin,
  loginAdmin,
  listUsers,
  getUserById,
  updateUserStatus,
  softDeleteUser,
} = require("../services/adminService");
const { loginService } = require("../services/authService");

exports.registerAdmin = async (req, res) => {
  try {
    const data = req.validatedData || req.body;
    const result = await createAdmin(data);
    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Register admin error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create admin",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const payload = req.validatedData || req.body || {};
    const { email, password } = payload;
    const result = await loginAdmin(email, password, loginService);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, role, status, search, includeDeleted } = req.query;
    const result = await listUsers({
      page,
      limit,
      role,
      status,
      search,
      includeDeleted: includeDeleted === "true",
    });
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const { page, limit, role, search, includeDeleted } = req.query;
    const result = await listUsers({
      page,
      limit,
      role,
      status: "pending",
      search,
      includeDeleted: includeDeleted === "true",
    });
    return res.status(200).json({
      success: true,
      message: "Pending users fetched successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get pending users error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch pending users",
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const result = await getUserById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await updateUserStatus(req.params.id, status);
    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update status",
    });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const result = await softDeleteUser(req.params.id);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Soft delete user error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};
