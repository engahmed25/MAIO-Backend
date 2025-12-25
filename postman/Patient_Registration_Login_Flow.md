# Patient Registration & Login Flow

Complete guide for registering and logging in as a patient.

## Overview

- **Registration Endpoint**: `POST /api/auth/register/patient`
- **Login Endpoint**: `POST /api/auth/login`
- **Registration Type**: `multipart/form-data` (includes file upload)
- **Login Type**: `application/json`

---

## Flow 1: Patient Registration

### Step 1: Prepare Registration Data

**Required Fields** (in form-data):
- `email` (string, valid email)
- `password` (string, min 6 characters)
- `firstName` (string, min 2, max 50 characters)
- `lastName` (string, min 2, max 50 characters)
- `age` (number, 0-150)
- `gender` (string: "male", "female", or "other")
- `emergencyContactNumber` (string, 10-15 digits)
- `reasonForSeeingDoctor` (string, min 10 characters)
- `currentMedications` (string, required - use "None" if none)
- `smoking` (string: "yes" or "no")
- `profilePicture` (file, required - image file)

**Optional Fields**:
- `drugAllergies` (string, can be empty)
- `illnesses` (array of strings, e.g., ["Diabetes", "Asthma"])
- `otherIllness` (string, can be empty)
- `operations` (string)

### Step 2: Make Registration Request

**Request Details**:
```http
POST {{baseUrl}}/api/auth/register/patient
Content-Type: multipart/form-data
```

**Form Data Example** (Postman):
```
email: patient@example.com
password: Patient123
firstName: Mariam
lastName: Hassan
age: 32
gender: female
emergencyContactNumber: 01023456789
reasonForSeeingDoctor: Regular check-up and follow-up on previous test results
drugAllergies: Penicillin
illnesses: ["Diabetes", "Asthma"]
otherIllness: 
operations: Appendectomy in 2018
currentMedications: Metformin, Ventolin inhaler
smoking: no
profilePicture: [SELECT IMAGE FILE]
```

**cURL Example**:
```bash
curl -X POST http://localhost:9000/api/auth/register/patient \
  -F "email=patient@example.com" \
  -F "password=Patient123" \
  -F "firstName=Mariam" \
  -F "lastName=Hassan" \
  -F "age=32" \
  -F "gender=female" \
  -F "emergencyContactNumber=01023456789" \
  -F "reasonForSeeingDoctor=Regular check-up and follow-up on previous test results" \
  -F "drugAllergies=Penicillin" \
  -F "illnesses=[\"Diabetes\", \"Asthma\"]" \
  -F "currentMedications=Metformin, Ventolin inhaler" \
  -F "smoking=no" \
  -F "profilePicture=@/path/to/image.jpg"
```

### Step 3: Handle Registration Response

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Patient registration successful",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "patient@example.com",
    "role": "patient",
    "status": "approved",
    "profilePicture": "uploads/profilePicture/profilePicture-1234567890-123456789.jpg"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400/500)**:
```json
{
  "success": false,
  "message": "Registration failed",
  "error": "Email already exists" // or validation error
}
```

### Step 4: Save Tokens

After successful registration:
1. **Save `accessToken`** to your environment variable `token` (for authenticated requests)
2. **Save `refreshToken`** for token refresh (optional, stored in database)
3. **Save `userId`** if needed for other requests

**Postman Auto-Save Script** (add to Tests tab):
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
    pm.environment.set("patientId", jsonData.data.userId);
}
```

---

## Flow 2: Patient Login

### Step 1: Prepare Login Data

**Required Fields**:
- `email` (string, valid email)
- `password` (string)

### Step 2: Make Login Request

**Request Details**:
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "patient@example.com",
  "password": "Patient123"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Patient123"
  }'
```

### Step 3: Handle Login Response

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "patient@example.com",
    "role": "patient",
    "status": "approved",
    "profilePicture": "uploads/profilePicture/profilePicture-1234567890-123456789.jpg"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:

**Invalid Credentials (401)**:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Account Disabled/Deleted (401)**:
```json
{
  "success": false,
  "message": "Account is disabled or deleted"
}
```

### Step 4: Save Tokens

After successful login:
1. **Save `accessToken`** to your environment variable `token`
2. **Save `refreshToken`** for token refresh (optional)
3. **Save `userId`** if needed

**Postman Auto-Save Script**:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
    pm.environment.set("patientId", jsonData.data.userId);
}
```

---

## Complete Flow Example (Postman)

### Registration Request Setup

1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/api/auth/register/patient`
3. **Body Tab**: Select `form-data`
4. **Add Fields**:
   - All text fields as `Text` type
   - `profilePicture` as `File` type
   - `illnesses` as `Text` type with JSON array: `["Diabetes", "Asthma"]`
