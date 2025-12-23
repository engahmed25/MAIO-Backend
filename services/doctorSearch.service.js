const Doctor = require("../models/Doctor");
const User = require("../models/User");

// @desc    Build text search query
// @access  Private
const buildSearchQuery = (searchText) => {
    if (!searchText || searchText.trim() === "") {
        return {};
    }

    // Use MongoDB text search on indexed fields
    return {
        $text: { $search: searchText.trim() },
    };
};

// @desc    Build filter query from parameters
// @access  Private
const buildFilterQuery = (filters) => {
    const query = {};

    // Specialization filter (exact match)
    if (filters.specialization) {
        query.specialization = filters.specialization;
    }

    // Location filter (partial match, case-insensitive)
    if (filters.location) {
        query.clinicAddress = {
            $regex: filters.location.trim(),
            $options: "i",
        };
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.ratePerSession = {};
        if (filters.minPrice !== undefined) {
            query.ratePerSession.$gte = Number(filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            query.ratePerSession.$lte = Number(filters.maxPrice);
        }
    }

    return query;
};

// @desc    Get approved doctor user IDs
// @access  Private
const getApprovedDoctorUserIds = async () => {
    const approvedUsers = await User.find({
        role: "doctor",
        status: "approved",
    }).select("_id");

    return approvedUsers.map((user) => user._id);
};

// @desc    Build sort object
// @access  Private
const buildSortObject = (sortBy, sortOrder, hasTextSearch) => {
    // If text search is used, prioritize text score
    if (hasTextSearch) {
        return {
            score: { $meta: "textScore" },
            [sortBy || "rating"]: sortOrder === "asc" ? 1 : -1,
        };
    }

    // Default sort by rating descending
    const sortField = sortBy || "rating";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    return { [sortField]: sortDirection };
};

// @desc    Search doctors with filters and pagination
// @access  Public
exports.searchDoctorsService = async (queryParams) => {
    const {
        q,
        specialization,
        location,
        minPrice,
        maxPrice,
        page = 1,
        limit = 10,
        sortBy,
        sortOrder = "desc",
    } = queryParams;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    // Build search query (text search)
    const searchQuery = buildSearchQuery(q);
    const hasTextSearch = Object.keys(searchQuery).length > 0;

    // Build filter query
    const filterQuery = buildFilterQuery({
        specialization,
        location,
        minPrice,
        maxPrice,
    });

    // Get approved doctor user IDs
    const approvedUserIds = await getApprovedDoctorUserIds();

    if (approvedUserIds.length === 0) {
        return {
            doctors: [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: 0,
                pages: 0,
            },
        };
    }

    // Combine all queries
    const combinedQuery = {
        ...searchQuery,
        ...filterQuery,
        userId: { $in: approvedUserIds },
    };

    // Build sort object
    const sortObject = buildSortObject(sortBy, sortOrder, hasTextSearch);

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Build projection
    const projection = {
        phdCertificate: 0,
        medicalLicense: 0,
        idProof: 0,
    };

    // Add text score to projection if text search is used
    if (hasTextSearch) {
        projection.score = { $meta: "textScore" };
    }

    // Execute query with pagination
    const query = Doctor.find(combinedQuery, projection)
        .populate("userId", "email status profilePicture")
        .sort(sortObject)
        .skip(skip)
        .limit(limitNum)
        .lean();

    const [doctors, total] = await Promise.all([
        query,
        Doctor.countDocuments(combinedQuery),
    ]);

    // Transform doctors data
    const transformedDoctors = doctors.map((doctor) => {
        const doctorObj = {
            ...doctor,
            email: doctor.userId?.email,
            status: doctor.userId?.status,
            profilePicture: doctor.userId?.profilePicture,
            fullName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        };

        // Remove userId object, keep only the ID
        doctorObj.userId = doctor.userId?._id;

        // Remove score if present (internal field)
        if (doctorObj.score !== undefined) {
            delete doctorObj.score;
        }

        return doctorObj;
    });

    const pages = Math.ceil(total / limitNum);

    return {
        doctors: transformedDoctors,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages,
        },
    };
};

