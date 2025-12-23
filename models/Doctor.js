const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // One doctor profile per user
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10,15}$/, "Please provide a valid phone number"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    yearsOfExperience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: [0, "Years of experience cannot be negative"],
      max: [70, "Years of experience seems invalid"],
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      enum: [
        "Cardiology",
        "Dermatology",
        "Neurology",
        "Pediatrics",
        "Psychiatry",
        "Radiology",
        "Surgery",
        "Orthopedics",
        "Gynecology",
        "Oncology",
        "Anesthesiology",
        "Emergency Medicine",
        "Family Medicine",
        "Internal Medicine",
        "Ophthalmology",
        "Other",
      ],
    },
    otherSpecialization: {
      type: String,
      required: false,
    },
    clinicAddress: {
      type: String,
      required: [true, "Street address is required"],
    },
    phdCertificate: {
      type: String,
      required: [true, "PhD certificate is required"],
    },
    medicalLicense: {
      type: String,
      required: [true, "Medical license document is required"],
    },
    idProof: {
      type: String,
      required: [true, "ID proof is required"],
    },
    bio: {
      type: String,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
    ratePerSession: {
      type: Number,
      default: 0,
      min: [0, "Consultation fee cannot be negative"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUAL: Full Name
doctorSchema.virtual("fullName").get(function () {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Doctor", doctorSchema);
