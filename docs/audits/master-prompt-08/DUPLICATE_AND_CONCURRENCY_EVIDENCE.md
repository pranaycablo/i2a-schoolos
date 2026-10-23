# Duplicate & Concurrency Evidence Report
**i2A SchoolOS | Phase 08 — Institution Onboarding Security & Compliance**
*Document Version:* 1.0.0  
*Audit Scope:* Concurrency Burst Test, MongoDB Partial Unique Index, Rate Limiting, and Legitimate Resubmission

---

## 1. Multi-Tier Duplicate Prevention Architecture

To prevent duplicate tenant applications, race conditions, spam bursts, and denial-of-service attempts, i2A SchoolOS implements a 3-tier defense-in-depth model:

```mermaid
flowchart TD
    Req[Incoming Public Registration Request] --> L1[Layer 1: Pre-Query Cooldown Check (10-min active window)]
    L1 -->|Found active app in window| R429[HTTP 429: DUPLICATE_APPLICATION_THROTTLED]
    L1 -->|No active app| L2[Layer 2: Database Partial Unique Index on adminEmail]
    L2 -->|Concurrent Insert Race| M11000[MongoDB E11000 Duplicate Key Catch]
    M11000 --> R429
    L2 -->|Insert Success| R201[HTTP 201: Application Created]
    R201 --> L3[Layer 3: Idempotent Approval Engine (Zero Duplicate Tenants)]
```

### Layer 1: Application-Level 10-Minute Cooldown Guard
Before attempting database insertion, the server checks for an existing active application from the same normalized email:
```javascript
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const existingRecentApp = await database.collection('school_applications').findOne({
  adminEmail: normalizedEmail,
  status: { $in: ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'NEEDS_CORRECTION'] },
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

### Layer 2: MongoDB Database Partial Unique Index
To guard against millisecond race conditions where two identical requests arrive simultaneously before either completes the find check:
- **Collection:** `school_applications`
- **Keys:** `{ adminEmail: 1 }`
- **Options:** `{ unique: true, partialFilterExpression: { status: 'PENDING_VERIFICATION' } }`
- **Behavior:** The unique constraint is enforced **only** while the status is `PENDING_VERIFICATION`. Applications in terminal states (`APPROVED`, `REJECTED`, `CANCELLED`) do NOT occupy unique index slots.

### Layer 3: Atomic Duplicate Key Catch (Code 11000)
If concurrent threads race past Layer 1, MongoDB's unique index catches the second write atomically with `MongoServerError: E11000`. The catch block gracefully intercepts the collision and returns HTTP 429 with the winning application's reference number, preventing unhandled 500 crashes.

---

## 2. Concurrency Burst Verification Evidence

### Adversarial Test: 25 Simultaneous Submissions
- **Test File:** `src/__tests__/InstitutionRegistrationAndVerification.test.ts` (Test 9)
- **Vector:** 25 concurrent asynchronous `fetch()` requests launched simultaneously via `Promise.all` targeting the same applicant email address.
- **Result Metrics:**
  - Total requests: 25
  - HTTP 201 (Created): **Exactly 1**
  - HTTP 429 (Throttled/Duplicate): **24**
  - Unhandled 500 Errors: **0**
- **Test Execution Status:** `PASS (87ms)`

```
✓ 9. Concurrency & Rate Limiting — 25 burst submissions for the same email: exactly 1 accepted, remainder throttled/cooldown 87ms
```

---

## 3. Legitimate Re-Application Proof

A major defect in legacy onboarding implementations was permanently banning an email address if an earlier application was rejected or cancelled.

i2A SchoolOS verifies that:
1. When Applicant A submits an application that is rejected (`REJECTED`) or voluntarily retracted (`CANCELLED`):
2. The partial unique index condition `{ status: 'PENDING_VERIFICATION' }` no longer matches the old document.
3. The cooldown filter `{ status: { $in: ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'NEEDS_CORRECTION'] } }` does not match the old document.
4. Applicant A is able to submit a brand new, corrected application with fresh documentation and receives HTTP 201 Created with a distinct application ID.

### Test Execution Proof (Test 18):
```
✓ 18. Re-application Allowed — An email with a REJECTED or CANCELLED application can submit a new inquiry 21ms
```
- First application created $\to$ Rejected by Super Admin $\to$ Status is `REJECTED`.
- Second application submitted by identical email $\to$ HTTP 201 Created.
- Two distinct records persist cleanly without constraint violation.
