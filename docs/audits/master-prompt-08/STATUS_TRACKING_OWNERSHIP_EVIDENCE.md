# STATUS TRACKING OWNERSHIP EVIDENCE — MASTER PROMPT 08
**i2A SchoolOS | Phase 08 — Status Tracking Security Audit & Evidence Dossier**
**Date:** 2026-10-20  
**Status:** **CLOSED & VERIFIED**

---

## 1. Threat Model & Vulnerability Analysis

In public SaaS onboarding flows, allowing applicants to check registration status introduces significant privacy and enumeration risks:
1. **Email Enumeration / Scraping:** If checking status requires only the applicant's email address or an application reference number, malicious third parties can brute-force application numbers and harvest school names, contact phone numbers, administrator identities, and internal review statuses.
2. **Internal Data Leakage:** Status responses often inadvertently leak internal compliance notes, reviewer user IDs, background verification checklists, or future tenant database keys (`tenantId`).
3. **Timing Side-Channel Attacks:** String comparison (`token === storedToken`) leaks byte-by-byte timing data, allowing attackers to incrementally guess valid tokens.

---

## 2. Hardened Security Implementation

### A. Mandatory Cryptographic Tracking Secret
Upon successful application submission via `POST /api/tenants/applications`:
- A 256-bit cryptographically secure random token is generated: `crypto.randomBytes(32).toString('hex')`.
- The token is hashed with SHA-256 (`crypto.createHash('sha256').update(rawTrackingToken).digest('hex')`) and persisted in `school_applications.trackingTokenHash`.
- Plaintext tracking tokens are **NEVER** stored in the database.
- A 30-day expiration TTL (`trackingTokenExpiresAt`) and revocation flag (`trackingTokenRevoked: false`) are initialized.
- The raw tracking token is returned to the applicant exactly once in the submission response.

