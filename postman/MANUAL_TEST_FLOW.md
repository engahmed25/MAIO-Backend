# Manual Test Flow - Doctor API Collection

This document provides step-by-step instructions for manually testing the Doctor API endpoints.

## Prerequisites

1. **Import Collection**: Import `Doctor_API_Collection.json` into Postman
2. **Import Environment**: Import `Doctor_API_Environment.json` into Postman
3. **Set Environment Variables**:
   - `baseUrl`: Your API base URL (e.g., `http://localhost:9000`)
   - `token`: Your authentication token (obtain from login endpoint)
4. **Server Running**: Ensure your backend server is running
5. **Test Data**: Have at least one approved doctor account for testing

---

## Flow 1: Doctor Profile Management

### Step 1: Get Own Doctor Profile

**Request**: `GET /api/doctors/me`

**Purpose**: Retrieve the authenticated doctor's own profile.

**Steps**:
1. Select the "Get Own Profile" request
2. Ensure `token` environment variable is set with a valid doctor token
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains profile fields (firstName, lastName, specialization, etc.)
   - Note the `_id` value (saved automatically to `doctorId` variable)

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "firstName": "...",
    "lastName": "...",
    "specialization": "...",
    "email": "...",
    "status": "approved",
    ...
  }
}
```

---

### Step 2: Get Doctor by ID

**Request**: `GET /api/doctors/:doctorId`

**Purpose**: Retrieve any doctor's profile by their ID (requires authentication).

**Steps**:
1. Select the "Get Doctor by ID" request
2. Ensure `doctorId` environment variable is set (from Step 1)
3. Ensure `token` is set with any authenticated user token
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains the doctor's profile
   - Profile matches the `doctorId` used

**Expected Response**:
```json
{
  "success": true,
  "message": "Doctor profile retrieved successfully",
  "data": {
    "_id": "...",
    "firstName": "...",
    ...
  }
}
```

---

### Step 3: Update Profile

**Request**: `PATCH /api/doctors/me`

**Purpose**: Update the authenticated doctor's profile information.

**Steps**:
1. Select the "Update Profile" request
2. Ensure `token` is set with a valid doctor token
3. Modify the request body JSON as needed:
   ```json
   {
     "firstName": "Ahmed",
     "lastName": "Mohamed",
     "bio": "Updated bio text",
     "ratePerSession": 250,
     "clinicAddress": "123 Medical Street, Cairo, Egypt"
   }
   ```
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains updated values
   - Updated fields match the request body

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "...",
    "firstName": "Ahmed",
    "lastName": "Mohamed",
    ...
  }
}
```

**Test Cases**:
- Update single field (e.g., only `bio`)
- Update multiple fields
- Try updating verification documents (should fail with 400)
- Try invalid data (should fail with 400 validation error)

---

### Step 4: Upload Verification Documents

**Request**: `POST /api/doctors/me/documents`

**Purpose**: Upload verification documents (phdCertificate, medicalLicense, idProof).

**Steps**:
1. Select the "Upload Verification Documents" request
2. Ensure `token` is set with a valid doctor token
3. In the "Body" tab, select "form-data"
4. Add files for each field:
   - `phdCertificate`: Upload a PDF or DOC file (max 5MB)
   - `medicalLicense`: Upload a PDF or DOC file (max 5MB)
   - `idProof`: Upload a JPG, PNG, or PDF file (max 5MB)
   - **Note**: At least one file is required
5. Click "Send"
6. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response message mentions "pending" status
   - Response `data.status` is `"pending"` (saved to `userStatus` variable)
   - Response `data` contains file paths for uploaded documents

**Expected Response**:
```json
{
  "success": true,
  "message": "Verification documents uploaded successfully. Your account status has been set to pending for re-verification.",
  "data": {
    "_id": "...",
    "phdCertificate": "uploads/PHDCertificate/...",
    "medicalLicense": "uploads/MedicalLicense/...",
    "idProof": "uploads/IDProof/...",
    "status": "pending",
    ...
  }
}
```

**Test Cases**:
- Upload all three documents
- Upload only one document (should work)
- Upload invalid file types (should fail with 400)
- Upload files exceeding 5MB (should fail with 400)

---

### Step 5: Verify Status Change Logic

