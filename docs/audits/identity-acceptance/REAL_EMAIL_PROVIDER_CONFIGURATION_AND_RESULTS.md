# i2A SchoolOS — Real Email Provider Configuration & Results

**Audit Date:** 2026-10-22  
**Component:** `server/services/emailService.js`  
**Current Staging Status:** `PASS_SIMULATED_SINK` | `NOT_VERIFIED_LIVE_GMAIL (EXTERNAL_STAGING_DEPENDENCY)`

---

## 1. Executive Status & Ground Truth

The email notification subsystem in `i2A SchoolOS` has been upgraded to a production-ready Nodemailer architecture supporting:
- Standard SMTP transports (Gmail, Amazon SES, SendGrid, Mailgun, Postmark)
- Anti-CRLF header injection sanitization
- RFC 5322 compliant recipient validation
- Exponential backoff retry logic (up to 3 attempts)
- Local development/testing simulated sink with full inspection APIs
- Branded responsive HTML & plain-text fallback templates

### Current Staging Environment Audit
An inspection of the workspace `.env` file reveals:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test
DB_NAME=i2a_schoolos_synthetic_test
JWT_SECRET=synthetic_test_jwt_secret_dev_32char_minimum_length_ok
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
RAZORPAY_WEBHOOK_SECRET=test_razorpay_webhook_secret_key_12345
```

> [!IMPORTANT]
> **No live external SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are configured in the current local environment.**
> Therefore, while the transport implementation, anti-injection mechanisms, and fallback pipelines are fully verified through automated integration tests and the local email sink, **live Gmail delivery is classified as `NOT_VERIFIED` due to missing external staging credentials.**

---

## 2. Implemented Architecture (`emailService.js`)

```
   +--------------------------------------------------------------+
   |                Application / Auth Controllers                |
   +--------------------------------------------------------------+
                                  |
                                  v
   +--------------------------------------------------------------+
   |                 server/services/emailService.js              |
   |                                                              |
   |  - RFC 5322 Recipient Validation                             |
   |  - Header Injection Defense (Strips \r, \n)                  |
   |  - Branded Responsive HTML Templates                         |
   +--------------------------------------------------------------+
                    /                            \
   (If SMTP_HOST & SMTP_USER configured)    (If credentials absent or NODE_ENV=test)
                  /                                \
                 v                                  v
   +---------------------------+       +--------------------------+
   |    Nodemailer Transport   |       |     localEmailSink       |
   |   - Gmail / SES / etc.    |       |  - In-memory array       |
   |   - SSL/TLS (465/587)     |       |  - getEmailsFor()        |
   |   - Retry logic (3x)      |       |  - inspectLatestEmail()  |
   +---------------------------+       +--------------------------+
                 |
                 v
      Recipient Mailbox
```

---

## 3. Supported Email Dispatches & Templates

The following email triggers are implemented and operational:
1. **User Invitation:** `sendUserInvitation({ to, name, role, schoolName, activationToken, expiresInDays })`
   - Role-specific greeting and onboarding instructions.
   - Secure activation URL with cryptographic token: `${baseUrl}/activate?token=${activationToken}`.
2. **Password Reset OTP:** `sendPasswordResetOtp({ to, name, otp, expiresInMinutes })`
   - High-contrast 6-digit OTP display box.
   - 15-minute expiration notice and phishing warning.
3. **Password Changed Alert:** `sendPasswordChangedAlert({ to, name, userAgent, ipAddress })`
   - Real-time timestamp, client device info, and immediate recovery instructions if unauthorized.
4. **General Notifications:** `sendEmail({ to, subject, html, text })`
   - Flexible transport for administrative notices, fee receipts, and attendance summaries.

---

## 4. How to Configure Live Gmail Delivery in Private Staging

To enable live delivery through Google Workspace / Gmail in private staging:

### Step 1: Generate a Google Workspace / Gmail App Password
1. Sign in to the designated outbound sending Google account (e.g., `noreply@schoolos.internal`).
2. Navigate to **Google Account Settings** → **Security** → **2-Step Verification**.
3. Under **App passwords**, create an entry named `i2A SchoolOS Staging`.
4. Copy the 16-character generated application password.

### Step 2: Set Environment Variables in `.env` (Private Staging Only)
```ini
# SMTP Configuration for Live Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@schoolos.internal
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="i2A SchoolOS" <noreply@schoolos.internal>

# Public Web Application Base URL (for activation links)
PUBLIC_APP_URL=https://staging.schoolos.internal
```

### Step 3: Verify Connection via Diagnostic Command
Run the built-in transport verification:
```powershell
node -e "const { verifySmtpConnection } = require('./server/services/emailService'); verifySmtpConnection().then(console.log);"
```
Expected output:
```json
{ "configured": true, "connected": true, "message": "SMTP server is ready to deliver messages" }
```

---

## 5. Security & Isolation Checklist

- [x] **Zero Credential Leakage:** No plain passwords or SMTP secrets committed to repository.
- [x] **Anti-CRLF Injection:** `sanitizeHeader()` prevents mail header splitting and Bcc hijack attacks.
- [x] **Safe Test Fallback:** Vitest and unit testing environments automatically redirect to `localEmailSink` without throwing unhandled network exceptions.
- [x] **Public URL Hardening:** Activation URLs dynamically utilize `PUBLIC_APP_URL` or fallback safely to `http://localhost:5173` without crashing.
