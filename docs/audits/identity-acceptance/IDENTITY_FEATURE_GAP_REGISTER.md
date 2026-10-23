# i2A SchoolOS — Identity & Credential Feature Gap Register

**Audit Date:** 2026-10-22  
**Tracking Context:** User Lifecycle, Credential Provisioning, Authorization Boundaries & Email Delivery  

---

## 1. Remediation Status Summary

| Gap ID | Description | Severity | Root Cause | Remediation Applied | Final Status |
|---|---|---|---|---|---|
| `ID-GAP-001` | Plaintext / Predictable Default Passwords | **CRITICAL** | Previous designs relied on default role passwords (e.g. `Student@2026`). | Replaced with cryptographic 32-byte single-use invitation tokens (`rawInvitationToken`). Zero default passwords stored in DB. | **CLOSED** |
| `ID-GAP-002` | Plaintext Invitation Token Storage | **HIGH** | Legacy models stored raw invitation tokens in MongoDB. | Hashed with SHA-256 (`invitationTokenHash`) with 7-day expiration. Token atomically unset on activation. | **CLOSED** |
| `ID-GAP-003` | Missing Authenticated Password Change Route | **MEDIUM** | No API endpoint existed for users to change passwords from their profile. | Implemented `POST /api/auth/change-password` with current password check, complexity regex, and active token revocation. | **CLOSED** |
| `ID-GAP-004` | Missing User Invitation & Resend Endpoints | **MEDIUM** | Administrators had no formal API to invite students/parents/staff. | Implemented `POST /api/auth/invite-user`, `/resend-invitation`, and `/revoke-invitation` with audit logging. | **CLOSED** |
| `ID-GAP-005` | Teacher Class Snooping Vulnerability | **HIGH** | Teacher query for unassigned classes did not clamp filter to empty set. | Updated `server/routes/students.js` to enforce `filter.className = { $in: [] }` when querying classes outside `assignedClasses`. | **CLOSED** |
| `ID-GAP-006` | Live Gmail SMTP Delivery | **LOW (STAGING)** | Real Gmail delivery requires live Google App Password / SMTP credentials. | Implemented `server/services/emailService.js` with explicit test sink fallback and `isSimulated: true` tags. | **EXTERNAL_STAGING_DEPENDENCY** |
| `ID-GAP-007` | DLT-Approved SMS OTP Dispatch | **LOW (STAGING)** | Indian telecom regulation requires TRAI DLT approved sender IDs and templates. | In-app notification hub and email OTP fully operational. Live SMS deferred to production gateway provisioning. | **EXTERNAL_STAGING_DEPENDENCY** |

---

## 2. Risk Evaluation & Release Impact

All critical and high severity identity gaps have been remediated, verified with reproducible regression tests, and certified clean:
- **Zero Insecure Passwords:** No accounts possess default or guessable credentials.
- **Zero Token Replay:** Single-use tokens cannot be re-executed.
- **Zero Cross-Tenant Leakage:** Data isolation is enforced at both database and middleware layers.

The remaining two items (`ID-GAP-006` and `ID-GAP-007`) are vendor credential provisioning items that do not block private staging pilot deployment.
