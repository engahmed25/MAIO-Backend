---
name: Doctor Search Feature
overview: Implement a comprehensive doctor search system with text search, filtering by specialty/location/price, and pagination. The search will be publicly accessible and only return approved doctors. All queries will be optimized with MongoDB indexes for performance.
todos:
  - id: add-indexes
    content: Add MongoDB indexes to Doctor model for text search and filter fields
    status: completed
  - id: create-search-service
    content: Create services/doctorSearch.service.js with searchDoctorsService, buildSearchQuery, and buildFilterQuery functions
    status: completed
    dependencies:
      - add-indexes
  - id: create-search-controller
    content: Create controllers/doctorSearch.controller.js with searchDoctors handler
    status: completed
    dependencies:
      - create-search-service
  - id: add-search-route
    content: Add GET /api/doctors/search route to routes/doctor.routes.js
    status: completed
    dependencies:
      - create-search-controller
---

# Doctor Search - Technical Design Document

## Requirements Analysis

### Functional Requirements

1. **Text Search**: Search by doctor name (firstName, lastName), bio, and specialization
2. **Filters**:

   - **Specialty**: Filter by specialization (exact match from enum)
   - **Location**: Partial text match on clinicAddress
   - **Price**: Filter by minPrice and maxPrice (ratePerSession)

3. **Pagination**: Page-based pagination with configurable page size
4. **Access**: Public endpoint (no authentication required)
5. **Status**: Only return doctors with approved status

### Non-Functional Requirements

- **Performance**: Indexed queries for optimal performance
- **Query Params**: All filters via query parameters
- **Response Format**: Consistent with existing API patterns

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/doctors/search?q=...&specialization=...&location=...&minPrice=...&maxPrice=...&page=...&limit=...
       ▼
┌─────────────────────────────────────┐
│         Express Routes               │
│    routes/doctor.routes.js           │
│    (add search route)                │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      Controllers Layer               │
│ controllers/doctorSearch.controller │
│  - searchDoctors                     │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│       Services Layer                 │
│  services/doctorSearch.service.js  │
│  - searchDoctorsService              │
│  - buildSearchQuery                  │
│  - buildFilterQuery                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│       Models Layer                   │
│  - Doctor (with indexes)            │
│  - User (for status filtering)       │
└──────────────────────────────────────┘
```

## Implementation Plan

### 1. Database Indexes (`models/Doctor.js`)

Add MongoDB indexes for optimal query performance:

```javascript
// Text search index (for name, bio, specialization)
doctorSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  bio: 'text', 
  specialization: 'text',
  otherSpecialization: 'text'
});

// Filter indexes
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ ratePerSession: 1 });
doctorSchema.index({ clinicAddress: 1 });
doctorSchema.index({ 'userId': 1 }); // For joining with User

// Compound index for common filter combinations
doctorSchema.index({ specialization: 1, ratePerSession: 1 });
doctorSchema.index({ clinicAddress: 1, specialization: 1 });
```

**Index Strategy:**

- Text index on searchable fields (firstName, lastName, bio, specialization, otherSpecialization)
- Single field indexes on filter fields (specialization, ratePerSession, clinicAddress)
- Compound indexes for common filter combinations
- Index on userId for efficient join with User collection

### 2. Create Search Service (`services/doctorSearch.service.js`)

**Functions to implement:**

- **`searchDoctorsService(queryParams)`**
  - Extract query parameters: `q`, `specialization`, `location`, `minPrice`, `maxPrice`, `page`, `limit`
  - Build MongoDB query using helper functions
  - Apply pagination (default: page=1, limit=10)
  - Only include doctors with approved User status
  - Populate user data (email, profilePicture)
  - Return: `{ doctors, pagination: { page, limit, total, pages } }`

- **`buildSearchQuery(searchText)`** (helper)
  - If `q` parameter provided, create text search query
  - Use MongoDB `$text` search on indexed fields
  - Return query object or empty object if no search text

- **`buildFilterQuery(filters)`** (helper)
  - Build filter object from query params:
    - `specialization`: Exact match
    - `location`: Partial match on clinicAddress using `$regex` (case-insensitive)
    - `minPrice`: `ratePerSession >= minPrice`
    - `maxPrice`: `ratePerSession <= maxPrice`
  - Return combined filter object

- **`getApprovedDoctorsUserIds()`** (helper - optional optimization)
  - Pre-fetch approved doctor user IDs for efficient filtering
  - Alternative: Use aggregation with $lookup to join User collection

**Query Building Logic:**

```javascript
// Base query: Only approved doctors
const baseQuery = {
  // Join with User to filter by status
  // Will use aggregation or separate User query
};

