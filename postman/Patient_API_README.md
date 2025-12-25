# Patient API - Postman Collection

Complete Postman collection for testing Patient Profile Management, Medical Records, and Security flows (including contact verification).

## Files

- **Patient_API_Collection.json** - Main Postman collection with all requests and tests
- **Patient_API_Environment.json** - Environment variables template (create from collection variables)
- **Patient_API_MANUAL_TEST_FLOW.md** - Step-by-step manual testing guide
- **Patient_Registration_Login_Flow.md** - Complete registration and login guide
- **Patient_Auth_Quick_Reference.md** - Quick reference for authentication

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Patient_API_Collection.json`
4. Collection will appear in your workspace

### 2. Configure Environment Variables

Set the following variables in your Postman environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:9000` |
| `token` | Authentication token | Get from login endpoint |
| `patientId` | Patient ID (auto-saved) | Auto-populated from responses |
| `documentId` | Medical document ID (auto-saved) | Auto-populated from upload responses |
| `verificationCode` | Contact verification code | Auto-populated in non-production |

### 3. Get Authentication Token

Before testing Patient endpoints, you need to authenticate:

**Option 1: Register as Patient**
1. Use `POST /api/auth/register/patient` (see `Patient_Registration_Login_Flow.md`)
2. Copy the `accessToken` from response
3. Set it as `token` in environment variables

**Option 2: Login as Patient**
1. Use `POST /api/auth/login` with email and password
2. Copy the `accessToken` from response
3. Set it as `token` in environment variables

**See `Patient_Registration_Login_Flow.md` for complete registration and login instructions.**

## Collection Structure

```
Patient API Collection
├── Patient Profile
│   ├── Get My Profile (GET /api/patients/me)
│   ├── Update Profile (PATCH /api/patients/me)
│   ├── Update Profile Picture (PATCH /api/patients/me/profile-picture)
│   └── Delete Profile Picture (DELETE /api/patients/me/profile-picture)
├── Medical Records
│   ├── Add Medical History (merge) (POST /api/patients/me/medical-history)
│   ├── Replace Medical History (PUT /api/patients/me/medical-history)
│   ├── Upload Medical Document (POST /api/patients/me/medical-documents)
│   ├── Get Medical Records (GET /api/patients/me/medical-records)
│   └── Delete Medical Document (DELETE /api/patients/me/medical-documents/:documentId)
├── Security & Contact
│   ├── Change Password (POST /api/patients/me/change-password)
│   ├── Request Contact Update Code (POST /api/patients/me/contact/request-code)
│   ├── Confirm Contact Update (POST /api/patients/me/contact/confirm-code)
│   ├── Update Account Status (PATCH /api/patients/me/account-status)
│   ├── Logout From All Devices (POST /api/patients/me/logout-all)
│   └── Soft Delete Account (DELETE /api/patients/me)
└── Public Access
    └── Get Public Profile (GET /api/patients/:patientId/public)
```

## Features

### ✅ Automated Tests

Each request includes automated tests that verify:
- Status codes (200, 201, 400, 403, 404, 500)
- Response structure (`success`, `message`, `data`)
- Data validation (required fields, data types)
- Environment variable auto-save (patientId, documentId, verificationCode)

### ✅ Environment Variables

- `baseUrl` - API base URL (used in all requests)
- `token` - Authentication token (auto-used in protected endpoints)
- `patientId` - Auto-saved from profile responses
- `documentId` - Auto-saved from document upload responses
- `verificationCode` - Auto-saved from contact verification request (non-production only)

### ✅ Sample Data

All requests include:
- Sample request bodies (where applicable)
- Example file uploads (profile picture, medical documents)
- Contact verification flow examples

## Endpoints Overview

### Patient Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patients/me` | Patient | Get own profile |
| PATCH | `/api/patients/me` | Patient | Update profile |
| PATCH | `/api/patients/me/profile-picture` | Patient | Upload/update profile picture |
| DELETE | `/api/patients/me/profile-picture` | Patient | Delete profile picture |

### Medical Records Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/patients/me/medical-history` | Patient | Add medical history (merge) |
| PUT | `/api/patients/me/medical-history` | Patient | Replace medical history |
| POST | `/api/patients/me/medical-documents` | Patient | Upload medical document |
| GET | `/api/patients/me/medical-records` | Patient | Get medical history and documents |
| DELETE | `/api/patients/me/medical-documents/:documentId` | Patient | Delete medical document |

### Security & Contact Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/patients/me/change-password` | Patient | Change password |
| POST | `/api/patients/me/contact/request-code` | Patient | Request contact verification code |
| POST | `/api/patients/me/contact/confirm-code` | Patient | Confirm contact update with code |
| PATCH | `/api/patients/me/account-status` | Patient | Enable/disable account |
| POST | `/api/patients/me/logout-all` | Patient | Logout from all devices |
| DELETE | `/api/patients/me` | Patient | Soft delete account |

### Public Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patients/:patientId/public` | Public | Get limited public profile |

## Request Body Examples

### Update Profile

```json
{
  "firstName": "Mariam",
  "lastName": "Hassan",
  "age": 32,
  "gender": "female",
  "emergencyContactNumber": "01023456789",
  "reasonForSeeingDoctor": "Regular check-up and follow-up on previous test results.",
  "drugAllergies": "Penicillin",
  "illnesses": ["Diabetes", "Asthma"],
  "otherIllness": "",
  "operations": "Appendectomy in 2018",
  "currentMedications": "Metformin, Ventolin inhaler",
  "smoking": "no"
}
```

