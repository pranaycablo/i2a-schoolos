# i2A SchoolOS — Final Identity Gap & Risk Register

**Audit Date:** 2026-10-22  
**Target:** Authentication, Identity Provisioning, Credential Lifecycle & Email Notification Subsystems

---

## 1. Risk Matrix Overview

| Risk ID | Category | Severity | Current Status | Mitigation / Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-ID-001** | External Email Delivery | Low / Informational | `Mitigated with Sink` | Live external Gmail SMTP credentials not provisioned in local dev `.env`. Fully supported via Nodemailer; ready for credentials injection in private staging. |
| **SEC-ID-002** | OTP Brute-Force Rate Limiting | Medium | `Guarded (In-Memory)` | 15-minute OTP lifespan + SHA-256 hash lookup implemented. For large-scale distributed production, recommend adding Redis-based IP & email rate-limiting middleware (`express-rate-limit`). |
| **SEC-ID-003** | Token Blocklist Persistence | Low | `Operational` | Active tokens are revoked on password change via MongoDB/memory tracking. Recommend Redis token blocklist with TTL matching JWT expiration when scaling horizontally. |
| **SEC-ID-004** | User Enumeration Defense | Low | `Closed` | `POST /api/auth/forgot-password` returns identical generic HTTP 200 responses regardless of whether the submitted email exists in the database. |
| **SEC-ID-005** | Cryptographic Token Entropy | Low | `Closed` | Invitation tokens use `crypto.randomBytes(32)` (256 bits of entropy), stored strictly as SHA-256 hashes. |
| **SEC-ID-006** | Plaintext Credential Exposure | High | `Closed` | Zero default passwords in database. Status `INVITED` strictly prohibits login attempts until self-activation and bcrypt hashing. |

---

## 2. In-Depth Analysis of Key Residual Risks

### Risk SEC-ID-001: External Staging SMTP Setup
- **Description:** Local development and automated tests run against `localEmailSink` to prevent unmocked external network calls and avoid leaking test data to public mail relays.
- **Residual Risk:** Until private staging credentials are provided in `.env`, end-to-end delivery through Google's inbound/outbound spam filters cannot be certified.
- **Remediation Plan:** Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, and `SMTP_PASS` in the private staging environment before school pilot onboarding.

### Risk SEC-ID-002: Distributed Rate Limiting on Forgot Password
- **Description:** A malicious actor could attempt to trigger excessive OTP emails to harass a specific mailbox.
- **Current Protection:** OTP generation replaces existing OTP with a single active hash, preventing multiple concurrent valid codes.
- **Future Enhancement:** Deploy a sliding window rate limiter (e.g. max 3 OTP requests per 10 minutes per IP/Email).

---

## 3. Post-Audit Closure Verification

All Phase 0 critical findings and subsequent identity lifecycle requirements have been resolved:
- No local mock fallback on auth failure (`SEC-UX-001` closed).
- Role switcher disabled for unauthorized users (`UX-SEC-002` closed).
- Verified fee receipt atomic collection (`FIN-FLOW-003` closed).
- Dashboard role guard correctly routes parents/students away from administrative consoles (`UX-ARCH-005` closed).
- Teacher class scoping strictly enforced (`server/routes/students.js` updated to verify `$in: assignedClasses`).
- Single-use invitation and recovery tokens prevent replay attacks.
