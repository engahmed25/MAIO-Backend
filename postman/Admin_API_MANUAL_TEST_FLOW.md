# Manual Test Flow - Admin API Collection

Step-by-step checklist to validate `/api/admin` endpoints with Postman. Requires the `Admin API Collection` and `Admin API Environment` (baseUrl, token).

## Prerequisites
- Backend server is running.
- Import `postman/Admin_API_Collection.json`.
- Import `postman/Admin_API_Environment.json` and select it.
- Set `baseUrl` (e.g., `http://localhost:9000`).
- Have at least one pending user (e.g., newly registered doctor) to test verification.

---

## Flow 1: Authenticate as Admin
1) **Register Admin (optional first-time setup)**  
   - Request: `POST /api/admin/register`  
   - Body: `{ "email": "admin1@example.com", "password": "Admin123", "firstName": "Super", "lastName": "Admin", "phoneNumber": "01012345678" }`  
   - Expect `201` and `success: true`.
2) **Login Admin**  
   - Request: `POST /api/admin/login`  
   - Body: `{ "email": "admin1@example.com", "password": "Admin123" }`  
   - Expect `200`, `success: true`.  
   - Tests will save `token` and `adminUserId` to the environment.

---

## Flow 2: Dashboard Snapshot
3) **Get Dashboard Metrics**  
   - Request: `GET /api/admin/dashboard/metrics`  
   - Expect `200` with `data.totals` (users, doctors, patients, admins, appointments) plus `verification` breakdown.

---

## Flow 3: User Discovery (Filters & Pagination)
4) **List Users**  
   - Request: `GET /api/admin/users?page=1&limit=10&role=doctor&status=approved&verificationStatus=approved&sortBy=lastLogin&sortOrder=desc&search=john`  
   - Expect `200`, `data` array, `pagination` object.  
   - Tests store the first `userId`.
5) **List Pending Users**  
   - Request: `GET /api/admin/users/pending?page=1&limit=5&role=doctor`  
   - Expect `200`; all returned users should have `status/verificationStatus` of `pending`.  
   - Tests store `pendingUserId` (used in the verification flow).
6) **Get User By ID**  
   - Request: `GET /api/admin/users/{{userId}}`  
   - Expect `200` with `profileCompletion` and one of the profile blocks populated (doctor/patient/admin).

---

## Flow 4: Contact & Profile Verification
7) **Approve Verification**  
   - Request: `PATCH /api/admin/users/{{userId}}/verification`  
   - Body: `{ "verificationStatus": "approved" }`  
   - Expect `200`, `verificationStatus: "approved"`, `verifiedAt`/`verifiedBy` populated.
8) **Reject Verification with Reason**  
   - Request: `PATCH /api/admin/users/{{pendingUserId}}/verification`  
   - Body: `{ "verificationStatus": "rejected", "rejectionReason": "Missing ID proof" }`  
   - Expect `200`, `verificationStatus: "rejected"`, `rejectionReason` echoed back.  
   - Re-run pending list to confirm the user drops out or shows rejection.

---

## Flow 5: Account Status Controls
9) **Update User Status**  
   - Request: `PATCH /api/admin/users/{{userId}}/status`  
   - Body examples: `{ "status": "active" }`, `{ "status": "suspended" }`  
   - Expect `200`, `data.status` reflects the change; suspended users should lose refresh tokens.
10) **Soft Delete User**  
    - Request: `DELETE /api/admin/users/{{userId}}`  
    - Expect `200`, `isDeleted: true`; subsequent logins for that user should fail.  
    - Re-run list with `includeDeleted=true` to audit the record.

---

## Quick Regression Checklist
- ✅ Auth: Admin login stores `token` and `adminUserId`.  
- ✅ Metrics: `/dashboard/metrics` returns totals + verification breakdown.  
- ✅ Listing: `/users` respects filters, search, sort, pagination; pagination tests pass.  
- ✅ Verification: Approve + reject flows set status/metadata and enforce rejection reason.  
- ✅ Status: Pending/active/suspended transitions work; suspended users cannot access protected routes.  
- ✅ Deletion: Soft delete marks `isDeleted` and status `suspended`.
