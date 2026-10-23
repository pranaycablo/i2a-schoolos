# Comprehensive Acceptance Criteria & Multi-Tier Test Strategy
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-019 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Multi-Tier Testing Pyramid

To ensure that **i2A SchoolOS** meets enterprise reliability standards, every functional module must satisfy a 5-tier quality gate prior to production deployment:

```
                  ┌────────────────────────┐
                  │ Tier 5: E2E Browser UAT│ (Playwright / Cypress Journeys)
                  ├────────────────────────┤
                  │ Tier 4: Security & IDOR│ (Penetration & Cross-Tenant Probes)
                  ├────────────────────────┤
                  │ Tier 3: API Integration│ (Live Express 5 + MongoDB Native Pool)
                  ├────────────────────────┤
                  │ Tier 2: Domain Unit    │ (Vitest Math, Entitlements & Solvers)
                  ├────────────────────────┤
                  │ Tier 1: Static Typing  │ (TypeScript `tsc -b` & OxLint)
                  └────────────────────────┘
```

---

## 2. Multi-Tier Test Execution Protocols

### Tier 1: Static Analysis & Type Checking
- **Commands:** `node ./node_modules/typescript/bin/tsc -b` and `npm run lint`.
- **Pass Criteria:** Strictly 0 compilation errors and 0 fatal lint errors.
- **Enforcement:** Executed automatically on every git pre-commit hook and CI/CD pull request.

### Tier 2: Domain Unit Testing (`vitest`)
- **Command:** `node ./node_modules/vitest/vitest.mjs run`.
- **Scope:** Pure algorithmic and domain business logic:
  - *Integer Paise Precision:* Verifies that fee totals, GST @ 18%, and kit bundle line-items never exhibit floating-point rounding errors (e.g. ₹0.01 discrepancies).
  - *Discount Boundary Test:* Verifies that commercial discounts are strictly clamped between 0% and 40%.
  - *Timetable Conflict Solver:* Asserts that teacher double-booking, room capacity overruns, or invalid period allocations immediately raise domain conflict exceptions.
- **Pass Criteria:** 100% pass rate across all 18 existing test suites (134 tests minimum).

### Tier 3: Live API & Database Integration Testing
- **Suite:** `src/__tests__/BackendApiIntegration.test.ts`.
- **Scope:** Real HTTP network requests against a running Express 5 app connected to an active local MongoDB instance:
  - *Authentication:* JWT token verification, expiration rejection, invalid signature rejection.
  - *NIST Password Reset:* OTP rate-limiting (429 on 4th attempt), single-use token consumption, bcrypt hash updates.
  - *Attendance Batch & Lock:* Verifies that once a principal locks a date, subsequent teacher mutations fail with `403`.
  - *Payment Webhook Security:* Computes raw SHA256 HMAC signature; asserts tampered payload yields `400 Bad Request`; asserts duplicate webhook ID triggers idempotent `200` without re-crediting.
- **Pass Criteria:** 15/15 tests passing with zero mock bypasses.

### Tier 4: Multi-Tenant Security & Negative Penetration Testing
- **Test Vectors:**
  1. *Cross-Tenant Injection:* User authenticated under `I2A-SCH-000001` queries `GET /api/students?schoolId=I2A-SCH-000002`. Must return `HTTP 403 Forbidden` (`TENANT_VIOLATION`).
  2. *Parent-Child IDOR Probe:* Parent `P1` requests profile or report card of Student `S2` (linked to Parent `P2`). Must return `HTTP 403 Forbidden`.
  3. *Unauthenticated Role Elevation:* User modifying their JWT payload to claim `SUPER_ADMIN` must fail signature verification with `HTTP 401 Unauthorized`.
  4. *NoSQL Injection:* Malicious string `{"$ne": null}` injected into password field must be sanitized and rejected with `401`.

### Tier 5: End-to-End User Journeys (UAT)
- **Viewport Coverage:** Verified responsive rendering on Mobile (375x667), Tablet (768x1024), and Desktop (1920x1080).
- **Core Role Journeys Tested:**
  - *Principal:* Dashboard login -> Fee collection KPI check -> Timetable substitution review.
  - *Teacher:* Class attendance 1-click grid -> Homework assignment post -> Subjective marks entry.
  - *Parent:* Child progress view -> Fee payment checkout -> Branded receipt PDF download.
  - *Student:* Homework upload -> Online timed test taking -> Revision video viewing.

---

## 3. Module Acceptance Criteria Baseline

| Module | Functional Acceptance Criteria | Automated Test Evidence |
| :--- | :--- | :--- |
| **School Registration** | 5-step wizard completes; email/phone OTP rate-limited; registration document uploaded to private vault; application reference issued. | Registration test suite passing. |
| **Attendance Engine** | Class roster marks batch attendance; low-attendance alert triggers if $< 85\%$; lock state prevents retroactive modification. | `AttendanceLeave.test.ts` passing. |
| **Timetable Scheduling** | Algorithmic solver detects room and teacher clashes (409 Conflict); free teacher substitution suggested. | `TimetableScheduling.test.ts` passing. |
| **Examinations & Results** | Online exam enforces timer and auto-save; objective auto-evaluated; report card PDF generates with school logo and signatures. | `ExaminationResult.test.ts` passing. |
| **Fee Management** | Fee structures created; receipts generated in integer paise; student ledger balance decrements accurately upon payment. | `FinanceSecurity.test.ts` passing. |
| **Payment Gateway** | Live payment calls blocked without credentials (`BLOCKED_NO_CREDENTIALS`); webhook SHA256 HMAC signature verified; idempotency enforced. | `PaymentGatewayIsolation.test.ts` passing. |
| **SaaS Subscription** | 5 monthly tiers (₹10–₹50) enforced server-side; 30-day trial reminders fire on Day 20-30; commercial discounts capped at 40%. | `SubscriptionBilling.test.ts` passing. |
| **School Marketplace** | Cart checkout atomically decrements product stock; kit bundles compute bundle discounts; cancellations restore inventory. | `SchoolMarketplace.test.ts` passing. |
| **Notifications** | Alerts recorded in in-app hub; unconfigured SMTP/WhatsApp records truthful `BLOCKED_NO_SMTP_PROVIDER` (Zero-False-Pass). | `CredentialsNotificationDispatch.test.ts` passing. |