// Add text search
if (searchText) {
  query.$text = { $search: searchText };
}

// Add filters
if (specialization) query.specialization = specialization;
if (location) query.clinicAddress = { $regex: location, $options: 'i' };
if (minPrice) query.ratePerSession = { ...query.ratePerSession, $gte: minPrice };
if (maxPrice) query.ratePerSession = { ...query.ratePerSession, $lte: maxPrice };
```

**Status Filtering Approach:**

- Option 1: Use aggregation pipeline with `$lookup` to join User collection
- Option 2: Pre-fetch approved doctor userIds, then filter by `userId: { $in: approvedIds }`
- Option 3: Add status field to Doctor model (denormalization - not recommended)

**Recommended:** Use aggregation pipeline for clean separation and real-time status

### 3. Create Search Controller (`controllers/doctorSearch.controller.js`)

**Functions to implement:**

- **`searchDoctors`**
  - Extract query parameters from `req.query`
  - Validate query parameters (optional - can use Joi if needed)
  - Call `searchDoctorsService()`
  - Return 200 with doctors array and pagination metadata
  - Handle errors appropriately

**Query Parameters:**

- `q` (string, optional): Search text
- `specialization` (string, optional): Exact specialization match
- `location` (string, optional): Partial location match
- `minPrice` (number, optional): Minimum rate per session
- `maxPrice` (number, optional): Maximum rate per session
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 10): Results per page
- `sortBy` (string, optional): Sort field (rating, ratePerSession, yearsOfExperience)
- `sortOrder` (string, optional): 'asc' or 'desc' (default: 'desc')

### 4. Add Search Route (`routes/doctor.routes.js`)

**Route definition:**

```javascript
GET /api/doctors/search
```

**Middleware:**

- No authentication required (public endpoint)
- Optional: Query parameter validation middleware

**Route handler:**

```javascript
router.get("/search", doctorSearchController.searchDoctors);
```

### 5. Response Format

**Success Response (200):**

```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": {
    "doctors": [
      {
        "_id": "...",
        "firstName": "...",
        "lastName": "...",
        "specialization": "...",
        "clinicAddress": "...",
        "ratePerSession": 100,
        "rating": 4.5,
        "totalReviews": 20,
        "yearsOfExperience": 10,
        "bio": "...",
        "email": "...",
        "profilePicture": "...",
        "fullName": "Dr. ..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid query parameters",
  "errors": [...]
}
```

## Query Parameter Specifications

### Search Parameters

| Parameter | Type | Required | Description | Example |

|-----------|------|----------|-------------|---------|

| `q` | string | No | Text search query | `?q=cardiology` |

| `specialization` | string | No | Exact specialization match | `?specialization=Cardiology` |

| `location` | string | No | Partial location match | `?location=Cairo` |

| `minPrice` | number | No | Minimum rate per session | `?minPrice=50` |

| `maxPrice` | number | No | Maximum rate per session | `?maxPrice=200` |

| `page` | number | No | Page number (default: 1) | `?page=2` |

| `limit` | number | No | Results per page (default: 10, max: 50) | `?limit=20` |

| `sortBy` | string | No | Sort field (rating, ratePerSession, yearsOfExperience) | `?sortBy=rating` |

| `sortOrder` | string | No | Sort order (asc, desc, default: desc) | `?sortOrder=asc` |

## Implementation Details

### Text Search Implementation

**MongoDB Text Search:**

- Use `$text` operator with text index
- Search across: firstName, lastName, bio, specialization, otherSpecialization
- Case-insensitive and supports partial matches
- Score results by relevance (use `$meta: "textScore"` for sorting)

**Example Query:**

```javascript
Doctor.find({ $text: { $search: "cardiology" } })
  .sort({ score: { $meta: "textScore" } })
```

### Filter Implementation

**Specialization Filter:**

- Exact match on `specialization` field
- Validate against enum values from Doctor model

**Location Filter:**

- Case-insensitive regex match on `clinicAddress`
- Example: `clinicAddress: { $regex: "cairo", $options: "i" }`

**Price Filter:**

- Range query on `ratePerSession`
- Combine min and max: `ratePerSession: { $gte: minPrice, $lte: maxPrice }`

### Pagination Implementation

**Default Values:**

- `page`: 1
- `limit`: 10 (max: 50 to prevent performance issues)

**Calculation:**

```javascript
const skip = (page - 1) * limit;
const doctors = await Doctor.find(query).skip(skip).limit(limit);
const total = await Doctor.countDocuments(query);
const pages = Math.ceil(total / limit);
```

### Status Filtering (Approved Doctors Only)

**Approach: Aggregation Pipeline**

```javascript
Doctor.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $match: {
      "user.status": "approved",
      // ... other filters
    }
  },
  {
    $unwind: "$user"
  },
  {
    $project: {
      // Select fields to return
    }
  },
  { $skip: skip },
  { $limit: limit }
])
```

**Alternative: Two-Step Query**

1. Find approved doctor userIds from User collection
2. Filter Doctor collection by `userId: { $in: approvedUserIds }`

**Recommended:** Aggregation pipeline for single query and better performance

## Sorting Options

**Default Sort:**

- If text search: Sort by text score (relevance)
- Otherwise: Sort by rating (descending)

**Available Sort Fields:**

- `rating`: Doctor rating (desc by default)
- `ratePerSession`: Price (asc/desc)
- `yearsOfExperience`: Experience (desc by default)
- `totalReviews`: Number of reviews (desc by default)

## Error Handling

**Validation Errors:**

- Invalid page number (< 1): Return 400
- Invalid limit (> 50 or < 1): Return 400
- Invalid specialization value: Return 400
- Invalid sortBy field: Return 400

**Database Errors:**

- Return 500 with generic error message

## Performance Considerations

1. **Indexes**: All filter fields indexed for fast queries
2. **Text Index**: Compound text index for search
3. **Limit Enforcement**: Max limit of 50 to prevent large result sets
4. **Lean Queries**: Use `.lean()` for read-only queries (faster)
5. **Selective Fields**: Only return necessary fields in response
6. **Aggregation**: Use aggregation pipeline for efficient User join

## Files to Create/Modify

**New Files:**

- `services/doctorSearch.service.js`
- `controllers/doctorSearch.controller.js`

**Modified Files:**

- `models/Doctor.js` - Add indexes
- `routes/doctor.routes.js` - Add search route

## Testing Considerations

**Test Cases:**

1. Text search with various queries
2. Filter by specialization
3. Filter by location (partial match)
4. Filter by price range
5. Combined filters
6. Pagination (page, limit)
7. Sorting options
8. Empty results
9. Invalid query parameters
10. Only approved doctors returned

## Future Enhancements

1. **Geolocation Search**: Add latitude/longitude for distance-based search
2. **Advanced Filters**: Gender, years of experience range
3. **Faceted Search**: Return available filter options with counts
4. **Search Suggestions**: Autocomplete for search queries
5. **Caching**: Cache popul