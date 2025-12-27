const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10-15 digits"],
    },
    role: {
      type: String,
      enum: {
        values: ["patient", "doctor", "admin"],
        message: "Role must be patient, doctor, or admin",
      },
      required: [true, "Role is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "active", "suspended"],
        message: "Status must be pending, approved, active, or suspended",
      },
      default: "pending",
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message:
          "Verification status must be pending, approved, or rejected",
      },
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    pendingPhoneNumber: {
      type: String,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10-15 digits"],
    },
    contactVerificationCode: {
      type: String,
      select: false,
    },
    contactVerificationExpires: {
      type: Date,
      select: false,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiration: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// PRE-SAVE MIDDLEWARE: Hash password before saving
userSchema.pre("save", async function () {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// INSTANCE METHOD: Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Helpful indexes for admin queries and dashboards
userSchema.index({ role: 1, status: 1 });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

module.exports = mongoose.model("User", userSchema);
