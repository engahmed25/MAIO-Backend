# Doctor API - Postman Collection

Complete Postman collection for testing Doctor Profile Management and Doctor Search features.

## Files

- **Doctor_API_Collection.json** - Main Postman collection with all requests and tests
- **Doctor_API_Environment.json** - Environment variables template
- **MANUAL_TEST_FLOW.md** - Step-by-step manual testing guide

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Doctor_API_Collection.json`
4. Collection will appear in your workspace

### 2. Import Environment

1. Click **Environments** in left sidebar
2. Click **Import**
3. Select `Doctor_API_Environment.json`
4. Select the environment from dropdown when testing

### 3. Configure Environment Variables

Set the following variables in your environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:9000` |
| `token` | Authentication token | Get from login endpoint |

### 4. Get Authentication Token

Before testing Doctor Profile endpoints, you need to authenticate:

1. Use your existing login endpoint (e.g., `POST /api/auth/login`)
2. Copy the `accessToken` from response
3. Set it as `token` in environment variables

## Collection Structure

```
Doctor API Collection
├── Doctor Profile
│   ├── Get Own Profile (GET /api/doctors/me)
│   ├── Get Doctor by ID (GET /api/doctors/:doctorId)
│   ├── Update Profile (PATCH /api/doctors/me)
│   └── Upload Verification Documents (POST /api/doctors/me/documents)
└── Doctor Search
    ├── Search - No Filters (GET /api/doctors/search)
    ├── Search - Text Query (GET /api/doctors/search?q=...)
    ├── Search - Filter by Specialization
    ├── Search - Filter by Location
    ├── Search - Filter by Price Range
    ├── Search - Combined Filters
    ├── Search - Pagination
    ├── Search - Sorting
    └── Search - Invalid Parameters
```

## Features

### ✅ Automated Tests

Each request includes automated tests that verify:
- Status codes
- Response structure
- Data validation
- Pagination metadata
- Filter accuracy

### ✅ Environment Variables

- `baseUrl` - API base URL (used in all requests)
- `token` - Authentication token (auto-used in protected endpoints)
- `doctorId` - Auto-saved from profile responses
- `userStatus` - Auto-saved from document upload responses

### ✅ Sample Data

All requests include:
- Sample request bodies (where applicable)
- Example query parameters
- File upload examples

## Testing Flows

See **MANUAL_TEST_FLOW.md** for detailed step-by-step testing instructions:

### Flow 1: Doctor Profile
1. Get doctor profile
2. Update profile data
3. Upload verification documents
4. Verify verification status logic

### Flow 2: Doctor Search
1. Search without filters
2. Filter by specialty and location
3. Filter by price range
4. Test pagination (page & limit)
5. Validate indexed filters work correctly

## Endpoints Overview

### Doctor Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/doctors/me` | Doctor | Get own profile |
| GET | `/api/doctors/:doctorId` | Any | Get doctor by ID |
| PATCH | `/api/doctors/me` | Doctor | Update profile |
| POST | `/api/doctors/me/documents` | Doctor | Upload verification docs |

### Doctor Search Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/doctors/search` | Public | Search doctors |

### Query Parameters (Search)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Text search query |
| `specialization` | string | No | Exact specialization match |
| `location` | string | No | Partial location match |
| `minPrice` | number | No | Minimum rate per session |
| `maxPrice` | number | No | Maximum rate per session |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 10, max: 50) |
| `sortBy` | string | No | Sort field (rating, ratePerSession, etc.) |
| `sortOrder` | string | No | Sort order (asc, desc) |

## Test Scripts Examples

### Status Code Test
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

### Response Structure Test
```javascript
pm.test("Response has success property", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.eql(true);
});
```

### Pagination Test
```javascript
pm.test("Pagination metadata is correct", function () {
    var jsonData = pm.response.json();
    var pagination = jsonData.data.pagination;
    pm.expect(pagination.page).to.be.at.least(1);
    pm.expect(pagination.limit).to.be.at.least(1);
    pm.expect(pagination.total).to.be.at.least(0);
});
```

### Filter Validation Test
```javascript
pm.test("All results match specialization filter", function () {
    var jsonData = pm.response.json();
    var doctors = jsonData.data.doctors;
    doctors.forEach(function(doctor) {
        pm.expect(doctor.specialization).to.eql('Cardiology');
    });
});
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check `token` is set in environment
   - Verify token is valid and not expired

2. **403 Forbidden**
   - Ensure user has "doctor" role for doctor-only endpoints

3. **400 Bad Request**
   - Check request body format
   - Verify required fields are present
   - Check validation rules

4. **404 Not Found**
   - Verify `doctorId` is correct
   - Check doctor exists in database

See **MANUAL_TEST_FLOW.md** for detailed troubleshooting guide.

## Notes

- **Authentication**: Most profile endpoints require authentication. Get token from login endpoint first.
- **File Uploads**: For document uploads, ensure files are valid formats (PDF, DOC, JPG, PNG) and within 5MB limit.
- **Search Performance**: Indexed queries should be fast. Verify indexes are created in MongoDB.
- **Public Endpoint**: Search endpoint (`/api/doctors/search`) is public and doesn't require authentication.

## Support

For issues or questions:
1. Check **MANUAL_TEST_FLOW.md** for detailed testing instructions
2. Verify environment variables are set correctly
3. Check server logs for detailed error messages
4. Ensure database indexes are created (see `models/Doctor.js`)

