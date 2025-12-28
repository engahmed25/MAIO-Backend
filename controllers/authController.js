const {
  registerDoctorService,
  registerPatientService,
  loginService,
  refreshTokens,
  logoutService,
  resetPassword,
  submitNewPassword,
} = require("../services/authService");

const timeSlotService = require("../services/doctorSchedule.service");

// @desc    Register Doctor
// @route   POST /api/auth/register/doctor
// @access  Public
exports.registerDoctor = async (req, res) => {
  try {
    const data = req.validatedData || req.body;
    console.log(data.slots);

    const result = await registerDoctorService(data, req.files);
    console.log(data);

    console.log(data.slots);
    // Attempt to create time slots if provided in the request body

    const responsePayload = {
      success: true,
      message: "Doctor registration successful. Waiting for admin approval.",
      data: result.user,
    };

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error("Doctor registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// @desc    Register Patient
// @route   POST /api/auth/register/patient
// @access  Public
exports.registerPatient = async (req, res) => {
  try {
    const data = req.validatedData || req.body;

    // support req.file (single) or req.files (array from multer.any())
    let file = null;
    if (req.file) file = req.file;
    else if (Array.isArray(req.files)) {
      file = req.files.find((f) => f.fieldname === "profilePicture");
    } else if (req.files && typeof req.files === "object") {
      // multer.fields() shape
      file = req.files.profilePicture ? req.files.profilePicture[0] : null;
    }

    const result = await registerPatientService(data, file);

    res.status(201).json({
      success: true,
      message: "Patient registration successful",
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Patient registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const payload = req.validatedData || req.body || {};
    const { email, password } = payload;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginService(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await refreshTokens(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    const status = error.statusCode || 401;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to refresh tokens",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    await logoutService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
};
exports.requestResetPassword = async (req, res) => {
  try {
    // Accept email from JSON body or query string (GET /reset?email=...)
    const email =
      (req.body && req.body.email) || (req.query && req.query.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await resetPassword(email);

    // In development the service returns the token; don't leak in production.
    return res.status(200).json({
      success: true,
      message: "Password reset email sent. Please check your inbox.",
      // include token for convenience in dev/testing
      token: result && result.token ? result.token : undefined,
    });
  } catch (error) {
    console.error("Request reset password error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to send reset email",
    });
  }
};
exports.submitNewPassword = async (req, res) => {
  try {
    // Accept token/newPassword from body or query (form submissions)
    // The toke must send in header not in body or query for security reasons
    const token =
      (req.body && req.body.token) || (req.query && req.query.token);
    const newPassword =
      (req.body && req.body.newPassword) ||
      (req.body && req.body.password) ||
      (req.query && req.query.newPassword) ||
      (req.query && req.query.password);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    await submitNewPassword(token, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Submit new password error:", error);
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Invalid or expired token",
    });
  }
};
