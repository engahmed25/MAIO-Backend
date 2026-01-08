// middleware/socketAuthMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

exports.socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "") ||
      socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication failed: No token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Extract user ID from token
    const userId = decoded.id?._id || decoded.id || decoded.userId;
    const userRole = decoded.id?.role || decoded.role;

    if (!userId) {
      return next(new Error("Invalid token: No user ID found"));
    }

    // Fetch user from database
    const user = await User.findById(userId)
      .select("-password -refreshToken -resetToken")
      .lean();

    if (!user) {
      return next(new Error("User not found"));
    }

    // Fetch profile based on role
    let profile = null;
    if (userRole === "doctor" || user.role === "doctor") {
      profile = await Doctor.findOne({ userId }).lean();
    } else if (userRole === "patient" || user.role === "patient") {
      profile = await Patient.findOne({ userId }).lean();
    }

    // Attach complete user info to socket
    socket.userId = userId;
    socket.userRole = user.role;
    socket.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: profile?.firstName || "Unknown",
      lastName: profile?.lastName || "User",
      name: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
      profile: profile,
    };

    console.log("✅ Socket authenticated:", socket.user.name);
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("Authentication failed"));
  }
};
