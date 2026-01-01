const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // One patient profile per user
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
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age cannot be negative"],
      max: [150, "Please provide a valid age"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be male, female, or other",
      },
      required: [true, "Gender is required"],
    },
    emergencyContactNumber: {
      type: String,
      required: [true, "Emergency Phone Number is required"],
      match: [/^[0-9]{10,15}$/, "Please provide a valid phone number"],
    },
    reasonForSeeingDoctor: {
      type: String,
      required: [true, "Reason for visit is required"],
      minlength: [
        10,
        "Please provide more details about your reason for visit",
      ],
    },
    drugAllergies: {
      type: String,
      trim: true,
    },
    illnesses: {
      type: [String],
      default: [],
      // Optional: enum ensures users only pick from a predefined list
      enum: [
        "Diabetes",
        "Hypertension",
        "Asthma",
        "Heart Disease",
        "Cancer",
        "Kidney Disease",
        "Other",
      ],
    },
    otherIllness: {
      type: String,
      trim: true,
    },
    operations: {
      type: String,
      trim: true,
    },
    currentMedications: {
      type: String,
      required: true,
    },
    smoking: {
      type: String,
      enum: {
        values: ["yes", "no"],
        message: "Smoking status must be yes, no, or former",
      },
      required: [true, "Smoking status is required"],
    },
    medicalHistory: {
      chronicDiseases: {
        type: [String],
        default: [],
      },
      allergies: {
        type: [String],
        default: [],
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    medicalDocuments: {
      type: [
        {
          title: {
            type: String,
            required: [true, "Document title is required"],
          },
          filePath: {
            type: String,
            required: [true, "Document path is required"],
          },
          fileType: {
            type: String,
          },
          doctorName: {
            type: String,
            required: [true, "Doctor name is required"],
          },
          documentType: {
            type: String,
            enum: [
              "Lab Results",
              "MRI",
              "X-Ray",
              "CT Scan",
              "Ultrasound",
              "Prescription",
              "Medical Report",
              "Vaccination Record",
            ],
            required: [true, "Document type is required"],
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],
    prescriptions: [
      {
        // Basic Drug Information
        drugName: {
          type: String,
          required: true,
          trim: true,
          // Example: "Lisinopril"
        },
        concentration: {
          type: String,
          required: true,
          trim: true,
          // Example: "5mg", "10ml"
        },

        // Dosage Information
        timesPerDay: {
          type: Number,
          required: true,
          min: 1,
          // Example: 1 (once daily), 2 (twice daily)
        },
        dosageTiming: {
          type: String,
          required: true,
          // Example: "Once daily in the morning", "Twice daily (morning and evening)"
        },

        // Doctor Information
        prescribedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
          required: true,
        },

        // Date Information
        startDate: {
          type: Date,
          required: true,
          default: Date.now,
        },

        // Status
        status: {
          type: String,
          enum: ["active", "completed", "discontinued"],
          default: "active",
        },

        // Optional Notes
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUAL: Full Name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Patient", patientSchema);
