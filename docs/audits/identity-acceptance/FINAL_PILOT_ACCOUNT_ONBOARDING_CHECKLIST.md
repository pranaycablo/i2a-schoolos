# i2A SchoolOS — Final Pilot Account Onboarding Checklist

**Audit Date:** 2026-10-22  
**Target:** Private Staging Pilot School Deployments  
**Readiness Level:** `READY_FOR_PRIVATE_STAGING`

---

## 1. Pre-Deployment Staging Prerequisites

Before onboarding users from pilot educational institutions, confirm that the following infrastructure gates are satisfied:

- [ ] **1. Isolated Database Configuration:**
  - Verify MongoDB URI connects strictly to the dedicated staging database (not production or local mocks).
  - Confirm index creation: `node -e "require('./server/db').getDb().then(console.log);"`
- [ ] **2. Live Outbound Gmail/SMTP Configuration:**
  - Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS` in the private staging `.env`.
  - Set `PUBLIC_APP_URL` to the public staging URL (e.g. `https://staging.schoolos.in`).
  - Execute transport smoke test:
    ```powershell
    node -e "require('./server/services/emailService').verifySmtpConnection().then(console.log);"
    ```
- [ ] **3. Reverse Proxy & HTTPS:**
  - Enforce SSL/TLS termination with HTTP to HTTPS redirect.
  - Confirm secure CORS headers matching `PUBLIC_APP_URL`.

---

## 2. Role-by-Role Onboarding Procedures

### A. School Administrator Onboarding
1. Super Admin logs into Platform Admin Console (`/platform-admin`).
2. Registers new School Institution (Name, Affiliation Code, Branch, City).
3. Invites School Principal/Admin via `POST /api/auth/invite-user` with `role: 'PRINCIPAL'`.
4. Principal receives activation email → opens link → chooses strong password → gains access to School Management Portal.

### B. Teacher & Instructional Staff Onboarding
1. School Admin or HR navigates to **Staff & Workforce Module** (`/staff-workforce`).
2. Inputs teacher profile: Name, Email, Department (e.g. Science/Mathematics), and Assigned Classes (e.g. `Class IX-A`, `Class X-B`).
3. Clicks **Send Invitation**.
4. Teacher receives branded email → activates account → sets personal password → enters **Teacher Workspace**.
5. Teacher verifies that attendance roster and grading forms display only their assigned classes.

### C. Student & Parent Onboarding
1. School Registrar imports or adds Student profile (Name, DOB, Roll Number, Class, Section).
2. Issues Parent invitation with bound child reference (`childrenIds: ['STU-001']`).
3. Student receives activation link to enter **Student Learner Portal** (Homework, Timetable, Exams).
4. Parent receives activation link to enter **Parent Portal** (Fee Receipts, Attendance, Report Cards).

---

## 3. Operational Support & Credential Lifecyle Actions

| Support Scenario | Administrator Action | API Endpoint | Outcome |
| :--- | :--- | :--- | :--- |
| **Expired Invitation** | Click "Resend Invitation" | `POST /api/auth/resend-invitation` | Old token rotated; fresh 7-day token dispatched. |
| **Misdirected Invitation** | Click "Revoke Invitation" | `POST /api/auth/revoke-invitation` | Token hash cleared; activation link denied immediately. |
| **Forgotten Password** | Direct user to login modal | `POST /api/auth/forgot-password` | 6-digit OTP sent to registered email (15-min validity). |
| **Account Termination** | Mark employee/student inactive | MongoDB `$set: {status: 'DISABLED'}` | All existing JWT sessions terminated immediately. |

---

## 4. Final Deployment Certification Checklist

- [x] All 6 complete browser lifecycle journeys verified in headless Chromium.
- [x] Zero plaintext passwords stored in database; single-use SHA-256 tokens used.
- [x] Authenticated password change revokes active JWT tokens in real time.
- [x] Cross-tenant and class-level scoping verified by automated integration tests.
- [x] Full test suite (38 test files, 493 tests) passed cleanly.
- [x] Clean TypeScript build (`tsc -b`), clean Oxlint (0 errors), clean Vite production bundle.
