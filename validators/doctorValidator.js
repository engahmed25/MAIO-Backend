const Joi = require("joi");

// DOCTOR PROFILE UPDATE VALIDATION
const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional().messages({
        "string.min": "First name must be at least 2 characters",
        "string.max": "First name cannot exceed 50 characters",
    }),

    lastName: Joi.string().min(2).max(50).optional().messages({
        "string.min": "Last name must be at least 2 characters",
        "string.max": "Last name cannot exceed 50 characters",
    }),

    phoneNumber: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .optional()
        .messages({
            "string.pattern.base": "Phone number must be 10-15 digits",
        }),

    gender: Joi.string()
        .valid("male", "female", "other")
        .optional()
        .messages({
            "any.only": "Gender must be male, female, or other",
        }),

    yearsOfExperience: Joi.number().min(0).max(70).optional().messages({
        "number.min": "Years of experience cannot be negative",
        "number.max": "Years of experience seems invalid",
    }),

    specialization: Joi.string()
        .valid(
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
            "Other"
        )
        .optional()
        .messages({
            "any.only": "Invalid specialization",
        }),

    otherSpecialization: Joi.string().optional().when("specialization", {
        is: "Other",
        then: Joi.string().required().messages({
            "any.required": "Other specialization is required when specialization is 'Other'",
        }),
        otherwise: Joi.string().optional(),
    }),

    clinicAddress: Joi.string().optional(),

    bio: Joi.string().max(1000).optional().messages({
        "string.max": "Bio cannot exceed 1000 characters",
    }),

    ratePerSession: Joi.number().min(0).optional().messages({
        "number.min": "Consultation fee cannot be negative",
    }),
}).unknown(false); // Reject unknown fields (like phdCertificate, medicalLicense, idProof)

module.exports = {
    updateProfileSchema,
};
