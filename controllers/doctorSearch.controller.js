const { searchDoctorsService } = require("../services/doctorSearch.service");

// Valid specialization values from Doctor model
const VALID_SPECIALIZATIONS = [
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
];

const VALID_SORT_FIELDS = [
  "rating",
  "ratePerSession",
  "yearsOfExperience",
  "totalReviews",
];

// @desc    Search doctors with filters and pagination
// @route   GET /api/doctors/search
// @access  Public
exports.searchDoctors = async (req, res) => {
  try {
    const queryParams = req.query;

    // Validate query parameters
    const errors = [];

    // Validate page
    if (queryParams.page !== undefined) {
      const page = parseInt(queryParams.page);
      if (isNaN(page) || page < 1) {
        errors.push({
          field: "page",
          message: "Page must be a positive integer",
        });
      }
    }

    // Validate limit
    if (queryParams.limit !== undefined) {
      const limit = parseInt(queryParams.limit);
      if (isNaN(limit) || limit < 1 || limit > 50) {
        errors.push({
          field: "limit",
          message: "Limit must be between 1 and 50",
        });
      }
    }

    // Validate specialization
    if (
      queryParams.specialization &&
      !VALID_SPECIALIZATIONS.includes(queryParams.specialization)
    ) {
      errors.push({
        field: "specialization",
        message: `Invalid specialization. Must be one of: ${VALID_SPECIALIZATIONS.join(", ")}`,
      });
    }

    // Validate sortBy
    if (queryParams.sortBy && !VALID_SORT_FIELDS.includes(queryParams.sortBy)) {
      errors.push({
        field: "sortBy",
        message: `Invalid sortBy field. Must be one of: ${VALID_SORT_FIELDS.join(", ")}`,
      });
    }

    // Validate sortOrder
    if (
      queryParams.sortOrder &&
      !["asc", "desc"].includes(queryParams.sortOrder.toLowerCase())
    ) {
      errors.push({
        field: "sortOrder",
        message: "sortOrder must be 'asc' or 'desc'",
      });
    }

    // Validate price filters
    if (queryParams.minPrice !== undefined) {
      const minPrice = parseFloat(queryParams.minPrice);
      if (isNaN(minPrice) || minPrice < 0) {
        errors.push({
          field: "minPrice",
          message: "minPrice must be a non-negative number",
        });
      }
    }

    if (queryParams.maxPrice !== undefined) {
      const maxPrice = parseFloat(queryParams.maxPrice);
      if (isNaN(maxPrice) || maxPrice < 0) {
        errors.push({
          field: "maxPrice",
          message: "maxPrice must be a non-negative number",
        });
      }
    }

    // Check if minPrice > maxPrice
    if (
      queryParams.minPrice !== undefined &&
      queryParams.maxPrice !== undefined
    ) {
      const minPrice = parseFloat(queryParams.minPrice);
      const maxPrice = parseFloat(queryParams.maxPrice);
      if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
        errors.push({
          field: "priceRange",
          message: "minPrice cannot be greater than maxPrice",
        });
      }
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors,
      });
    }

    // Call service
    const result = await searchDoctorsService(queryParams);

    return res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully",
      data: {
        doctors: result.doctors,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Search doctors error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to search doctors",
    });
  }
};