### B. Ownership Verification Helper (`verifyApplicationTrackingAuth`)
Source: [`server/routes/tenants.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/tenants.js#L215-L290)
1. **Super Admin Bypass:** If the caller presents a valid Bearer JWT with `role === 'SUPER_ADMIN'`, platform review access is authorized.
2. **Missing Token Guard:** Inquiries without a tracking token (including requests providing only an applicant email) are rejected with **HTTP 401 `TRACKING_TOKEN_REQUIRED`**.
3. **Revocation Check:** Applications where `trackingTokenRevoked === true` are rejected with **HTTP 403 `TRACKING_TOKEN_REVOKED`**.
4. **Expiration Check:** Applications where `new Date(trackingTokenExpiresAt) < new Date()` are rejected with **HTTP 403 `TRACKING_TOKEN_EXPIRED`**.
5. **Constant-Time Comparison:** Input token hash is compared with `trackingTokenHash` using `crypto.timingSafeEqual`:
   ```javascript
   const inputHash = crypto.createHash('sha256').update(String(trackingToken).trim()).digest('hex');
   let isTokenMatch = false;
   if (app.trackingTokenHash && app.trackingTokenHash.length === inputHash.length) {
     isTokenMatch = crypto.timingSafeEqual(
       Buffer.from(app.trackingTokenHash, 'hex'),
       Buffer.from(inputHash, 'hex')
     );
   }
   if (!isTokenMatch) {
     return { authorized: false, status: 403, error: 'The provided tracking token is invalid for this application.', code: 'INVALID_TRACKING_TOKEN' };
   }
   ```
6. **Secondary Email Constraint:** If `x-applicant-email` is additionally supplied by the caller, it must strictly match `app.adminEmail`. If mismatched, returns **HTTP 403 `EMAIL_MISMATCH`**.

### C. Token Rotation & Revocation Endpoints
- **Token Rotation (`POST /api/tenants/applications/:appId/rotate-tracking-token`):**
  - Authenticated via existing valid tracking token or Super Admin session.
  - Generates new 32-byte tracking token, updates SHA-256 hash, refreshes 30-day TTL, sets `trackingTokenRevoked: false`.
  - Old token is immediately invalidated.
  - Logs immutable audit event `APPLICATION_TRACKING_TOKEN_ROTATED`.
- **Token Revocation (`POST /api/tenants/applications/:appId/revoke-tracking-token`):**
  - Authenticated via existing valid tracking token or Super Admin session.
  - Updates document with `trackingTokenRevoked: true` and `trackingTokenRevokedAt`.
  - Subsequent tracking requests return HTTP 403 `TRACKING_TOKEN_REVOKED`.
  - Logs immutable audit event `APPLICATION_TRACKING_TOKEN_REVOKED`.

### D. Brute-Force Rate Limiting Engine
- Dual-tier tracking rate limiter: in-memory fast-path Map (`failedTrackingAttempts`) backed by MongoDB collection `tracking_attempts`.
- Keyed by `track:${applicationNo}:${clientIp}`.
- Maximum 5 failed attempts allowed within any rolling window.
- Upon 5 failed attempts, access is locked for 15 minutes (900 seconds) returning **HTTP 429 `TRACKING_RATE_LIMITED`**.
- Successful verification clears the failure counter.

### E. Safe Public Data Projection
The response payload from `GET /api/tenants/applications/status/:applicationNo` projects strictly public fields:
```json
{
  "success": true,
  "application": {
    "applicationNo": "APP-2026-XXXX",
    "schoolName": "Sample Public School",
    "category": "k12-schools",
    "board": "CBSE",
    "city": "Patna",
    "state": "Bihar",
    "status": "UNDER_REVIEW",
    "submittedDate": "2026-10-20T...",
    "reviewedAt": "2026-10-20T...",
    "correctionNotes": "...",
    "rejectionReason": "...",
    "approvedAt": "..."
  }
}
```
**Strictly Omitted:**
- `tenantId` (zero platform container IDs leaked prior to authenticated user login).
- `reviewerId`, `reviewerName`, `reviewNotes`.
- `verificationChecklist`.
- Plaintext passwords, tokens, or security questions.

---

## 3. Adversarial Test Evidence

The following tests in [`src/__tests__/InstitutionRegistrationAndVerification.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/InstitutionRegistrationAndVerification.test.ts) verify all aspects of tracking security:

1. **Test 10 (Public Status Tracking):**
   - Unauthenticated request -> HTTP 401 `TRACKING_TOKEN_REQUIRED`.
   - Email alone -> HTTP 401 `TRACKING_TOKEN_REQUIRED`.
   - Invalid token -> HTTP 403 `INVALID_TRACKING_TOKEN`.
   - Token + wrong email -> HTTP 403 `EMAIL_MISMATCH`.
   - Valid token -> HTTP 200, status returned, zero `reviewerId`, zero `tenantId`.
2. **Test 28 (Tracking Token Expiration):**
   - Setting `trackingTokenExpiresAt` to past timestamp -> HTTP 403 `TRACKING_TOKEN_EXPIRED`.
3. **Test 29 (Tracking Token Revocation):**
   - Explicit revocation call -> HTTP 200. Subsequent status inquiries -> HTTP 403 `TRACKING_TOKEN_REVOKED`.
4. **Test 30 (Tracking Token Rotation):**
   - Call rotation endpoint -> returns new token. Inquiry with old token -> HTTP 403 `INVALID_TRACKING_TOKEN`. Inquiry with new token -> HTTP 200.
5. **Test 31 (Rate Limiting Lockout):**
   - 5 failed attempts -> 6th attempt returns HTTP 429 `TRACKING_RATE_LIMITED`.
6. **Test 32 (Cross-Application Boundary):**
   - Application A's token queried against Application B -> HTTP 403 `INVALID_TRACKING_TOKEN`.

**All tests executed and verified with 100% pass rate.**
