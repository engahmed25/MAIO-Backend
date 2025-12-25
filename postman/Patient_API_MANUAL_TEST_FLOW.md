# Manual Test Flow - Patient API Collection

This document provides step-by-step instructions for manually testing the Patient API endpoints, with special focus on the contact verification flow.

## Prerequisites

1. **Import Collection**: Import `Patient_API_Collection.json` into Postman
2. **Set Environment Variables**:
   - `baseUrl`: Your API base URL (e.g., `http://localhost:9000`)
   - `token`: Your authentication token (obtain from login endpoint)
3. **Server Running**: Ensure your backend server is running
4. **Test Data**: Have at least one patient account for testing
5. **Test Files**: Prepare sample image files for profile picture and PDF files for medical documents

---

## Flow 1: Patient Profile Management

### Step 1: Get My Profile

**Request**: `GET /api/patients/me`

**Purpose**: Retrieve the authenticated patient's own profile.

**Steps**:
1. Select the "Get My Profile" request
2. Ensure `token` environment variable is set with a valid patient token
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains profile fields:
     - `firstName`, `lastName`, `email`, `age`, `gender`
     - `emergencyContactNumber`, `reasonForSeeingDoctor`
     - `drugAllergies`, `illnesses`, `currentMedications`, `smoking`
   - Note the `_id` value (saved automatically to `patientId` variable)

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "firstName": "Mariam",
    "lastName": "Hassan",
    "email": "mariam@example.com",
    "age": 32,
    "gender": "female",
    "emergencyContactNumber": "01023456789",
    "profilePicture": null,
    "isDeleted": false,
    ...
  }
}
```

---

### Step 2: Update Profile

**Request**: `PATCH /api/patients/me`

**Purpose**: Update patient profile information.

**Steps**:
1. Select the "Update Profile" request
2. Ensure `token` is set with a valid patient token
3. Modify the request body JSON as needed:
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
    "firstName": "Mariam",
    "lastName": "Hassan",
    ...
  }
}
```

**Test Cases**:
- Update single field (e.g., only `age`)
- Update multiple fields
- Try invalid data (should fail with 400 validation error)
- Try updating email/phone directly (should fail - use contact verification flow)

---

### Step 3: Update Profile Picture

**Request**: `PATCH /api/patients/me/profile-picture`

**Purpose**: Upload or update the patient's profile picture.

**Steps**:
1. Select the "Update Profile Picture" request
2. Ensure `token` is set with a valid patient token
3. In the "Body" tab, select "form-data"
4. Add file for `profilePicture` field:
   - Select a JPG, PNG, or similar image file
   - File should be reasonable size (< 5MB recommended)
5. Click "Send"
6. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data.profilePicture` contains the file path
   - File path is not null

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "_id": "...",
    "profilePicture": "uploads/profilePicture/profilePicture-1234567890-123456789.jpg",
    ...
  }
}
```

**Test Cases**:
- Upload valid image file (JPG, PNG)
- Upload large file (should handle gracefully)
- Upload invalid file type (should fail with 400)

---

### Step 4: Delete Profile Picture

**Request**: `DELETE /api/patients/me/profile-picture`

**Purpose**: Delete the patient's profile picture.

**Steps**:
1. Select the "Delete Profile Picture" request
2. Ensure `token` is set with a valid patient token
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data.profilePicture` is `null`

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile picture removed successfully",
  "data": {
    "_id": "...",
    "profilePicture": null,
    ...
  }
}
```

---

## Flow 2: Medical Records Management

### Step 1: Add Medical History (Merge)

**Request**: `POST /api/patients/me/medical-history`

**Purpose**: Add medical history entries by merging with existing data.

