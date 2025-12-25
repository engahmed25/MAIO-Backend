# Patient Authentication - Quick Reference

## Registration & Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT REGISTRATION                      │
└─────────────────────────────────────────────────────────────┘

POST /api/auth/register/patient
Content-Type: multipart/form-data

Required Fields:
  ✓ email
  ✓ password (min 6 chars)
  ✓ firstName, lastName
  ✓ age, gender
  ✓ emergencyContactNumber (10-15 digits)
  ✓ reasonForSeeingDoctor (min 10 chars)
  ✓ currentMedications
  ✓ smoking ("yes" or "no")
  ✓ profilePicture (file - REQUIRED)

Optional Fields:
  - drugAllergies
  - illnesses (array)
  - otherIllness
  - operations

Response (201):
  {
    "success": true,
    "accessToken": "...",
    "refreshToken": "...",
    "data": { "userId": "...", "email": "...", "role": "patient" }
  }

┌─────────────────────────────────────────────────────────────┐
│                      PATIENT LOGIN                           │
└─────────────────────────────────────────────────────────────┘

POST /api/auth/login
Content-Type: application/json

Body:
  {
    "email": "patient@example.com",
    "password": "Patient123"
  }

Response (200):
  {
    "success": true,
    "accessToken": "...",
    "refreshToken": "...",
    "data": { "userId": "...", "email": "...", "role": "patient" }
  }

┌─────────────────────────────────────────────────────────────┐
│                  USING THE TOKEN                              │
└─────────────────────────────────────────────────────────────┘

All authenticated requests:
  Authorization: Bearer {{token}}

Example:
  GET /api/patients/me
  Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Postman Setup

### 1. Registration Request

**Method**: `POST`  
**URL**: `{{baseUrl}}/api/auth/register/patient`  
**Body**: `form-data`

| Key | Type | Value |
|-----|------|-------|
| email | Text | patient@example.com |
| password | Text | Patient123 |
| firstName | Text | Mariam |
| lastName | Text | Hassan |
| age | Text | 32 |
| gender | Text | female |
| emergencyContactNumber | Text | 01023456789 |
| reasonForSeeingDoctor | Text | Regular check-up and follow-up |
| currentMedications | Text | Metformin, Ventolin |
| smoking | Text | no |
| illnesses | Text | ["Diabetes", "Asthma"] |
| profilePicture | File | [Select image] |

**Tests Tab**:
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
    pm.environment.set("patientId", jsonData.data.userId);
}
```

### 2. Login Request

**Method**: `POST`  
**URL**: `{{baseUrl}}/api/auth/login`  
**Body**: `raw` → `JSON`

```json
{
  "email": "patient@example.com",
  "password": "Patient123"
}
```

**Tests Tab**:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
    pm.environment.set("patientId", jsonData.data.userId);
}
```

## Field Requirements

### Required
- ✅ `email` - Valid email
- ✅ `password` - Min 6 characters
- ✅ `firstName` - 2-50 characters
- ✅ `lastName` - 2-50 characters
- ✅ `age` - 0-150
- ✅ `gender` - "male", "female", or "other"
- ✅ `emergencyContactNumber` - 10-15 digits
- ✅ `reasonForSeeingDoctor` - Min 10 characters
- ✅ `currentMedications` - Required (use "None" if none)
- ✅ `smoking` - "yes" or "no"
- ✅ `profilePicture` - Image file

### Optional
- `drugAllergies` - String (can be empty)
- `illnesses` - Array of strings
- `otherIllness` - String (can be empty)
- `operations` - String

## Common Errors

| Error | Solution |
|-------|----------|
| "Email already exists" | Use different email |
| "profilePicture is required" | Add file in form-data |
| "Invalid email or password" | Check credentials |
| "Account is disabled" | Contact admin |
| Validation errors | Check field formats/lengths |

## Next Steps

After registration/login:
1. ✅ Token is auto-saved to `{{token}}`
2. ✅ Use token in Authorization header
3. ✅ Test patient endpoints:
   - `GET /api/patients/me`
   - `PATCH /api/patients/me`
   - `POST /api/patients/me/medical-documents`

See `Patient_Registration_Login_Flow.md` for detailed guide.