**Purpose**: Verify that uploading documents changes user status to "pending".

**Steps**:
1. After Step 4, check the `userStatus` environment variable
2. It should be set to `"pending"`
3. Call "Get Own Profile" again
4. **Verify**:
   - Response `data.status` is `"pending"`
   - This confirms the status change logic works

**Note**: In a real scenario, an admin would need to approve the doctor again after document upload.

---

## Flow 2: Doctor Search

### Step 1: Search Without Filters

**Request**: `GET /api/doctors/search`

**Purpose**: Search all approved doctors without any filters.

**Steps**:
1. Select the "Search - No Filters" request
2. **No authentication required** (public endpoint)
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data.doctors` is an array
   - Response `data.pagination` contains:
     - `page`: Current page number (default: 1)
     - `limit`: Results per page (default: 10)
     - `total`: Total number of doctors
     - `pages`: Total number of pages
   - All doctors have required fields (_id, firstName, specialization, etc.)
   - Only approved doctors are returned (check `status` field if present)

**Expected Response**:
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
        "ratePerSession": 200,
        "rating": 4.5,
        ...
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

---

### Step 2: Filter by Specialty and Location

**Request**: `GET /api/doctors/search?specialization=Cardiology&location=Cairo`

**Purpose**: Test filtering by specialization and location.

**Steps**:
1. Select the "Search - Filter by Specialization" request
2. Modify query parameters:
   - `specialization`: Set to a valid value (e.g., "Cardiology")
   - `location`: Set to a location string (e.g., "Cairo")
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - All returned doctors have `specialization: "Cardiology"`
   - All returned doctors have "Cairo" (case-insensitive) in their `clinicAddress`
   - Results are still paginated

**Test Cases**:
- Try different specializations (Cardiology, Dermatology, etc.)
- Try different locations (partial matches should work)
- Try invalid specialization (should return 400)
- Try combining with other filters

---

### Step 3: Filter by Price Range

**Request**: `GET /api/doctors/search?minPrice=100&maxPrice=300`

**Purpose**: Test filtering by price range.

**Steps**:
1. Select the "Search - Filter by Price Range" request
2. Modify query parameters:
   - `minPrice`: Set minimum price (e.g., 100)
   - `maxPrice`: Set maximum price (e.g., 300)
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - All returned doctors have `ratePerSession >= 100`
   - All returned doctors have `ratePerSession <= 300`
   - Results are still paginated

**Test Cases**:
- Try different price ranges
- Try only `minPrice` (should work)
- Try only `maxPrice` (should work)
- Try `minPrice > maxPrice` (should return 400)
- Try negative prices (should return 400)

---

### Step 4: Test Pagination

**Request**: `GET /api/doctors/search?page=2&limit=5`

**Purpose**: Test pagination functionality.

**Steps**:
1. Select the "Search - Pagination" request
2. Modify query parameters:
   - `page`: Set to page number (e.g., 2)
   - `limit`: Set to results per page (e.g., 5)
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response `pagination.page` matches requested page
   - Response `pagination.limit` matches requested limit
   - Number of doctors in array <= limit
   - Calculate: `(page - 1) * limit` should match the starting index

**Test Cases**:
- Try different page numbers (1, 2, 3, etc.)
- Try different limits (5, 10, 20, 50)
- Try `limit > 50` (should be capped at 50)
- Try `page < 1` (should return 400)
- Try `limit < 1` (should return 400)
- Verify total count remains consistent across pages

---

### Step 5: Validate Indexed Filters Work Correctly

**Purpose**: Verify that filters use database indexes for performance.

**Steps**:
1. Use MongoDB Compass or similar tool to check query execution
2. Run search queries with different filter combinations:
   - `GET /api/doctors/search?specialization=Cardiology`
   - `GET /api/doctors/search?location=Cairo`
   - `GET /api/doctors/search?minPrice=100&maxPrice=300`
   - `GET /api/doctors/search?specialization=Cardiology&location=Cairo&minPrice=100`
3. **Verify**:
   - Queries execute quickly (should use indexes)
   - Check MongoDB logs to confirm index usage
   - Response times are reasonable (< 500ms for typical queries)

**Note**: In production, you can use MongoDB's `explain()` to verify index usage.

---

## Additional Test Scenarios

### Combined Filters
- Test: `GET /api/doctors/search?specialization=Cardiology&location=Cairo&minPrice=100&maxPrice=300&page=1&limit=10`
- Verify all filters work together correctly

### Text Search
- Test: `GET /api/doctors/search?q=cardiology`
- Verify text search works across name, bio, and specialization fields

### Sorting
- Test: `GET /api/doctors/search?sortBy=rating&sortOrder=desc`
- Verify results are sorted correctly
- Try different sort fields: `rating`, `ratePerSession`, `yearsOfExperience`, `totalReviews`

### Edge Cases
- Empty results (no doctors match filters)
- Very large result sets
- Invalid query parameters
- Missing query parameters (should use defaults)

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check that `token` environment variable is set
   - Verify token is valid and not expired
   - For doctor-only endpoints, ensure user role is "doctor"

2. **403 Forbidden**:
   - Verify user has "doctor" role for doctor-only endpoints
   - Check user status is "approved" (for search results)

3. **404 Not Found**:
   - Verify `doctorId` is correct
   - Check that doctor exists in database

4. **400 Bad Request**:
   - Check request body format (JSON)
   - Verify required fields are present
   - Check validation rules (field lengths, formats, etc.)

5. **500 Internal Server Error**:
   - Check server logs
   - Verify database connection
   - Check file upload permissions

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:9000` |
| `token` | Authentication token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `doctorId` | Doctor ID (auto-saved) | `507f1f77bcf86cd799439011` |
| `userStatus` | User status (auto-saved) | `pending` or `approved` |

