# 36-Prompt Master Execution Plan & Quality Gate Tracker (Prompts 00–35)
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-018 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Execution Governance & Verification Protocol

1. **Strict Sequential Execution:** Prompts must be executed in strict numerical sequence from Prompt 00 through Prompt 35. No phase may be started before the preceding phase passes all automated verification gates.
2. **Mandatory 4-Layer Gate Mandate:** Every prompt must satisfy:
   $$\text{BUILD} \longrightarrow \text{INTEGRATE} \longrightarrow \text{TEST} \longrightarrow \text{FORENSIC AUDIT}$$
3. **Zero Automated Continuation:** When a prompt completes, the agent must present the forensic evidence, update the tracker, and **STOP**. Automated execution of subsequent prompts without explicit owner sign-off is strictly forbidden.
4. **Repair Protocol:** If any unit test, type-check, or lint error occurs, a dedicated repair session must be executed on that phase until clean.

---

## 2. Master 36-Prompt Roadmap & Verification Gates

| Prompt # | Stage Title & Objective | Key Artifacts & Deliverables | Verification Command & Gate Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **00** | **Global Research, Requirements Discovery & Product Blueprint** | 21 Strategic Blueprint documents in `docs/strategy/`. | Complete coverage of all 21 prompt sections; zero code alterations. | **IN_PROGRESS (CURRENT)** |
| **01** | **Repository Forensic Audit & Foundation Repair** | Baseline audit report, package lock verification, clean workspace. | `npm test` (18 suites, 134 tests), `tsc -b`, `npm run lint`. | `PHASE_A_VERIFIED` |
| **02** | **Target Architecture & API Contracts** | OpenAPI 3.0 specs, TypeScript interfaces in `src/types/`. | Interface compilation clean; zero circular dependencies. | `READY` |
| **03** | **Domain Model, Database Design & Organization Hierarchy** | MongoDB schemas, compound indexes, Mongoose/native types. | Index creation script exit code 0; unique constraint tests pass. | `PLANNED` |
| **04** | **Security, Privacy & Compliance Design** | Threat model, DPDP consent models, encryption specifications. | Security architectural review sign-off. | `PLANNED` |
| **05** | **Design System & App Shell Transformation** | Glassmorphic design tokens, responsive sidebar, theme engine. | Visual rendering at 320px, 768px, 1440px; dark/light mode toggle. | `PLANNED` |
| **06** | **Identity, Roles & Multi-Tenant Isolation** | JWT middleware, bcrypt password hashing, 9 role gateways. | `TenantSecurity.test.ts` (17/17 passed), 403 on cross-tenant probe. | `VERIFIED_IN_PHASE_A` |
| **07** | **Public i2A Website & Category / Ad CMS** | Public homepage, educational category cards, CMS banner editor. | Zero dead links; all category cards navigate; banner CRUD works. | `READY_FOR_PHASE_B` |
| **08** | **Institution Registration & Verification Engine** | 5-step registration wizard, real OTP provider, document vault. | OTP rate-limiting test (429 on 4th attempt); document upload test. | `READY_FOR_PHASE_B` |
| **09** | **Organization, Branch, Campus & Academic Setup** | Universal Program -> Class -> Section hierarchy, branch switcher. | Multi-branch query scoping; identical school name isolation test. | `READY_FOR_PHASE_B` |
| **10** | **Staff Workforce Accounts & Permissions** | Staff directory, invitation tokens, biometric ID mapping. | `StaffWorkforceEnterpriseOS.test.ts` (18/18 passed); full regression (389/389 passed). | `VERIFIED_IN_PHASE_B` |
| **11** | **Admissions & Student Lifecycle (SIS)** | Public application form, approval workflow, student promotion. | `StudentAdmission.test.ts` (4/4 passed); unique admission no. | `VERIFIED_IN_PHASE_A` |
| **12** | **Academic Calendar & Conflict-Free Timetable** | Academic calendar, algorithmic timetable solver, substitution. | `TimetableScheduling.test.ts` (5/5 passed); conflict detection (409). | `VERIFIED_IN_PHASE_A` |
| **13** | **Attendance Engine & Leave Management** | 1-Click class grid, lock state, low-attendance alerts (<85%). | `AttendanceLeave.test.ts` (6/6 passed); lock prevents edits (403). | `VERIFIED_IN_PHASE_A` |
| **14** | **Homework, Daily Tasks & Weekly Tests** | Homework feed, student uploader, teacher grading remarks. | `HomeworkDigitalLearning.test.ts` (7/7 passed); submission status. | `VERIFIED_IN_PHASE_A` |
| **15** | **Examinations, Marks & Report Cards** | Online exam engine, objective auto-grading, PDF report cards. | `ExaminationResult.test.ts` (6/6 passed); CBSE/ICSE CGPA math. | `VERIFIED_IN_PHASE_A` |
| **16** | **Teacher, Student & Parent Portals** | Role-specific workspaces, Child 360° card, IDOR-protected views. | Parent-child IDOR test (foreign child returns 403 Forbidden). | `VERIFIED_IN_PHASE_A` |
| **17** | **School Fee Management & Ledgers** | Custom fee heads, quarterly installments, late fine engine. | `FinanceSecurity.test.ts` (5/5 passed); integer paise precision. | `VERIFIED_IN_PHASE_A` |
| **18** | **Payment Gateway Integrations & Reconciliation** | Dual-flow separation, Razorpay order API, HMAC webhook verify. | `PaymentGatewayIsolation.test.ts` (7/7 passed); BLOCKED without keys.| `VERIFIED_IN_PHASE_A` |
| **19** | **Pricing, 30-Day Trial & Feature Entitlements** | 5 plans (₹10–₹50), trial reminders Day 20-30, 40% discount cap. | `SubscriptionBilling.test.ts` (12/12 passed); discount > 40% rejected.| `VERIFIED_IN_PHASE_A` |
| **20** | **AI Orchestration & Human-in-the-Loop Guardrails**| Vendor-agnostic AI gateway (L0-L3 action gates, teacher review).| AI paper generator outputs DRAFT; student cannot view unapproved. | `PLANNED` |
| **21** | **Automation & Multi-Channel Notification Engine** | Durable task queue (BullMQ), WhatsApp API, SMTP relay status. | `CredentialsNotificationDispatch.test.ts` (4/4 passed). | `VERIFIED_IN_PHASE_A` |
| **22** | **Revision-Video Library & Learning Archives** | Video library UI, 30-day retention (₹40), 1-year archive (₹50). | Video purge cron test (31-day video access blocked on ₹40 plan). | `READY_FOR_PHASE_B` |
| **23** | **Transport Management & Logistics** | Vehicle fleet, bus routes, passenger manifests, driver app. | `AuxiliaryOperationsWorkflow.test.ts` (11/11 passed). | `VERIFIED_IN_PHASE_A` |
| **24** | **HR, Automated Payroll & School Expenses** | Biometric attendance sync, salary slip generator, expense ledger. | Payroll disbursement records UTR; expense balance matches ledger. | `VERIFIED_IN_PHASE_A` |
| **25** | **Inventory & School Marketplace Store** | Uniform kits, book bundles, stock safety, idempotent checkout. | `SchoolMarketplace.test.ts` (10/10 passed); stock replenishment. | `VERIFIED_IN_PHASE_A` |
| **26** | **Advanced Reporting & Management Intelligence** | Cross-module BI dashboards, 500+ dynamic reports, Excel export. | Report generation completes in < 500ms for 1,000 student dataset. | `PLANNED` |
| **27** | **Globalization, Curriculum & Government Mode** | UDISE+ DCF export, DPDP consent logs, bilingual English/Hindi. | Pre-submission UDISE validation flags missing mandatory fields. | `PLANNED` |
| **28** | **PWA & Mobile Strategy Execution** | Service Worker offline cache, `manifest.webmanifest`, Capacitor. | PWA installable prompt fires; Lighthouse PWA score >= 90. | `PLANNED` |
| **29** | **API Contracts & External Partner Integrations** | Public OpenAPI documentation, Tally XML connector, biometric sync. | Tally XML import matches school fee ledger exactly to the paise. | `PLANNED` |
| **30** | **Data Import / Export, Backup & Disaster Recovery** | Bulk CSV ingestion wizard, automated encrypted daily snapshots. | Ingestion rollback test (1 invalid row aborts batch cleanly). | `PLANNED` |
| **31** | **Security & Tenant-Isolation Regression Suite** | Automated penetration test scripts, IDOR probes, XSS/NoSQL tests. | 100% security test pass rate; zero critical or high vulnerabilities. | `PLANNED` |
| **32** | **Performance, Accessibility & Reliability Audit** | Load testing (500 req/sec), WCAG 2.1 AA accessibility audit. | Lighthouse Accessibility >= 95; API response p95 < 150ms. | `PLANNED` |
| **33** | **End-to-End UAT & Requirements Traceability Audit** | Automated Playwright/Cypress browser journeys for all 9 roles. | Complete traceability coverage for all requirements (WEB-001 to QA-001).| `PLANNED` |
| **34** | **Production Deployment, Monitoring & Observability** | Docker multi-stage builds, Prometheus metrics, structured logs. | Live health ping responds 200; error alerts stream to Sentry/Pager. | `PLANNED` |
| **35** | **Final Production Release Certification** | Executive forensic certification report & customer handover package.| Production sign-off signed by Principal Architect & Product Owner. | `PLANNED` |

---

## 3. Immediate Next Steps Post-Prompt 00

Upon owner review and formal approval of **Master Prompt 00**:
1. Review and verify the 21 blueprint documents.
2. Formally authorize **Master Prompt 07 & 08 (Phase B Focus: Public Website, Category CMS, and Institution Registration)**.
3. Keep core Phase A backend security and MongoDB persistence fully active and guarded by regression tests.