**Steps**:
1. Select the "Add Medical History (merge)" request
2. Ensure `token` is set with a valid patient token
3. Modify the request body JSON:
   ```json
   {
     "chronicDiseases": ["Hypertension"],
     "allergies": ["Peanuts"],
     "notes": "Monitor blood pressure daily"
   }
   ```
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data.medicalHistory` contains merged values
   - New values are added to existing arrays (no duplicates)

**Expected Response**:
```json
{
  "success": true,
  "message": "Medical history updated",
  "data": {
    "_id": "...",
    "medicalHistory": {
      "chronicDiseases": ["Hypertension", "Diabetes"],
      "allergies": ["Peanuts", "Penicillin"],
      "notes": "Monitor blood pressure daily"
    },
    ...
  }
}
```

**Test Cases**:
- Add new diseases/allergies (should merge)
- Add duplicate diseases/allergies (should not create duplicates)
- Update notes (should replace)

---

### Step 2: Replace Medical History

**Request**: `PUT /api/patients/me/medical-history`

**Purpose**: Replace entire medical history.

**Steps**:
1. Select the "Replace Medical History" request
2. Ensure `token` is set with a valid patient token
3. Modify the request body JSON:
   ```json
   {
     "chronicDiseases": ["Hypertension", "Diabetes"],
     "allergies": ["Peanuts", "Penicillin"],
     "notes": "Updated comprehensive history"
   }
   ```
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data.medicalHistory` matches exactly what was sent
   - Previous values are completely replaced

**Expected Response**:
```json
{
  "success": true,
  "message": "Medical history replaced",
  "data": {
    "_id": "...",
    "medicalHistory": {
      "chronicDiseases": ["Hypertension", "Diabetes"],
      "allergies": ["Peanuts", "Penicillin"],
      "notes": "Updated comprehensive history"
    },
    ...
  }
}
```

**Test Cases**:
- Replace with new values
- Replace with empty arrays
- Replace with partial data (only some fields)

---

### Step 3: Upload Medical Document

**Request**: `POST /api/patients/me/medical-documents`

**Purpose**: Upload a medical document (lab results, reports, etc.).

**Steps**:
1. Select the "Upload Medical Document" request
2. Ensure `token` is set with a valid patient token
3. In the "Body" tab, select "form-data"
4. Add:
   - `medicalDocument`: Select a PDF or document file
   - `title`: (Optional) Enter a title like "CBC Results - Dec 2025"
5. Click "Send"
6. **Verify**:
   - Status code is `201`
   - Response contains `success: true`
   - Response `data` contains:
     - `_id` (document ID - saved to `documentId` variable)
     - `filePath`
     - `title`
     - `fileType`
     - `uploadedAt`