### Add Medical History (Merge)

```json
{
  "chronicDiseases": ["Hypertension"],
  "allergies": ["Peanuts"],
  "notes": "Monitor blood pressure daily"
}
```

### Replace Medical History

```json
{
  "chronicDiseases": ["Hypertension", "Diabetes"],
  "allergies": ["Peanuts", "Penicillin"],
  "notes": "Updated comprehensive history"
}
```

### Change Password

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

### Request Contact Update Code

```json
{
  "email": "new.email@example.com",
  "phoneNumber": "01098765432"
}
```

**Note**: At least one of `email` or `phoneNumber` is required.

### Confirm Contact Update

```json
{
  "code": "123456"
}
```

### Update Account Status

```json
{
  "disabled": true
}
```

## Contact Verification Flow

The contact verification flow is a two-step process:

### Step 1: Request Verification Code

1. Call `POST /api/patients/me/contact/request-code`
2. Provide either `email` or `phoneNumber` (or both)
3. System validates:
   - New email/phone doesn't match current
   - New email/phone isn't already in use
4. System generates 6-digit code and sends via email/SMS
5. Code is stored with 10-minute expiration
6. **In non-production**: Code is returned in response for testing

### Step 2: Confirm with Code

1. Call `POST /api/patients/me/contact/confirm-code`
2. Provide the 6-digit `code` received
3. System validates:
   - Code exists and hasn't expired
   - Code matches the stored hash
   - Pending contact changes exist
4. On success:
   - Email/phone is updated
   - Pending fields are cleared
   - Verification code is cleared

**Important**: The verification code expires after 10 minutes. Request a new code if expired.

## Test Scripts Examples

### Status Code Test

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

### Response Structure Test

```javascript
pm.test("Response success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});
```

### Auto-Save Environment Variable

```javascript
var jsonData = pm.response.json();
if (pm.response.code === 200) {
    pm.environment.set('patientId', jsonData.data._id);
}
```

### Contact Verification Code Auto-Save

```javascript
var jsonData = pm.response.json();
if (pm.response.code === 200 && jsonData.data.code) {
    pm.environment.set('verificationCode', jsonData.data.code);
}
```

## Testing Flows

See **MANUAL_TEST_FLOW.md** for detailed step-by-step testing instructions:

### Flow 1: Patient Profile Management
1. Get patient profile
2. Update profile data
3. Upload profile picture
4. Delete profile picture

### Flow 2: Medical Records
1. Add medical history (merge)
2. Replace medical history
3. Upload medical document
4. Get medical records
5. Delete medical document

### Flow 3: Contact Verification (IMPORTANT)
1. Request contact update code
2. Verify code is received (email/SMS or response in non-production)
3. Confirm contact update with code
4. Verify contact information is updated

### Flow 4: Security & Account Management
1. Change password
2. Update account status (enable/disable)
3. Logout from all devices
4. Soft delete account

### Flow 5: Public Access
1. Get public profile by patientId

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check `token` is set in environment
   - Verify token is valid and not expired
   - Ensure token hasn't been cleared by logout

2. **403 Forbidden**
   - Ensure user has "patient" role for patient-only endpoints

3. **400 Bad Request**
   - Check request body format (JSON)
   - Verify required fields are present
   - Check validation rules (field lengths, formats, etc.)
   - For contact update: Ensure at least one of email/phoneNumber is provided

4. **404 Not Found**
   - Verify `patientId` or `documentId` is correct
   - Check patient/document exists in database

5. **Contact Verification Issues**
   - **Code expired**: Request a new code (10-minute expiration)
   - **Code not received**: Check email/SMS delivery (in non-production, code is in response)
   - **Invalid code**: Ensure code is exactly 6 digits, no spaces
   - **No pending changes**: Request a code first before confirming

6. **File Upload Issues**
   - Ensure file is selected in form-data
   - Check file size limits
   - Verify file format is supported

## Notes

- **Authentication**: Most endpoints require authentication. Get token from login endpoint first.
- **File Uploads**: For profile pictures and medical documents, use `multipart/form-data` with file field.
- **Contact Verification**: In non-production environments, the verification code is returned in the response for testing convenience.
- **Medical History**: 
  - `POST` merges new values with existing (adds unique values to arrays)
  - `PUT` replaces entire medical history
- **Account Status**: Setting `disabled: true` clears refresh tokens, forcing re-login.
- **Soft Delete**: Soft-deleted accounts cannot authenticate. Contact support to restore.
- **Public Endpoint**: Public profile endpoint returns limited fields (no sensitive data).

## Environment Variables Reference

| Variable | Description | Auto-Saved | Example |
|----------|-------------|------------|---------|
| `baseUrl` | API base URL | No | `http://localhost:9000` |
| `token` | Authentication token | No | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `patientId` | Patient ID | Yes (from Get Profile) | `507f1f77bcf86cd799439011` |
| `documentId` | Medical document ID | Yes (from Upload Document) | `507f1f77bcf86cd799439012` |
| `verificationCode` | Contact verification code | Yes (from Request Code, non-prod only) | `123456` |

## Support

For issues or questions:
1. Check **MANUAL_TEST_FLOW.md** for detailed testing instructions
2. Verify environment variables are set correctly
3. Check server logs for detailed error messages
4. Ensure database connection is active
5. Verify file upload permissions for uploads directory

