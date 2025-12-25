# Patient API Collection - Quick Reference

## Collection Structure

```
Patient API Collection
│
├── 📁 Patient Profile
│   ├── GET    /api/patients/me                    Get My Profile
│   ├── PATCH  /api/patients/me                    Update Profile
│   ├── PATCH  /api/patients/me/profile-picture     Update Profile Picture
│   └── DELETE /api/patients/me/profile-picture    Delete Profile Picture
│
├── 📁 Medical Records
│   ├── POST   /api/patients/me/medical-history           Add Medical History (merge)
│   ├── PUT    /api/patients/me/medical-history           Replace Medical History
│   ├── POST   /api/patients/me/medical-documents         Upload Medical Document
│   ├── GET    /api/patients/me/medical-records           Get Medical Records
│   └── DELETE /api/patients/me/medical-documents/:id    Delete Medical Document
│
├── 📁 Security & Contact
│   ├── POST   /api/patients/me/change-password            Change Password
│   ├── POST   /api/patients/me/contact/request-code       ⭐ Request Contact Code
│   ├── POST   /api/patients/me/contact/confirm-code       ⭐ Confirm Contact Update
│   ├── PATCH  /api/patients/me/account-status             Update Account Status
│   ├── POST   /api/patients/me/logout-all                 Logout From All Devices
│   └── DELETE /api/patients/me                           Soft Delete Account
│
└── 📁 Public Access
    └── GET    /api/patients/:patientId/public             Get Public Profile
```

## Environment Variables

| Variable | Auto-Saved | Usage |
|----------|------------|-------|
| `baseUrl` | ❌ | API base URL |
| `token` | ❌ | Auth token (Bearer) |
| `patientId` | ✅ | From Get Profile response |
| `documentId` | ✅ | From Upload Document response |
| `verificationCode` | ✅ | From Request Code (non-prod only) |

## Quick Test Flow

### 1. Profile Setup (5 min)
```
Get My Profile → Update Profile → Update Profile Picture → Delete Profile Picture
```

### 2. Medical Records (5 min)
```
Add Medical History → Replace Medical History → Upload Document → Get Records → Delete Document
```

### 3. Contact Verification ⭐ (3 min)
```
Request Code → [Get code from response/email] → Confirm Code → Verify Update
```

### 4. Security (5 min)
```
Change Password → Update Account Status → Logout All → Soft Delete
```

### 5. Public Access (1 min)
```
Get Public Profile
```

## Contact Verification Flow (Detailed)

### Step 1: Request Code
```http
POST /api/patients/me/contact/request-code
Content-Type: application/json

{
  "email": "new.email@example.com",
  "phoneNumber": "01098765432"
}
```

**Response (Non-Production)**:
```json
{
  "success": true,
  "data": {
    "pendingEmail": "new.email@example.com",
    "pendingPhoneNumber": "01098765432",
    "expiresAt": "2025-01-15T10:40:00.000Z",
    "code": "123456"  // ← Auto-saved to verificationCode
  }
}
```

### Step 2: Confirm Code
```http
POST /api/patients/me/contact/confirm-code
Content-Type: application/json

{
  "code": "{{verificationCode}}"  // ← Uses auto-saved code
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "email": "new.email@example.com",
    "phoneNumber": "01098765432"
  }
}
```

## Sample Request Bodies

### Update Profile
```json
{
  "firstName": "Mariam",
  "lastName": "Hassan",
  "age": 32,
  "gender": "female",
  "emergencyContactNumber": "01023456789",
  "reasonForSeeingDoctor": "Regular check-up",
  "drugAllergies": "Penicillin",
  "illnesses": ["Diabetes", "Asthma"],
  "currentMedications": "Metformin, Ventolin",
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

### Change Password
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

## Test Coverage

✅ Status codes (200, 201, 400, 403, 404, 500)  
✅ Response structure validation  
✅ Environment variable auto-save  
✅ Contact verification flow  
✅ File upload handling  
✅ Medical history merge vs replace  
✅ Account security features  

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `token` is set and valid |
| 403 Forbidden | Verify user has "patient" role |
| Code expired | Request new code (10 min expiration) |
| Code not received | Check response body (non-prod) or email/SMS (prod) |
| Invalid code | Ensure 6 digits, no spaces |

## Files

- `Patient_API_Collection.json` - Main collection
- `Patient_API_README.md` - Full documentation
- `Patient_API_MANUAL_TEST_FLOW.md` - Detailed test steps

