# i2A SchoolOS — Credential Lifecycle & Identity Security Audit

**Audit Scope:** Account Creation, Invitation Issuance, Activation, Password Complexity, Token Rotation, Recovery & Revocation  
**Assessment Date:** 2026-10-22  
**Database Verified:** `i2a_schoolos_synthetic_test`  

---

## 1. Credential Lifecycle Architecture

i2A SchoolOS replaces insecure default passwords (such as phone numbers, dates of birth, or hardcoded strings) with a zero-knowledge cryptographic invitation architecture:

```
[Administrator Creates User (Student / Parent / Staff)]
               │
               ▼
   Generate 32-Byte Crypto Random Token (rawInvitationToken)
               │
               ▼
   Compute SHA-256 Digest (invitationTokenHash)
               │
               ├─────────────────────────────────────────┐
               ▼                                         ▼
   Store in MongoDB 'users':                 Dispatch via Email Service:
   - invitationTokenHash                     - Clean Activation Link
   - invitationExpiresAt (+7 Days)           - Single-Use Raw Token
   - status: 'INVITED'                       (Zero token stored in cleartext!)
   - mustChangePassword: true
               │
               ▼
   [Recipient Clicks Link & Submits New Password]
               │
               ▼
   Verify: SHA256(submittedToken) === user.invitationTokenHash
   Verify: Date.now() < user.invitationExpiresAt
   Verify: !user.invitationRevoked && !user.invitationConsumedAt
   Verify: Password Complexity (8+ chars, Upper, Lower, Number, Special)
               │
               ▼
   Atomic Update:
   - passwordHash = bcrypt(newPassword, 10)
   - status = 'ACTIVE'
   - mustChangePassword = false
   - invitationConsumedAt = nowIso
   - $unset: { invitationTokenHash: '' }
               │
               ▼
   Issue Signed JWT Session Token
```

---

## 2. Audit Findings Across Lifecycle Stages

### Stage A: Account Provisioning & Invitation
- **Zero Plaintext Token Storage:** Inspected MongoDB `users` records directly. `user.invitationToken` is strictly `undefined`. Only `user.invitationTokenHash` exists.
- **Zero Default Passwords:** New accounts created via invitation possess no default password (`passwordHash: undefined`), guaranteeing that unactivated accounts cannot be compromised via credential stuffing.
- **Fail-Closed Unactivated Login:** Login attempts against an unactivated account return `HTTP 403 ACCOUNT_NOT_ACTIVATED`.

### Stage B: Single-Use Activation & Anti-Replay Defense
- **Atomic Token Consumption:** On password submission, the server sets `invitationConsumedAt` and unsets `invitationTokenHash`.
- **Replay Attack Verification:** Submitting an already consumed invitation token returns `HTTP 400 INVALID_INVITATION_TOKEN`. Replay attacks are 100% blocked.
- **Complexity Enforcement:** Passwords lacking uppercase, lowercase, digits, or symbols are rejected with `HTTP 400 PASSWORD_COMPLEXITY_FAILED`.

### Stage C: Password Recovery (Forgot Password & OTP)
- **Anti-Enumeration Protection:** Querying `/api/auth/forgot-password` with a non-existent email address returns a generic HTTP 200 response (*"If the email exists in our system, a 6-digit verification code has been dispatched"*). Zero user existence information is leaked.
- **Cryptographic 6-Digit OTP:** Generated using `crypto.randomInt(100000, 999999)`. Stored as a SHA-256 hash in `password_resets` collection with a 10-minute expiry.
- **Attempt Throttling:** Maximum 3 verification attempts. Exceeding 3 attempts purges the session.
- **Rate Limiting:** Enforces a minimum 60-second cooldown between OTP requests per email.
- **Single-Use Reset Token:** Valid OTP verification issues a 32-byte single-use `resetToken` valid for 15 minutes. Re-submitting a consumed reset token returns HTTP 400.

### Stage D: Invitation Rotation & Revocation
- **Token Rotation (`POST /api/auth/resend-invitation`):** Invalidates the previous token hash and generates a fresh 32-byte token with a renewed 7-day expiration.
- **Administrative Revocation (`POST /api/auth/revoke-invitation`):** Marks `invitationRevoked: true` and sets status to `REVOKED`. Any subsequent activation attempt is immediately blocked.

### Stage E: Authenticated Password Change
- **Endpoint:** `POST /api/auth/change-password`.
- **Current Password Validation:** Requires valid existing password before accepting changes.
- **Session Revocation:** Active session token is automatically revoked via `revokeToken` to terminate stale sessions on other devices.
- **Notification Alert:** Dispatches an immediate security alert email notifying the user of the password modification.

---

## 3. Verdict

The credential lifecycle conforms to OWASP ASVS Level 2 standards for identity management and credential generation.

**Credential Lifecycle Status:** `PASS`