---

## Success Criteria

All tests pass when:
- ✅ All requests return expected status codes
- ✅ Response structures match specifications
- ✅ Validation errors are handled correctly
- ✅ Pagination works correctly
- ✅ Filters return accurate results
- ✅ Status change logic works (pending after document upload)
- ✅ Only approved doctors appear in search results
- ✅ Indexed queries perform well

---

## Flow 3: Admin Approval & User Management

### Prerequisites
- Create an admin account: `POST /api/admin/register` with JSON body:
  ```json
  {
    "email": "admin@example.com",
    "password": "Admin123",
    "firstName": "Super",
    "lastName": "Admin",
    "phoneNumber": "01012345678"
  }
  ```
- Admin login: `POST /api/admin/login` with `email`, `password`. Copy `accessToken` for the next steps (as `Bearer <token>`).

### Step 1: List Users (filters, search, pagination)
- **Request**: `GET /api/admin/users?page=1&limit=10&role=doctor&status=approved&search=john`
- **Verify**:
  - Status `200`
  - `data` array respects filters (role/status) and search (email or name)
  - `pagination` has `page`, `limit`, `total`, `pages`
- Notes:
  - `search` matches email or first/last name (doctor, patient, or admin profiles)
  - Add `includeDeleted=true` to include soft-deleted users

### Step 2: List Pending Users
- **Request**: `GET /api/admin/users/pending?page=1&limit=10`
- **Verify**:
  - Status `200`
  - All returned users have `status: "pending"`

### Step 3: Get User by ID
- **Request**: `GET /api/admin/users/:id`
- **Verify**:
  - Status `200`
  - Response `data` includes base user plus linked profile (`doctorProfile`, `patientProfile`, or `adminProfile`)

### Step 4: Approve or Revert Status
- **Request**: `PATCH /api/admin/users/:id/status`
- **Body**:
  ```json
  { "status": "approved" }
  ```
  or
  ```json
  { "status": "pending" }
  ```
- **Verify**:
  - Status `200`
  - Response `data.status` matches the requested value

### Step 5: Soft Delete User
- **Request**: `DELETE /api/admin/users/:id`
- **Verify**:
  - Status `200`
  - Response `data.isDeleted` is `true`
- Notes:
  - Soft-deleted users cannot authenticate
  - Use `includeDeleted=true` on list endpoints to audit removed accounts

---

## Notes

- **Authentication**: Most profile endpoints require authentication. Use the login endpoint to obtain a token first.
- **File Uploads**: For document uploads, ensure files are valid formats and within size limits (5MB).
- **Search Performance**: Indexed queries should be fast. If slow, verify indexes are created in MongoDB.
- **Data Cleanup**: After testing, you may want to reset test data or use a test database.

