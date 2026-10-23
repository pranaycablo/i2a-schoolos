# i2A SchoolOS — Institution Registration Security & Onboarding Evidence

**Audit Timestamp:** October 18, 2026  
**Auditor Roles:** Principal Security Architect, Identity & Access Management Specialist  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Onboarding Pipeline & Security Objectives

The trial onboarding route (`POST /api/tenants/applications`) allows educational institutions across India to register for a 14-day zero-risk trial. Because this endpoint is publicly exposed, it was engineered with defense-in-depth:
1. **Input Validation & Sanitization:** Regex validation for email and phone numbers; HTML tag stripping on all strings.
2. **Anti-Tampering & Whitelisting:** Complete discard of malicious client fields (e.g. self-assigning `APPROVED` status, administrative roles, or custom tenant IDs).
3. **Idempotency & Duplicate Throttling:** 10-minute window preventing double submissions and application flooding.
4. **Separation of Concerns:** A submitted application *never* creates an active tenant directly. An active tenant document is only provisioned after explicit review by a verified `SUPER_ADMIN`.

---

## 2. Field Whitelist & Sanitization Matrix

| Incoming Payload Field | Validation / Sanitization Rule | On Failure / Tamper Behavior |
|---|---|---|
| `schoolName` | Mandatory; HTML tags stripped (`/<[^>]*>/g`); trimmed | Rejects with HTTP 400 if empty. Tags stripped if present. |
| `adminEmail` | Mandatory; Regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Rejects with HTTP 400 `Invalid email address format`. |
| `adminPhone` | Mandatory; Regex `^[+]?[0-9\s\-()]{10,20}$` | Rejects with HTTP 400 `Invalid phone number format`. |
| `category` | Sanitized string; defaults to `k12-schools` | Fallback applied if omitted. |
| `board` | Enum whitelist: `['CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'UNIVERSITY', 'OTHER']` | Fallback to `'CBSE'` if invalid. |
| `status` (Injected) | **Ignored** | Hardcoded to `'PENDING_VERIFICATION'`. |
| `verified` (Injected) | **Ignored** | Hardcoded to `false`. |
| `role` (Injected) | **Ignored** | Omitted from document. |
| `id` (Injected) | **Ignored** | Server generates `APP-SCH-${Date.now()}` and registration number `REG-YYYY-XXXXXX`. |

---

## 3. Duplicate Rate Throttling Implementation (Vector 24)

### The Defect (Before Remediation):
Rapid consecutive button clicks or automated bot submissions could spawn multiple identical pending applications for the same email address, polluting the review queue and creating operational confusion.

### The Hard Fix Applied in `server/routes/tenants.js`:
```javascript
const database = await getDb();

// Prevent spam and double submissions: 10-minute cooldown on pending applications with same email
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const existingRecentApp = await database.collection('school_applications').findOne({
  adminEmail,
  status: 'PENDING_VERIFICATION',
  submittedDate: { $gte: tenMinutesAgo }
});

if (existingRecentApp) {
  return res.status(429).json({
    success: false,
    error: 'An application for this email address was recently submitted and is pending verification. Please wait before submitting again.',
    code: 'DUPLICATE_APPLICATION_THROTTLED',
    applicationNo: existingRecentApp.applicationNo
  });
}
```

### Empirical Test Vector 24 Result:
```bash
✓ Vector 24: Duplicate Registration Throttling: Rapid resubmission with same email within 10 minutes returns HTTP 429 (6ms)
```

---

## 4. Anti-Tamper & Authorization Test Matrix

| Test Vector | Adversarial Payload / Attack Technique | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|
| **Vector 16** | Missing `schoolName`, `adminEmail`, or `adminPhone` | HTTP 400 Bad Request with field hint | HTTP 400 Bad Request | **PASS** |
| **Vector 17** | Invalid email: `'invalid-email-format'` | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **Vector 18** | Malformed phone: `'123'` (under 10 digits) | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **Vector 19** | Tamper payload injecting `status: 'APPROVED'`, `verified: true`, `role: 'SUPER_ADMIN'`, `<script>alert("hack")</script>` in name | Injected fields neutralized; status locked to `PENDING_VERIFICATION`; verified = false; script tags stripped | Application created with locked `PENDING_VERIFICATION`, clean name, zero role injection | **PASS** |
| **Vector 20** | Audit event emission verification | `action: 'SCHOOL_APPLICATION_SUBMITTED'` written to `audit_logs` | Audit record verified in MongoDB with actor IP | **PASS** |
| **Vector 22** | Unauthenticated request to `/api/tenants/applications/queue` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |

The onboarding intake pipeline is airtight, resistant to privilege escalation, and spam-resilient.