**Expected Response**:
```json
{
  "success": true,
  "message": "Medical document uploaded successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "CBC Results - Dec 2025",
    "filePath": "uploads/medicalDocuments/medicalDocument-1234567890-123456789.pdf",
    "fileType": "application/pdf",
    "uploadedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Test Cases**:
- Upload with title
- Upload without title (should use filename)
- Upload multiple documents
- Upload invalid file type (should fail with 400)

---

### Step 4: Get Medical Records

**Request**: `GET /api/patients/me/medical-records`

**Purpose**: Retrieve all medical history and documents.

**Steps**:
1. Select the "Get Medical Records" request
2. Ensure `token` is set with a valid patient token
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains:
     - `name`: Patient full name
     - `profilePicture`: Profile picture path or null
     - `medicalHistory`: Object with chronicDiseases, allergies, notes
     - `medicalDocuments`: Array of document objects

**Expected Response**:
```json
{
  "success": true,
  "message": "Medical records retrieved successfully",
  "data": {
    "name": "Mariam Hassan",
    "profilePicture": "uploads/profilePicture/...",
    "medicalHistory": {
      "chronicDiseases": ["Hypertension", "Diabetes"],
      "allergies": ["Peanuts", "Penicillin"],
      "notes": "Updated comprehensive history"
    },
    "medicalDocuments": [
      {
        "_id": "...",
        "title": "CBC Results - Dec 2025",
        "filePath": "...",
        "fileType": "application/pdf",
        "uploadedAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### Step 5: Delete Medical Document

**Request**: `DELETE /api/patients/me/medical-documents/:documentId`

**Purpose**: Delete a medical document by ID.

**Steps**:
1. Select the "Delete Medical Document" request
2. Ensure `token` is set with a valid patient token
3. Ensure `documentId` environment variable is set (from Step 3)
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains remaining documents array
   - Deleted document is no longer in the array

**Expected Response**:
```json
{
  "success": true,
  "message": "Medical document deleted successfully",
  "data": [
    {
      "_id": "...",
      "title": "...",
      ...
    }
  ]
}
```

**Test Cases**:
- Delete existing document (should succeed)
- Delete non-existent document (should fail with 400)
- Delete with invalid documentId format (should fail with 400)

---

## Flow 3: Contact Verification Flow (IMPORTANT)

This is a critical two-step flow for updating email or phone number securely.

### Step 1: Request Contact Update Code

**Request**: `POST /api/patients/me/contact/request-code`

**Purpose**: Request a verification code to update email or phone number.

**Steps**:
1. Select the "Request Contact Update Code" request
2. Ensure `token` is set with a valid patient token
3. Modify the request body JSON:
   ```json
   {
     "email": "new.email@example.com",
     "phoneNumber": "01098765432"
   }
   ```
   **Note**: At least one of `email` or `phoneNumber` is required. You can provide both or just one.
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains:
     - `pendingEmail`: The email that will be updated (if email was provided)
     - `pendingPhoneNumber`: The phone that will be updated (if phoneNumber was provided)
     - `expiresAt`: Timestamp when code expires (10 minutes from now)
     - `code`: **Only in non-production** - The 6-digit verification code
   - **In non-production**: Code is automatically saved to `verificationCode` environment variable
   - **In production**: Code is sent via email/SMS only

**Expected Response (Non-Production)**:
```json
{
  "success": true,
  "message": "Verification code sent. Please confirm to finalize the update.",
  "data": {
    "pendingEmail": "new.email@example.com",
    "pendingPhoneNumber": "01098765432",
    "expiresAt": "2025-01-15T10:40:00.000Z",
    "code": "123456"
  }
}
```

**Expected Response (Production)**:
```json
{
  "success": true,
  "message": "Verification code sent. Please confirm to finalize the update.",
  "data": {
    "pendingEmail": "new.email@example.com",
    "pendingPhoneNumber": "01098765432",
    "expiresAt": "2025-01-15T10:40:00.000Z"
  }
}
```

**Test Cases**:
- Request code for email only
- Request code for phoneNumber only
- Request code for both email and phoneNumber
- Try with same email as current (should fail with 400)
- Try with email already in use (should fail with 400)
- Try with phoneNumber already in use (should fail with 400)
- Try without email or phoneNumber (should fail with 400)

---

### Step 2: Confirm Contact Update

**Request**: `POST /api/patients/me/contact/confirm-code`

**Purpose**: Confirm the contact update using the verification code.

**Steps**:
1. **Get the verification code**:
   - **In non-production**: Check the `verificationCode` environment variable (auto-saved from Step 1)
   - **In production**: Check your email or SMS for the 6-digit code
2. Select the "Confirm Contact Update" request
3. Ensure `token` is set with a valid patient token
4. Modify the request body JSON:
   ```json
   {
     "code": "123456"
   }
   ```
   Use the actual code from Step 1 (or from email/SMS in production)
5. Click "Send"
6. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains:
     - `email`: Updated email (if email was being changed)
     - `phoneNumber`: Updated phone number (if phoneNumber was being changed)
   - Email/phone in profile is now updated

**Expected Response**:
```json
{
  "success": true,
  "message": "Contact information updated successfully",
  "data": {
    "email": "new.email@example.com",
    "phoneNumber": "01098765432"
  }
}
```

**Test Cases**:
- Confirm with correct code (should succeed)
- Confirm with incorrect code (should fail with 400)
- Confirm with expired code (should fail with 400 - wait 10+ minutes)
- Confirm without requesting code first (should fail with 400)
- Try confirming twice with same code (should fail - code is cleared after first use)

---

### Step 3: Verify Contact Update

**Purpose**: Verify that the contact information was actually updated.

**Steps**:
1. Call "Get My Profile" request again
2. **Verify**:
   - Response `data.email` matches the new email (if email was updated)
   - Response `data.phoneNumber` matches the new phone number (if phoneNumber was updated)
   - Old email/phone is no longer present

---

## Flow 4: Security & Account Management

### Step 1: Change Password

**Request**: `POST /api/patients/me/change-password`

**Purpose**: Change the patient's password.

**Steps**:
1. Select the "Change Password" request
2. Ensure `token` is set with a valid patient token
3. Modify the request body JSON:
   ```json
   {
     "currentPassword": "OldPassword123",
     "newPassword": "NewPassword456"
   }
   ```
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response message indicates password was updated
   - **Important**: After password change, refresh tokens are cleared, so you'll need to log in again

**Expected Response**:
```json
{
  "success": true,
  "message": "Password updated successfully. Please log in again with your new password."
}
```

**Test Cases**:
- Change with correct current password (should succeed)
- Change with incorrect current password (should fail with 400)
- Change with weak new password (should fail with 400 validation)
- Try logging in with old password (should fail)
- Try logging in with new password (should succeed)

---

### Step 2: Update Account Status

**Request**: `PATCH /api/patients/me/account-status`

**Purpose**: Enable or disable the account.

**Steps**:
1. Select the "Update Account Status (disable/enable)" request
2. Ensure `token` is set with a valid patient token
3. Modify the request body JSON:
   ```json
   {
     "disabled": true
   }
   ```
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data.isDeleted` matches the `disabled` value
   - **Important**: When `disabled: true`, refresh tokens are cleared

**Expected Response**:
```json
{
  "success": true,
  "message": "Account disabled successfully",
  "data": {
    "isDeleted": true
  }
}
```

**Test Cases**:
- Disable account (should succeed, tokens cleared)
- Enable account (should succeed)
- Try accessing endpoints with disabled account (should fail with 401/403)

---

### Step 3: Logout From All Devices

**Request**: `POST /api/patients/me/logout-all`

**Purpose**: Logout from all devices by clearing refresh tokens.

**Steps**:
1. Select the "Logout From All Devices" request
2. Ensure `token` is set with a valid patient token
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response message indicates logout success
   - **Important**: After this, all refresh tokens are cleared, so you'll need to log in again

**Expected Response**:
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

**Test Cases**:
- Logout from all devices (should succeed)
- Try using old token after logout (should fail with 401)
- Try refreshing token after logout (should fail)

---

### Step 4: Soft Delete Account

**Request**: `DELETE /api/patients/me`

**Purpose**: Soft delete the patient account.

**Steps**:
1. Select the "Soft Delete Account" request
2. Ensure `token` is set with a valid patient token
3. Click "Send"
4. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response message indicates account is marked as deleted
   - **Important**: After soft delete, account cannot authenticate

**Expected Response**:
```json
{
  "success": true,
  "message": "Account marked as deleted. Contact support if this was unintentional."
}
```

**Test Cases**:
- Soft delete account (should succeed)
- Try logging in after soft delete (should fail)
- Try accessing endpoints after soft delete (should fail with 401/403)

---

## Flow 5: Public Access

### Step 1: Get Public Profile

**Request**: `GET /api/patients/:patientId/public`

**Purpose**: Get a limited public profile by patient ID (no authentication required).

**Steps**:
1. Select the "Get Public Profile" request
2. Ensure `patientId` environment variable is set (from Flow 1, Step 1)
3. **No authentication required** (public endpoint)
4. Click "Send"
5. **Verify**:
   - Status code is `200`
   - Response contains `success: true`
   - Response `data` contains limited fields:
     - `patientId`
     - `firstName`
     - `lastName`
     - `gender`
     - `profilePicture`
     - `illnesses`
   - Response does NOT contain sensitive data (email, phone, medical history, etc.)

**Expected Response**:
```json
{
  "success": true,
  "message": "Public profile retrieved successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "firstName": "Mariam",
    "lastName": "Hassan",
    "gender": "female",
    "profilePicture": "uploads/profilePicture/...",
    "illnesses": ["Diabetes", "Asthma"]
  }
}
```

**Test Cases**:
- Get public profile with valid patientId (should succeed)
- Get public profile with invalid patientId format (should fail with 400)
- Get public profile with non-existent patientId (should fail with 404)
- Verify sensitive data is not exposed

---

## Complete Test Flow Summary

### Recommended Testing Order

1. **Profile Setup**
   - Get My Profile
   - Update Profile
   - Update Profile Picture
   - Delete Profile Picture

2. **Medical Records**
   - Add Medical History (merge)
   - Replace Medical History
   - Upload Medical Document
   - Get Medical Records
   - Delete Medical Document

3. **Contact Verification** ⭐ **CRITICAL FLOW**
   - Request Contact Update Code
   - Confirm Contact Update
   - Verify Contact Update (Get Profile)

4. **Security**
   - Change Password
   - Update Account Status
   - Logout From All Devices

5. **Public Access**
   - Get Public Profile

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check that `token` environment variable is set
   - Verify token is valid and not expired
   - Ensure account is not disabled or soft-deleted

2. **403 Forbidden**:
   - Verify user has "patient" role for patient-only endpoints

3. **400 Bad Request**:
   - Check request body format (JSON)
   - Verify required fields are present
   - Check validation rules (field lengths, formats, etc.)
   - For contact update: Ensure at least one of email/phoneNumber is provided

4. **404 Not Found**:
   - Verify `patientId` or `documentId` is correct
   - Check patient/document exists in database

5. **Contact Verification Issues**:
   - **Code expired**: Request a new code (10-minute expiration)
   - **Code not received**: 
     - In non-production: Check response body for `code` field
     - In production: Check email/SMS delivery
   - **Invalid code**: Ensure code is exactly 6 digits, no spaces
   - **No pending changes**: Request a code first before confirming
   - **Code already used**: Each code can only be used once

6. **File Upload Issues**:
   - Ensure file is selected in form-data
   - Check file size limits
   - Verify file format is supported

---

## Environment Variables Reference

| Variable | Description | Auto-Saved | Example |
|----------|-------------|------------|---------|
| `baseUrl` | API base URL | No | `http://localhost:9000` |
| `token` | Authentication token | No | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `patientId` | Patient ID | Yes (from Get Profile) | `507f1f77bcf86cd799439011` |
| `documentId` | Medical document ID | Yes (from Upload Document) | `507f1f77bcf86cd799439012` |
| `verificationCode` | Contact verification code | Yes (from Request Code, non-prod only) | `123456` |

---

## Success Criteria

All tests pass when:
- ✅ All requests return expected status codes
- ✅ Response structures match specifications
- ✅ Validation errors are handled correctly
- ✅ Contact verification flow works end-to-end
- ✅ Medical history merge and replace work correctly
- ✅ File uploads work for profile pictures and documents
- ✅ Account security features work (password change, logout, soft delete)
- ✅ Public endpoint returns only limited, safe data
- ✅ Environment variables are auto-saved correctly

---

## Notes

- **Contact Verification**: This is a critical security feature. Always test the complete flow (request → confirm → verify).
- **Non-Production Testing**: In non-production environments, verification codes are returned in responses for testing convenience.
- **Token Management**: Password changes and account status updates clear refresh tokens. Be prepared to re-authenticate.
- **File Paths**: Uploaded files are stored in `uploads/` directory with subdirectories for different file types.
- **Medical History**: Understand the difference between `POST` (merge) and `PUT` (replace) operations.