5. **Tests Tab**: Add auto-save script for tokens

### Login Request Setup

1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/api/auth/login`
3. **Body Tab**: Select `raw` → `JSON`
4. **Body**:
   ```json
   {
     "email": "{{patientEmail}}",
     "password": "{{patientPassword}}"
   }
   ```
5. **Tests Tab**: Add auto-save script for tokens

---

## Field Validation Rules

### Required Fields

| Field | Type | Validation |
|-------|------|------------|
| `email` | string | Valid email format |
| `password` | string | Minimum 6 characters |
| `firstName` | string | 2-50 characters |
| `lastName` | string | 2-50 characters |
| `age` | number | 0-150 |
| `gender` | string | "male", "female", or "other" |
| `emergencyContactNumber` | string | 10-15 digits only |
| `reasonForSeeingDoctor` | string | Minimum 10 characters |
| `currentMedications` | string | Required (use "None" if none) |
| `smoking` | string | "yes" or "no" |
| `profilePicture` | file | Image file (required) |

### Optional Fields

| Field | Type | Notes |
|-------|------|-------|
| `drugAllergies` | string | Can be empty string |
| `illnesses` | array | Array of strings, e.g., `["Diabetes", "Asthma"]` |
| `otherIllness` | string | Can be empty string |
| `operations` | string | Can be omitted |

---

## Common Issues & Solutions

### Registration Issues

1. **"Email already exists"**
   - Solution: Use a different email address

2. **"profilePicture is required"**
   - Solution: Ensure you're using `form-data` and file field is named `profilePicture`

3. **Validation Errors**
   - Check field lengths and formats
   - Ensure `illnesses` is a valid JSON array if provided
   - Verify phone number is 10-15 digits

4. **"Please provide more details" (reasonForSeeingDoctor)**
   - Solution: Ensure reason is at least 10 characters

### Login Issues

1. **"Invalid email or password"**
   - Solution: Verify email and password are correct
   - Check for typos
   - Ensure account exists

2. **"Account is disabled or deleted"**
   - Solution: Account was soft-deleted or disabled
   - Contact admin to restore account

3. **401 Unauthorized**
   - Solution: Check token is valid and not expired
   - Re-login to get new tokens

---

## Postman Collection Setup

### Environment Variables

Create these variables in your Postman environment:

| Variable | Initial Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:9000` | API base URL |
| `token` | (empty) | Auto-saved from login/registration |
| `patientId` | (empty) | Auto-saved from login/registration |
| `patientEmail` | `patient@example.com` | For login requests |
| `patientPassword` | `Patient123` | For login requests |

### Test Scripts

**Registration Test Script**:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});

pm.test("Response has tokens", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('accessToken');
    pm.expect(jsonData).to.have.property('refreshToken');
});

// Auto-save tokens
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
    pm.environment.set("patientId", jsonData.data.userId);
}
```

**Login Test Script**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});

pm.test("Response has tokens", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('accessToken');
    pm.expect(jsonData).to.have.property('refreshToken');
});

pm.test("User role is patient", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.role).to.eql('patient');
});

// Auto-save tokens
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
    pm.environment.set("patientId", jsonData.data.userId);
}
```

---

## Quick Reference

### Registration Endpoint
```
POST /api/auth/register/patient
Content-Type: multipart/form-data
Body: form-data with fields + profilePicture file
Response: 201 with accessToken, refreshToken
```

### Login Endpoint
```
POST /api/auth/login
Content-Type: application/json
Body: { "email": "...", "password": "..." }
Response: 200 with accessToken, refreshToken
```

### Using Tokens
After registration/login, use the `accessToken` in subsequent requests:
```
Authorization: Bearer {{token}}
```

---

## Next Steps After Registration/Login

Once you have the `accessToken`, you can:

1. **Get Profile**: `GET /api/patients/me` (requires `token`)
2. **Update Profile**: `PATCH /api/patients/me` (requires `token`)
3. **Upload Medical Documents**: `POST /api/patients/me/medical-documents` (requires `token`)
4. **View Medical Records**: `GET /api/patients/me/medical-records` (requires `token`)

See `Patient_API_MANUAL_TEST_FLOW.md` for complete patient API testing guide.

---

## Notes

- **Registration**: Patients are automatically approved (`status: "approved"`) upon registration
- **Profile Picture**: Required during registration, can be updated later
- **Tokens**: `accessToken` is short-lived, `refreshToken` is long-lived (stored in database)
- **Security**: Passwords are hashed using bcrypt before storage
- **Welcome Email**: A welcome email is sent to the patient after successful registration

