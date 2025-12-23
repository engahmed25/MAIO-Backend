---
name: Doctor Profile Management
overview: "Design and implement a complete Doctor Profile Management system with three core features: Get doctor profile, Update doctor profile, and Upload verification documents. The implementation follows the existing service/controller architecture and integrates with the current authentication and file upload infrastructure."
todos:
  - id: create-doctor-service
    content: Create services/doctor.service.js with getDoctorProfileService, updateDoctorProfileService, uploadVerificationDocumentsService, and deleteOldFile helper
    status: completed
  - id: create-doctor-validator
    content: Create validators/doctorValidator.js with updateProfileSchema for profile updates
    status: completed
  - id: extend-auth-middleware
    content: Add authorize() function to middleware/auth.js for role-based access control
    status: completed
  - id: create-doctor-controller
    content: Create controllers/doctor.controller.js with getDoctorProfile, updateDoctorProfile, and uploadVerificationDocuments handlers
    status: completed
    dependencies:
      - create-doctor-service
  - id: create-doctor-routes
    content: Create routes/doctor.routes.js with GET /:doctorId, GET /me, PATCH /me, and POST /me/documents endpoints
    status: completed
    dependencies:
      - create-doctor-controller
      - create-doctor-validator
      - extend-auth-middleware
  - id: register-routes
    content: Register doctor routes in index.js with app.use("/api/doctors", ...)
    status: completed
    dependencies:
      - create-doctor-routes
---

# Doctor Profile Management - Technical Design Document

## Current State Analysis

### Existing Infrastructure

- **Model**: `models/Doctor.js` - Comprehensive schema with all required fields including verification documents (phdCertificate, medicalLicense, idProof)
- **File Upload**: `config/multer.js` - Configured with disk storage, file type validation, and 5MB size limit
- **Authentication**: `middleware/auth.js` - `protect` middleware sets `req.user` with authenticated User document
- **Validation**: `middleware/validation.js` - Joi-based validation with `validate()` and `validateFiles()` helpers
- **File Persistence**: `services/authService.js` - `persistFileFromBuffer()` helper for saving files from memory to disk

### Gaps Identified

- No doctor controller, service, or routes files exist
- No role-based authorization middleware (need to ensure doctors can only update their own profile)
- No file cleanup utility for deleting old files
- No validation schemas for profile updates
- Doctor routes not registered in `index.js`

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────────┐
│         Express Routes               │
│    routes/doctor.routes.js           │
└──────┬───────────────────────────────┘
       │
       ├──► Authentication Middleware (protect)
       ├──► Validation Middleware (validate, validateFiles)
       ├──► File Upload Middleware (multer)
       │
       ▼
