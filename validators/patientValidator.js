const Joi = require("joi");

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  age: Joi.number().min(0).max(150).optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  emergencyContactNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional(),
  reasonForSeeingDoctor: Joi.string().min(10).optional(),
  drugAllergies: Joi.string().allow("").optional(),
  illnesses: Joi.array().items(Joi.string()).optional(),
  otherIllness: Joi.string().allow("").optional(),
  operations: Joi.string().allow("").optional(),
  currentMedications: Joi.string().optional(),
  smoking: Joi.string().valid("yes", "no").optional(),
});

const medicalHistorySchema = Joi.object({
  chronicDiseases: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().allow("").optional(),
});

const medicalDocumentMetaSchema = Joi.object({
  title: Joi.string().max(120).optional(),
  doctorName: Joi.string().max(100).optional(),
  documentType: Joi.string().max(50).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters",
    "any.required": "New password is required",
  }),
});

const contactUpdateRequestSchema = Joi.object({
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional(),
}).custom((value, helpers) => {
  if (!value.email && !value.phoneNumber) {
    return helpers.error("any.invalid", {
      message: "Provide at least one of email or phoneNumber",
    });
  }
  return value;
});

const contactConfirmSchema = Joi.object({
  code: Joi.string().length(6).required().messages({
    "string.length": "Code must be 6 digits",
    "any.required": "Verification code is required",
  }),
});

const accountStatusSchema = Joi.object({
  disabled: Joi.boolean().required().messages({
    "any.required": "disabled flag is required",
  }),
});

module.exports = {
  updateProfileSchema,
  medicalHistorySchema,
  medicalDocumentMetaSchema,
  changePasswordSchema,
  contactUpdateRequestSchema,
  contactConfirmSchema,
  accountStatusSchema,
};
