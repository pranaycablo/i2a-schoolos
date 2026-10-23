# i2A SchoolOS — Master Prompt 06
## Authentication & Session Security Specification & Audit

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Security Domain:** Cryptography, Session Invalidation & Brute-Force Defense  

---

### 1. Password Security & Cryptographic Hashing

All credentials stored in the i2A SchoolOS database are cryptographically salted and hashed using `bcryptjs` with 10 salt rounds:
- **Hash Algorithm**: Blowfish-based adaptive key derivation (`bcrypt`).
- **Salt Generation**: Cryptographically secure pseudo-random salt generated per password via `bcrypt.genSalt(10)`.
- **Database Schema**: Passwords are saved under the `passwordHash` field; no plain-text password field exists in user documents.
- **Verification**: Evaluated using constant-time comparison via `bcrypt.compare(plain, hashed)` to mitigate timing attacks.

---

### 2. JWT Session Token Architecture

Authentication tokens conform to standard RFC 7519 JSON Web Tokens:
- **Signature Algorithm**: HMAC-SHA256 (`HS256`).
- **Secret Management**:
  - In development/testing, falls back to local dev secret.
  - In production (`process.env.NODE_ENV === 'production'`), fails closed with `CRITICAL_CONFIG_ERROR` if `process.env.JWT_SECRET` is not explicitly set in the operating system environment.
- **Token Claims**:
  ```json
  {
    "id": "usr-002",
    "email": "principal@abcpublicschool.edu.in",
    "role": "PRINCIPAL",
    "schoolId": "I2A-SCH-000001",
    "iss": "i2a_schoolos",
    "aud": "i2a_schoolos_api",
    "iat": 1792324173,
    "exp": 1792410573
  }
  ```
- **Lifecycle & Expiry**: Standard duration is 24 hours (`JWT_EXPIRES_IN`). Expired tokens are immediately rejected with HTTP 401 `TOKEN_EXPIRED`.

---

### 3. Dual-Layer Token Revocation Engine (Hashed & Persistent)

To solve the stateless JWT invalidation challenge without storing raw bearer tokens in persistent databases or server logs, i2A SchoolOS implements a dual-layer revocation blacklist:

```
  Client Request
       │
       ▼
 [ Authorization: Bearer <Token> ]
       │
       ▼
  SHA-256 Hash Engine ──────► Token Hash (Hex)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
 Layer 1: In-Memory Fast Cache     Layer 2: MongoDB 'revoked_tokens'
 (Sub-millisecond lookup)          (Multi-process & Cluster Safe)
       │                                 │
       └──────────────┬──────────────────┘
                      ▼
           Is Hash in Blacklist?
             ├── YES ──► Reject 401 TOKEN_REVOKED
             └── NO  ──► Proceed to Cryptographic Verification
```

- **Zero Secret Ingestion**: The raw token is hashed using `crypto.createHash('sha256').update(token).digest('hex')`. Only the hex digest is recorded.
- **Multi-Instance Durability**: Survives process restarts and propagates across multiple Node.js worker threads.
- **Automatic Cleanup**: TTL index ensures expired tokens are purged after 24 hours.

---

### 4. Brute-Force Throttling & Account Lockout

To protect institutional portals against credential stuffing and brute-force attacks:
- **Maximum Consecutive Failures**: 5 failed login attempts.
- **Lockout Duration**: 15 minutes (`900,000 ms`).
- **Storage**: Backed by MongoDB `login_attempts` collection with in-memory short-cache for low latency.
- **Behavior**:
  - Failed password attempts increment the counter and log an audit event `FAILED_LOGIN_ATTEMPT`.
  - Upon reaching attempt 5, `lockedUntil` timestamp is set and HTTP 403 `ACCOUNT_LOCKED` with `remainingSec` is returned.
  - Successful authentication clears the attempt record via `clearFailedLogins(identifier)`.

---

### 5. Verified Password Reset Lifecycle (OTP & Single-Use Tokens)

```
 Step 1: POST /api/auth/forgot-password
   │
   ├─► Cryptographically secure 6-digit numeric OTP (crypto.randomInt(100000, 999999))
   ├─► Hashed with SHA-256 and stored in 'password_resets' (10-minute expiry)
   ├─► Rate limit: 1 OTP request per 60 seconds per email
   └─► Generic response to prevent account enumeration
   │
 Step 2: POST /api/auth/verify-otp
   │
   ├─► Compares SHA-256 hash of submitted OTP (max 3 verification attempts)
   └─► Issues 32-byte cryptographically secure single-use resetToken (valid 15 mins)
   │
 Step 3: POST /api/auth/reset-password
   │
   ├─► Validates single-use resetToken and min password length (8 chars)
   ├─► Salts and hashes new password with bcryptjs
   ├─► Deletes reset record from 'password_resets'
   └─► Logs audit event PASSWORD_RESET_SUCCESSFUL
```

---

### 6. Adversarial Verification Matrix

| Security Vector | Implementation Mechanism | Test Vector | Status |
| :--- | :--- | :--- | :--- |
| **Missing Token** | Bearer header parser | Scenario 01 | **PASS_VERIFIED** |
| **Tampered / Forged Token** | Cryptographic verification | Scenario 02 | **PASS_VERIFIED** |
| **Expired Token** | JWT `exp` validation | Scenario 03 | **PASS_VERIFIED** |
| **Immediate Logout Invalidation** | `POST /api/auth/logout` blacklist | Scenario 04 | **PASS_VERIFIED** |
| **Cluster Restart Invalidation** | MongoDB `revoked_tokens` store | Scenario 05 | **PASS_VERIFIED** |
| **Account Lockout Throttling** | `isAccountLocked` check | Scenario 21 | **PASS_VERIFIED** |
| **NoSQL Injection in Auth** | Input primitive validator | Scenario 22 | **PASS_VERIFIED** |
