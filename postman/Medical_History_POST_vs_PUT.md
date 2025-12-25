# Medical History: POST vs PUT - The Difference

## Overview

The medical history endpoints have two different operations that work differently:

- **POST** `/api/patients/me/medical-history` - **MERGE** (Add/Merge operation)
- **PUT** `/api/patients/me/medical-history` - **REPLACE** (Replace operation)

---

## POST (Merge) - Add Medical History

### Behavior: MERGE with existing data

**Endpoint**: `POST /api/patients/me/medical-history`

**How it works**:
- **Merges** new values with existing values
- Adds unique items to arrays (no duplicates)
- Combines existing arrays with incoming arrays
- Updates notes (replaces notes if provided)

### Example Scenarios

**Current State**:
```json
{
  "chronicDiseases": ["Hypertension"],
  "allergies": ["Penicillin"],
  "notes": "Old notes"
}
```

**Request**:
```json
{
  "chronicDiseases": ["Diabetes"],
  "allergies": ["Peanuts"],
  "notes": "New notes"
}
```

**Result After POST**:
```json
{
  "chronicDiseases": ["Hypertension", "Diabetes"],  // ← Merged (added Diabetes)
  "allergies": ["Penicillin", "Peanuts"],           // ← Merged (added Peanuts)
  "notes": "New notes"                               // ← Replaced
}
```

### Key Points:
- ✅ Arrays are **merged** - new items added to existing
- ✅ Duplicates are automatically removed (uses Set)
- ✅ Notes are **replaced** (not merged)
- ✅ Partial updates allowed (send only fields you want to add)

---

## PUT (Replace) - Replace Medical History

### Behavior: REPLACE entire fields

**Endpoint**: `PUT /api/patients/me/medical-history`

**How it works**:
- **Replaces** entire arrays/fields with new values
- Completely overwrites existing data for provided fields
- Only updates fields that are explicitly provided
- Allows clearing arrays by sending empty arrays `[]`

### Example Scenarios

**Current State**:
```json
{
  "chronicDiseases": ["Hypertension", "Diabetes"],
  "allergies": ["Penicillin", "Peanuts"],
  "notes": "Old notes"
}
```

**Request 1 - Replace All**:
```json
{
  "chronicDiseases": ["Asthma"],
  "allergies": ["Shellfish"],
  "notes": "Updated notes"
}
```

**Result After PUT**:
```json
{
  "chronicDiseases": ["Asthma"],      // ← Completely replaced
  "allergies": ["Shellfish"],         // ← Completely replaced
  "notes": "Updated notes"            // ← Replaced
}
```

**Request 2 - Clear Arrays**:
```json
{
  "chronicDiseases": [],              // ← Empty array clears it
  "allergies": []
}
```

**Result After PUT**:
```json
{
  "chronicDiseases": [],              // ← Cleared
  "allergies": [],                    // ← Cleared
  "notes": "Old notes"                // ← Unchanged (not provided)
}
```

**Request 3 - Partial Update (Only chronicDiseases)**:
```json
{
  "chronicDiseases": ["Heart Disease"]
}
```

**Result After PUT**:
```json
{
  "chronicDiseases": ["Heart Disease"], // ← Replaced
  "allergies": ["Penicillin", "Peanuts"], // ← Unchanged (not provided)
  "notes": "Old notes"                   // ← Unchanged (not provided)
}
```

### Key Points:
- ✅ Arrays are **completely replaced** (not merged)
- ✅ Only provided fields are updated
- ✅ Empty arrays `[]` will clear the field
- ✅ Allows partial updates (only send fields you want to replace)

---

## Comparison Table

| Feature | POST (Merge) | PUT (Replace) |
|---------|--------------|---------------|
| **Operation** | Add/Merge | Replace |
| **Array Behavior** | Merges with existing (adds items) | Replaces entire array |
| **Duplicates** | Automatically removed | Not applicable (replaces) |
| **Empty Arrays** | Adds nothing (merges empty array) | Clears the field |
| **Partial Updates** | ✅ Yes (only add specified fields) | ✅ Yes (only replace specified fields) |
| **Use Case** | Adding new medical history items | Updating or clearing medical history |

---

## When to Use Each

### Use POST (Merge) when:
- ✅ You want to **add** new diseases or allergies to existing ones
- ✅ You want to preserve existing medical history
- ✅ You're building up medical history over time
- ✅ You want to avoid duplicates automatically

**Example**:
```json
// Patient already has: ["Hypertension"]
// Add new: ["Diabetes"]
POST /api/patients/me/medical-history
{ "chronicDiseases": ["Diabetes"] }
// Result: ["Hypertension", "Diabetes"]
```

### Use PUT (Replace) when:
- ✅ You want to **update** or **correct** existing medical history
- ✅ You want to **clear** some fields (send empty arrays)
- ✅ You're doing a complete update of medical history
- ✅ You want full control over the exact values

**Example**:
```json
// Patient currently has: ["Hypertension", "Diabetes", "Old Disease"]
// Replace with: ["Hypertension", "Asthma"]
PUT /api/patients/me/medical-history
{ "chronicDiseases": ["Hypertension", "Asthma"] }
// Result: ["Hypertension", "Asthma"] (Old Disease removed)
```

---

## Code Implementation Difference

### POST (Merge) Implementation:
```javascript
// Merges arrays - adds new items to existing
const mergeUnique = (existing = [], incoming = []) => [
  ...new Set([...(existing || []), ...incoming]),
];

patient.medicalHistory.chronicDiseases = mergeUnique(
  patient.medicalHistory.chronicDiseases,
  chronicDiseases
);
```

### PUT (Replace) Implementation:
```javascript
// Replaces entire array if field is provided
if (Object.prototype.hasOwnProperty.call(historyData, "chronicDiseases")) {
  patient.medicalHistory.chronicDiseases = historyData.chronicDiseases || [];
}
```

---

## Testing Examples

### Test 1: POST Adds to Existing

**Before**:
```json
{ "chronicDiseases": ["A", "B"] }
```

**POST Request**:
```json
{ "chronicDiseases": ["C", "D"] }
```

**After**:
```json
{ "chronicDiseases": ["A", "B", "C", "D"] }
```

### Test 2: PUT Replaces Existing

**Before**:
```json
{ "chronicDiseases": ["A", "B"] }
```

**PUT Request**:
```json
{ "chronicDiseases": ["C", "D"] }
```

**After**:
```json
{ "chronicDiseases": ["C", "D"] }
```

### Test 3: PUT Clears Field

**Before**:
```json
{ "chronicDiseases": ["A", "B"] }
```

**PUT Request**:
```json
{ "chronicDiseases": [] }
```

**After**:
```json
{ "chronicDiseases": [] }
```

### Test 4: POST with Duplicates

**Before**:
```json
{ "chronicDiseases": ["A", "B"] }
```

**POST Request**:
```json
{ "chronicDiseases": ["B", "C"] }
```

**After**:
```json
{ "chronicDiseases": ["A", "B", "C"] }  // B not duplicated
```

---

## Notes

- Both endpoints use the same validation schema
- Both endpoints return the updated patient profile
- Notes field is **always replaced** (not merged) in both POST and PUT
- POST is idempotent for duplicates (won't create duplicates)
- PUT is idempotent (same request gives same result)

