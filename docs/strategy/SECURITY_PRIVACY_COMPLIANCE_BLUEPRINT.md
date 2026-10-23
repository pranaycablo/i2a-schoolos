# Security, Privacy & Regulatory Compliance Blueprint
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-014 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Threat Modeling & OWASP Top 10 Multi-Tenant Defense

i2A SchoolOS implements defense-in-depth protections aligned with the **OWASP Top 10** and **OWASP Multi-Tenant Cloud Architecture Security Guidelines**:

| Threat Vector | Potential Vulnerability | i2A SchoolOS Architectural Defense |
| :--- | :--- | :--- |
| **A01: Broken Access Control (IDOR)** | Cross-tenant data leaks or parents accessing unrelated student records. | Server-side `enforceTenant` middleware validates `req.user.schoolId`. Object-level validation enforces `ParentStudentLink` check before returning student data. |
| **A02: Cryptographic Failures** | Storing cleartext passwords or transmitting unsigned payment payloads. | `bcryptjs` hashing (salt rounds = 10). Payment webhooks enforce constant-time SHA256 HMAC verification. Mandatory TLS 1.3 in transit. |
| **A03: Injection (NoSQL / SQL / XSS)** | Malicious payload in search fields or student admission forms. | Native parameter binding in MongoDB queries (`$eq` operators). React 19 automatic XSS escaping. Strict input sanitization. |
| **A04: Insecure Design** | Role spoofing via frontend dropdown menus. | Eliminated in Phase A. Changing role triggers full server-authenticated JWT re-login. Role dropdown without credentials is physically rejected. |
| **A05: Security Misconfiguration** | Exposing default API keys or open CORS policies. | Environment variables for all secrets (`.env`). CORS origin whitelist restricted to verified institution domains. |
| **A06: Vulnerable Dependencies** | Outdated or compromised npm packages. | Routine vulnerability scanning via `npm audit` and lockfile integrity pinning (`package-lock.json`). |
| **A07: Identification Failures** | Brute-forcing OTPs or replay of password reset tokens. | 6-digit OTP rate-limited to 3 attempts per 15 min. OTP expires in 10 min. Password reset token is cryptographically random and strictly single-use. |
| **A08: Software & Data Integrity** | Tampered payment confirmations or forged discounts. | Client cannot declare payment success; only verified webhooks mark payments `PAID`. 40% commercial discount cap enforced server-side. |
| **A09: Security Logging & Monitoring** | Undetected administrative privilege abuse. | Dedicated append-only `audit_logs` collection logging all mutations with user ID, role, IP address, timestamp, and action diff. |
| **A10: Server-Side Request Forgery** | Exploiting document upload or URL previews to probe internal network. | Pre-signed upload URLs to cloud storage; zero server-side fetches of unverified remote URLs. |

---

## 2. Regulatory Compliance Frameworks

### 2.1 India Digital Personal Data Protection (DPDP) Act, 2023
As an educational platform processing data of minor children, i2A SchoolOS adheres to statutory mandates under India’s DPDP Act:
1. **Verifiable Parental Consent (Section 9):**
   - Processing of personal data of individuals under 18 years of age requires verifiable consent from their parent or legal guardian.
   - The online admission portal captures digital guardian verification and explicit consent timestamps.
2. **Prohibition of Detrimental Processing:**
   - The platform strictly forbids any processing of children's data that is likely to cause harm or adverse behavioral impact.
   - Targeted advertising, behavioral tracking, and commercial profiling of students are physically blocked in the codebase.
3. **Right to Correction & Erasure:**
   - Parents retain the legal right to request correction of inaccurate student records or erasure of personal information upon formal withdrawal from the school (subject to statutory academic record retention requirements).

### 2.2 Global Privacy Regulations (GDPR & FERPA Readiness)
- **GDPR (European Union):** Granular consent checkboxes, right to data portability (JSON/CSV export), and data minimization in AI processing.
- **FERPA (United States):** Educational records privacy protection, restricting student transcript access strictly to designated school officials and verified parents.

---

## 3. Secure File Upload & Storage Policy

1. **MIME-Type & Extension Whitelisting:**
   - Permitted document formats: `application/pdf`, `image/jpeg`, `image/png`.
   - Executable formats (`.exe`, `.bat`, `.js`, `.sh`, `.php`, `.py`) are immediately rejected at the API gateway.
2. **File Size Constraints:**
   - Profile photos: Max 2 MB.
   - Student academic documents (Birth Cert, Report Card): Max 5 MB.
   - Video files: Max 500 MB (routed directly to video streaming storage).
3. **Zero Public Directory Traversal:**
   - Uploaded documents are stored in private cloud object buckets with obfuscated, random UUID keys (e.g. `doc_7f9a2b8e-4c12-4e89-a091-bf124e98f.pdf`).
   - Files are never stored under predictable URLs or user IDs, preventing web scraping or unauthorized enumeration.

---

## 4. Incident Response & Security Event Logging

1. **Automated Security Alerts:**
   - 5 consecutive failed login attempts on a single account triggers a 15-minute temporary lockout and an alert email to the registered address.
   - An attempted cross-tenant boundary breach triggers a high-severity `SECURITY_ALERT` entry in the system audit logs.
2. **Disaster Recovery & Backup Policy:**
   - Automated daily database snapshots persisted to geo-redundant storage with point-in-time recovery (PITR) capability.
   - Zero production passwords or financial API keys printed in application logs or research reports.
