# Master Requirements Traceability Matrix (RTM)
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-017 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Traceability Standard & Schema

This matrix links business requirements to technical architectures, automated tests, and implementation prompts across 20 functional domains.
- **Priority:** `P0` (Critical Path / Invariant), `P1` (Core Operational), `P2` (Enhanced Capability).
- **Source:** `OWNER` (Direct statement), `EXISTING_CODE` (Repository audit), `OFFICIAL_REG` (Regulatory statutory mandate), `PROPOSAL` (Architectural proposal).
- **Current Status:** `VERIFIED_IN_CODE` (Passing tests), `READY_FOR_PHASE_B` (Unblocked next step), `PLANNED` (Future prompt roadmap).

---

## 2. Requirements Traceability Register

| Req ID | Exact Requirement Specification | Source | Pri | Related Module | Impl Prompt | Acceptance Criteria | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WEB-001** | Professional i2A homepage with educational category cards, working navigation, and verified status. | OWNER | P1 | Public Website | Prompt 07 | Category cards clickable; zero dead links; school directory filters. | `READY_FOR_PHASE_B` |
| **WEB-002** | Configurable CMS promotional banners with real click targets and admin editing controls. | OWNER | P2 | Public Website | Prompt 07 | Admin can create banner, upload image, assign target URL, and toggle active status. | `READY_FOR_PHASE_B` |
| **ORG-001** | Support hierarchical organization tree: Platform -> Trust/Group -> Branch/School -> Class. | OWNER | P0 | Organization | Prompt 09 | Schools can be grouped under a trust; consolidated dashboards for authorized trust officers. | `VERIFIED_IN_CODE` |
| **ORG-002** | School name is never unique key; official UDISE code stored separately from immutable i2A ID. | PROPOSAL| P0 | Organization | Prompt 09 | Identical school names allowed across different tenants; UDISE validated against regex. | `VERIFIED_IN_CODE` |
| **REG-001** | 5-step school registration: Basic Info, Contact OTP, Document Vault, Academic Setup, Review. | OWNER | P0 | Registration | Prompt 08 | Real email/phone OTP with rate limiting; document upload to private vault; review status. | `READY_FOR_PHASE_B` |
| **REG-002** | Website URL verification method (Domain email challenge or DNS TXT) separate from SMS OTP. | PROPOSAL| P1 | Registration | Prompt 08 | Website URL cannot receive phone OTP; domain email or document challenge verified. | `READY_FOR_PHASE_B` |
| **IAM-001** | Cryptographic password hashing (bcrypt salt >= 10); zero plaintext password storage or display. | EXISTING| P0 | Authentication | Prompt 06 | Cleartext passwords never in DB; admin invitation token email sent for password setup. | `VERIFIED_IN_CODE` |
| **IAM-002** | Role-Based Access Control enforcing 9 pre-created roles with server-authenticated JWT tokens. | EXISTING| P0 | Authentication | Prompt 06 | Header role change triggers JWT re-login; unauthenticated role spoofing physically blocked. | `VERIFIED_IN_CODE` |
| **IAM-003** | NIST-compliant password reset: 6-digit OTP, 3-attempt/15-min rate limit, single-use reset token. | EXISTING| P0 | Authentication | Prompt 06 | Reusing a consumed reset token returns 400 Bad Request; OTP rate-limited strictly. | `VERIFIED_IN_CODE` |
| **ACA-001** | Universal dynamic academic engine supporting Playgroup, K-12, Colleges, Coaching, and Tuitions. | OWNER | P0 | Academics | Prompt 12 | Zero hardcoded grade list; classes, programs, sections, and shifts dynamically configurable. | `READY_FOR_PHASE_B` |
| **ACA-002** | Algorithmic conflict-free timetable scheduling preventing teacher and room double-booking. | EXISTING| P0 | Timetable | Prompt 12 | Double-booking returns 409 Conflict; substitution engine finds free teachers for absent staff. | `VERIFIED_IN_CODE` |
| **ATT-001** | 1-Click daily class attendance grid with batch persistence and low-attendance parent alerts. | OWNER | P0 | Attendance | Prompt 13 | Attendance < 85% dispatches automated alert to linked guardian; lock state prevents edits. | `VERIFIED_IN_CODE` |
| **ASM-001** | Term examinations engine with objective auto-grading, subjective teacher grading, and report cards. | EXISTING| P0 | Examinations | Prompt 15 | High-fidelity branded report card PDF with CBSE/ICSE grading and Principal stamp/signature. | `VERIFIED_IN_CODE` |
| **PAR-001** | Dedicated Parent Portal with Child 360° view, fee payment, report cards, and teacher messages. | OWNER | P0 | Parent Portal | Prompt 16 | Parent can only access verified child wards (IDOR check returns 403 on foreign child). | `VERIFIED_IN_CODE` |
| **FEE-001** | Multi-head fee structure (Tuition, Transport, Lab) with automated late fines in integer paise. | EXISTING| P0 | Fee Engine | Prompt 17 | All monetary calculations in integer paise; instant branded PDF receipt with unique invoice ID. | `VERIFIED_IN_CODE` |
| **BILL-001**| Platform subscription billing based on 5 per-student plans: ₹10, ₹20, ₹30, ₹40, ₹50 / student / mo. | OWNER | P0 | SaaS Billing | Prompt 19 | Feature gating enforces plan boundaries; student count computed authoritatively; 18% GST. | `VERIFIED_IN_CODE` |
| **BILL-002**| 30-Day Free Trial with daily idempotent payment reminders from Day 20 through Day 30. | OWNER | P0 | SaaS Billing | Prompt 19 | Reminders dispatch once per day; payment active suppresses all further trial reminders. | `VERIFIED_IN_CODE` |
| **BILL-003**| School subscription contracts (1, 2, 3, 5 years) with commercial discounts capped strictly at 40%.| OWNER | P0 | SaaS Billing | Prompt 19 | Discount > 40% rejected server-side with 400 Bad Request; multi-year billing terms supported.| `VERIFIED_IN_CODE` |
| **PAY-001** | Strict dual financial separation: Flow A (SaaS Subscriptions) vs Flow B (School Fees). | OWNER | P0 | Payments | Prompt 18 | Platform account never receives student tuition fees; schools configure independent gateways. | `VERIFIED_IN_CODE` |
| **PAY-002** | Payment gateway security: SHA256 HMAC webhook verification and Zero-False-Pass without keys. | EXISTING| P0 | Payments | Prompt 18 | Live payment calls blocked (400) if keys missing; tampered webhook signature rejected. | `VERIFIED_IN_CODE` |
| **AI-001**  | Human-in-the-loop AI orchestration under 4 Action Levels (L0 Suggestion to L3 Automation). | OWNER | P0 | AI Engine | Prompt 20 | AI never publishes exam papers or grades autonomously; mandatory teacher review gate. | `VERIFIED_IN_CODE` |
| **AUTO-001**| Multi-channel notifications tracking delivery status truthfully (Zero-False-Pass). | EXISTING| P1 | Notifications | Prompt 21 | Outbound email without SMTP marked BLOCKED_NO_SMTP_PROVIDER; in-app hub records message. | `VERIFIED_IN_CODE` |
| **VID-001** | 1-Month Revision Video access for ₹40 plan; 1-Year Revision Video Archive for ₹50 plan. | OWNER | P0 | Video Library | Prompt 22 | Automated daily background job purges streaming access after 30 days (₹40) or 365 days (₹50). | `READY_FOR_PHASE_B` |
| **TRN-001** | Transport fleet management with bus routes, stop-wise fees, vehicle upkeep, and driver app. | OWNER | P1 | Transport | Prompt 23 | Passenger manifests linked to bus stops; driver 1-tap boarding checklist; parent alerts. | `VERIFIED_IN_CODE` |
| **STR-001** | Integrated School Marketplace for uniforms, book kits, and merchandise with stock safety. | OWNER | P1 | Marketplace | Prompt 25 | Idempotent orders prevent duplicate purchases; stock decremented and restored on cancel. | `VERIFIED_IN_CODE` |
| **GOV-001** | Public-sector operating mode aligned with UDISE+ Data Capture Format and DPDP Act 2023. | OFFICIAL | P0 | Government Mode| Prompt 27 | Pre-submission DCF validation; verifiable guardian consent logs; zero behavioral profiling. | `PLANNED` |
| **SEC-001** | Strict server-side multi-tenant isolation enforcing schoolId scoping (403 on cross-tenant). | EXISTING| P0 | Security | Prompt 31 | Cross-tenant database probe returns 403 Forbidden; Super Admin has authorized bypass. | `VERIFIED_IN_CODE` |
| **DAT-001** | Data retention policy: 8-year financial records, permanent transcripts, soft-delete pattern. | OFFICIAL | P0 | Data Lifecycle | Prompt 30 | Primary records use soft-delete (deletedAt); daily encrypted backups with point-in-time recovery. | `PLANNED` |
| **QA-001**   | Full automated regression test suite maintaining 100% pass rate before release gates. | EXISTING| P0 | Quality Assur. | Prompt 33 | Vitest regression test suite, zero TypeScript errors (`tsc -b`), zero linter errors. | `VERIFIED_IN_CODE` |
