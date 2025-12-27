const User = require("../models/User");
const { verifyAccessToken } = require("../utils/Tokens");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = await User.findById(decoded.id).select({
      password: 0,
      refreshToken: 0,
    });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
    }

    if (req.user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
    }

    if (req.user.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Account is pending approval",
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
      error: error.message,
    });
  }
});

// @desc    Authorize user by role
// @access  Private
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
