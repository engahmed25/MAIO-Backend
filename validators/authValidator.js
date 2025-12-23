const Joi = require("joi");

// DOCTOR REGISTRATION VALIDATION
const doctorRegistrationSchema = Joi.object({
  // User fields
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),

  // Doctor profile fields
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.min": "First name must be at least 2 characters",
    "any.required": "First name is required",
  }),

  lastName: Joi.string().min(2).max(50).required().messages({
    "string.min": "Last name must be at least 2 characters",
    "any.required": "Last name is required",
  }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10-15 digits",
      "any.required": "Phone number is required",
    }),

  gender: Joi.string().valid("male", "female", "other").required().messages({
    "any.only": "Gender must be male, female, or other",
    "any.required": "Gender is required",
  }),

  yearsOfExperience: Joi.number().min(0).max(70).required().messages({
    "number.min": "Years of experience cannot be negative",
    "any.required": "Years of experience is required",
  }),

  specialization: Joi.string().required().messages({
    "any.required": "Specialization is required",
  }),
  otherSpecialization: Joi.string().optional(),

  clinicAddress: Joi.string().required().messages({
    "any.required": "Clinic Address is required",
  }),

  bio: Joi.string().max(1000).optional(),

  ratePerSession: Joi.number().min(0).optional(),
});

// PATIENT REGISTRATION VALIDATION
const patientRegistrationSchema = Joi.object({
  // User fields
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),

  // Patient profile fields
  firstName: Joi.string().min(2).max(50).required().messages({
    "any.required": "First name is required",
  }),

  lastName: Joi.string().min(2).max(50).required().messages({
    "any.required": "Last name is required",
  }),

  age: Joi.number().min(0).max(150).required().messages({
    "any.required": "Age is required",
  }),

  gender: Joi.string().valid("male", "female", "other").required().messages({
    "any.only": "Gender must be male, female, or other",
    "any.required": "Gender is required",
  }),

  emergencyContactNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Emergency phone must be 10-15 digits",
      "any.required": "Emergency phone number is required",
    }),

  reasonForSeeingDoctor: Joi.string().min(10).required().messages({
    "string.min": "Please provide more details (at least 10 characters)",
    "any.required": "Reason for visit is required",
  }),

  drugAllergies: Joi.string().allow("").optional(),

  illnesses: Joi.array().items(Joi.string()).optional(),

  otherIllness: Joi.string().allow("").optional(),

  operations: Joi.string().optional(),

  currentMedications: Joi.string().required().messages({
    "any.required": 'Current medications is required (or write "None")',
  }),

  smoking: Joi.string().valid("yes", "no").required().messages({
    "any.only": "Smoking status must be yes or no",
    "any.required": "Smoking status is required",
  }),
});

// LOGIN SCHEMA
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// ADMIN REGISTRATION VALIDATION
const adminRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    "any.required": "First name is required",
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    "any.required": "Last name is required",
  }),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be 10-15 digits",
    }),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid("pending", "approved").required().messages({
    "any.only": "Status must be pending or approved",
    "any.required": "Status is required",
  }),
});

module.exports = {
  doctorRegistrationSchema,
  patientRegistrationSchema,
  loginSchema,
  adminRegistrationSchema,
  statusUpdateSchema,
};