┌─────────────────────────────────────┐
│      Controllers Layer               │
│   controllers/doctor.controller.js  │
│  - getDoctorProfile                  │
│  - updateDoctorProfile               │
│  - uploadVerificationDocuments       │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│       Services Layer                 │
│    services/doctor.service.js       │
│  - getDoctorProfileService           │
│  - updateDoctorProfileService        │
│  - uploadVerificationDocumentsService│
│  - deleteOldFile (helper)            │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│       Models Layer                   │
│  - Doctor (mongoose model)           │
│  - User (mongoose model)              │
└──────────────────────────────────────┘
```

## Implementation Plan

### 1. Create Doctor Service (`services/doctor.service.js`)

**Functions to implement:**

- **`getDoctorProfileService(userId)`**
  - Find doctor by `userId` (from Doctor model)
  - Populate `userId` field to get User details (email, status, profilePicture)
  - Return combined doctor + user data
  - Handle case where doctor profile doesn't exist

- **`updateDoctorProfileService(userId, updateData)`**
  - Validate that doctor exists for the given userId
  - Update allowed fields: firstName, lastName, phoneNumber, gender, yearsOfExperience, specialization, otherSpecialization, clinicAddress, bio, ratePerSession
  - **Restrictions**: Cannot update verification documents via this endpoint (use upload endpoint)
  - Return updated doctor profile

- **`uploadVerificationDocumentsService(userId, files)`**
  - Validate doctor exists
  - Accept files: phdCertificate, medicalLicense, idProof (all optional, but at least one required)
  - For each provided file:
    - Delete old file from disk (if exists)
    - Save new file using existing `persistFileFromBuffer()` pattern
    - Update doctor document with new file path
  - **Critical**: Update User.status to "pending" when verification documents are updated
  - Return updated doctor profile

- **`deleteOldFile(filePath)`** (helper)
  - Safely delete file from disk if it exists
  - Handle errors gracefully (log but don't throw)

### 2. Create Doctor Controller (`controllers/doctor.controller.js`)

**Functions to implement:**

- **`getDoctorProfile`**
  - Extract `doctorId` from route params or `req.user._id` (if self-access)
  - Call `getDoctorProfileService()`
  - Return 200 with profile data

- **`updateDoctorProfile`**
  - Extract `req.user._id` (authenticated user)
  - Validate user is a doctor (check `req.user.role === 'doctor'`)
  - Get validated data from `req.validatedData`
  - Call `updateDoctorProfileService()`
  - Return 200 with updated profile

- **`uploadVerificationDocuments`**
  - Extract `req.user._id` (authenticated user)
  - Validate user is a doctor
  - Validate at least one file is provided
  - Call `uploadVerificationDocumentsService()`
  - Return 200 with updated profile and status change notification

### 3. Create Doctor Routes (`routes/doctor.routes.js`)

**Route definitions:**

```javascript
GET    /api/doctors/:doctorId        - Get doctor profile (public, authenticated)
GET    /api/doctors/me                - Get own profile (doctor only)
PATCH  /api/doctors/me                - Update own profile (doctor only)
POST   /api/doctors/me/documents     - Upload verification documents (doctor only)
```

**Middleware chain:**

- All routes: `protect` (authentication required)
- Update/Upload routes: Role check (doctor only)
- Update route: `validate(updateProfileSchema)`
- Upload route: `upload.memory.fields([...])` + `validateFiles([...])`

### 4. Create Validation Schemas (`validators/doctorValidator.js`)

**Schemas needed:**

- **`updateProfileSchema`** (Joi)
  - firstName, lastName: string, min 2, max 50, optional
  - phoneNumber: string, pattern /^[0-9]{10,15}$/, optional
  - gender: enum ['male', 'female', 'other'], optional
  - yearsOfExperience: number, min 0, max 70, optional
  - specialization: enum (from Doctor model), optional
  - otherSpecialization: string, optional (required if specialization === 'Other')
  - clinicAddress: string, optional
  - bio: string, max 1000, optional
  - ratePerSession: number, min 0, optional
  - **Exclude**: phdCertificate, medicalLicense, idProof (must use upload endpoint)

### 5. Create Role Authorization Middleware (`middleware/auth.js` - extend)

**New function:**

- **`authorize(...roles)`**
  - Check `req.user.role` is in allowed roles array
  - Return 403 if unauthorized
  - Use: `authorize('doctor')` for doctor-only routes

### 6. File Management Strategy

**File Upload Flow:**

1. Client sends multipart/form-data with files
2. Multer memory storage receives files
3. Service validates files exist
4. For each file:

   - Check if old file path exists in doctor document
   - Delete old file from disk (if exists)
   - Save new file using `persistFileFromBuffer()`
   - Update doctor document with new path

5. Update User.status to "pending"

**File Cleanup:**

- Delete old files synchronously before saving new ones
- Use `fs.unlinkSync()` with try-catch for error handling
- Log errors but don't fail the operation if cleanup fails

### 7. Register Routes in `index.js`

Add: `app.use("/api/doctors", require("./routes/doctorRoutes"));`

## API Endpoint Specifications

### GET /api/doctors/:doctorId

- **Access**: Authenticated users
- **Response**: Doctor profile with populated user data
- **Status Codes**: 200 (success), 404 (not found), 401 (unauthorized)

### GET /api/doctors/me

- **Access**: Doctor only
- **Response**: Own doctor profile
- **Status Codes**: 200 (success), 403 (not a doctor), 404 (profile not found)

### PATCH /api/doctors/me

- **Access**: Doctor only
- **Body**: Partial profile update (JSON)
- **Response**: Updated doctor profile
- **Status Codes**: 200 (success), 400 (validation error), 403 (unauthorized), 404 (not found)

### POST /api/doctors/me/documents

- **Access**: Doctor only
- **Body**: multipart/form-data with phdCertificate, medicalLicense, idProof (at least one required)
- **Response**: Updated doctor profile with status change notification
- **Status Codes**: 200 (success), 400 (no files provided), 403 (unauthorized), 404 (not found)

## Data Flow Diagrams

### Get Profile Flow

```
Client → Route → protect → Controller → Service → Doctor.find() → Response
```

### Update Profile Flow

```
Client → Route → protect → authorize('doctor') → validate() → Controller → Service → Doctor.updateOne() → Response
```

### Upload Documents Flow

```
Client → Route → protect → authorize('doctor') → multer → validateFiles() → Controller → Service → [Delete Old Files → Save New Files → Update Doctor → Update User.status] → Response
```

## Error Handling

**Standard Error Response Format:**

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (dev only)"
}
```

**Specific Error Cases:**

- Doctor profile not found: 404
- Unauthorized (not doctor): 403
- Validation errors: 400 with errors array
- File upload errors: 400 with specific file error
- Database errors: 500

## Security Considerations

1. **Authentication**: All routes protected by `protect` middleware
2. **Authorization**: Update/upload routes restricted to doctors only
3. **File Validation**: Multer fileFilter ensures only allowed file types
4. **File Size Limit**: 5MB per file enforced by multer
5. **Path Traversal**: File paths stored as relative paths, not user-controlled
6. **Status Change**: Verification document updates trigger re-verification (status → pending)

## Technical Debt & Future Considerations

1. **File Storage**: Consider moving to cloud storage (S3, Cloudinary) for production
2. **File Versioning**: Current implementation deletes old files; consider versioning for audit trail
3. **Admin Endpoints**: Future: Admin endpoints to view/approve doctor profiles
4. **Caching**: Consider caching doctor profiles for public endpoints
5. **Image Optimization**: Consider image compression for profile pictures
6. **Document Validation**: Future: Add document content validation (OCR, format checks)

## Files to Create/Modify

**New Files:**

- `services/doctor.service.js`
- `controllers/doctor.controller.js`
- `routes/doctor.routes.js`
- `validators/doctorValidator.js`

**Modified Files:**

- `middleware/auth.js` - Add `authorize()` function
- `index.js` - Register doctor routes

**Dependencies:**

- All required dependencies already exist (express, mongoose, multer, joi, fs)