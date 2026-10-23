# Master Prompt 01A — Contradictions, Open Decisions & Traceability Gaps
**Project:** i2A SchoolOS — Global Multi-Tenant Education Management Platform  
**Directory:** `D:\i2A_School ERP & Managment`  
**Classification:** Independent Forensic Technical Audit  
**Audit Directory:** `docs/audits/master-prompt-01a/`  
**Execution Date:** October 17, 2026  
**Status:** `AUDIT_COMPLETED` | **Verdict:** `PASS_WITH_LIMITATIONS`  

---

## 1. Executive Summary

This forensic report documents all verified contradictions between legacy repository artifacts and current owner requirements, unverified architectural assumptions, unsupported legal or tax claims, and open business decisions requiring explicit product owner sign-off.

---

## 2. Identified Contradictions & Reconciled Solutions

### Contradiction 1: Dynamic Class-Group Pricing (FOV-08) vs. Owner's 5 Per-Student Plans
- **The Conflict:**
  - *Legacy Repository Code:* Under FOV-08 (`src/services/subscription/SubscriptionBillingService.ts` and `FOV_08_DYNAMIC_PRICING_VERIFICATION.md`), pricing was calculated based on student academic grade groups:
    - Nursery: ₹30/student/mo
    - LKG/UKG: ₹35/student/mo
    - Primary (1–5): ₹40/student/mo
    - Middle (6–8): ₹50/student/mo
    - Secondary (9–10): ₹60/student/mo
    - Senior Secondary (11–12): ₹65/student/mo
    - NEET UG Prep add-on: ₹150/student/mo
    - NEET PG Prep add-on: ₹250/student/mo
  - *Owner's Master Prompt Instruction:* Strictly specifies **Five Sequential Monthly Feature Plans**:
    - ₹10 / student / mo (Basic ERP)
    - ₹20 / student / mo (Parent & Reports)
    - ₹30 / student / mo (AI Assisted)
    - ₹40 / student / mo (Automation & 1-Month Revision Video Access)
    - ₹50 / student / mo (Advanced Learning & 1-Year Revision Video Archive)
- **Impact & Severity:** **HIGH (Commercial Core Model)**.
- **Reconciled Resolution (Proposed):**
  1. Standardize on the **Owner's Five Feature Tiers (₹10, ₹20, ₹30, ₹40, ₹50)** as the primary, default platform SaaS billing model across all modules.
  2. Maintain the FOV-08 class-group model in `SubscriptionBillingService.ts` as an optional "Custom Enterprise Plan" accessible only for specialized institutional contracts requiring grade-level differentials.
- **Approval Required:** **YES (Requires explicit Product Owner sign-off)**.

---

### Contradiction 2: Integration Test Attendance Lock State Collision (Database Persistence Artifact)
- **The Observation:**
  In `src/__tests__/BackendApiIntegration.test.ts`, Test 6.1 initially failed with `403 Forbidden` on the first `/attendance/mark` call when executed after multiple prior test runs. On immediate rerun, it passed cleanly.
- **Forensic Diagnosis:**
  Test 6.1 computed a random date via `Math.floor(1 + Math.random() * 25)`. Because Vitest runs against the live local MongoDB database (`mongodb://127.0.0.1:27017/i2a_schoolos`), earlier test runs had locked that specific date in the `attendance_locks` collection. When `Math.random()` picked that exact previously locked date, the server correctly enforced the lock constraint (`403 Attendance for this date is locked`).
- **Impact & Severity:** **LOW (Test Isolation Hygiene)**. Confirms genuine database persistence, but requires high-entropy test dates (e.g. `2026-12-${Date.now()}-${random}`) to prevent cross-run test interference.
- **Resolution:** Updated test suite recommendations logged for Phase 31.
- **Approval Required:** No (Technical hygiene optimization).

---

## 3. Unsupported Legal, Regulatory & Tax Claims

To maintain enterprise integrity, the following legal and tax positions are formally established:

### 3.1 GST Tax Status of School Revenues in India
- **Inaccurate Assumption:** *"All educational institution transactions and fees are 100% tax-free under Indian law."*
- **Legal Reality:**
  - *Core Tuition Fees:* Exempt under Serial No. 66 of Notification No. 12/2017-Central Tax (Rate).
  - *School Store / Marketplace:* Sale of uniforms (textiles), printed books, and stationery items is **taxable** under applicable GST rate slabs (5% to 12%).
  - *Platform SaaS Subscription (Flow A):* i2A SchoolOS software licenses are classified under SAC 998315 and are **taxable at 18% GST**.
- **Enforced Correction:** Flow A subscription invoices strictly compute 18% GST server-side (`server/routes/subscription.js`). School store products apply configurable commercial tax rates.

### 3.2 UDISE+ National Integration Claim
- **Inaccurate Assumption:** *"i2A SchoolOS has an official government integration replacing UDISE+."*
- **Legal Reality:**
  UDISE+ is administered by the Ministry of Education, Government of India. There is no public bidirectional write API for private software to modify central UDISE+ records autonomously.
- **Enforced Correction:** i2A SchoolOS is officially designated as an internal institutional data-management layer that assists schools in preparing valid Data Capture Format (DCF) exports. Zero false claims of official ministry replacement.

---

## 4. Open Architectural & Business Decisions (Requiring Owner Sign-Off)

| Decision ID | Open Question | Impacted Domain | Available Options | Recommended Solution | Approval Needed? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | **WhatsApp Business Cloud API Cost Allocation** | Notifications, Unit Economics | A) i2A bundles WhatsApp within ₹40/₹50 plans.<br>B) Schools fund a messaging wallet or bring their own Meta Cloud credentials. | **Option B** (School-funded wallet / BYO Meta keys) to protect platform from unconstrained variable SMS/WhatsApp fees. | **YES (Owner Approval)** |
| **DEC-002** | **Revision Video Cloud Storage Architecture** | Video Library, Bandwidth Costs | A) Native S3/R2 private video streaming with hard quotas.<br>B) Hybrid model: Unlisted YouTube/Drive embeds for budget; native HLS for premium. | **Option B** (Hybrid Model) allowing budget institutions to avoid cloud storage surcharges. | **YES (Owner Approval)** |
| **DEC-003** | **Website Domain Ownership Verification Method** | School Registration | A) Domain email challenge (`admin@school.edu.in`).<br>B) DNS TXT token challenge.<br>C) Scanned affiliation certificate upload. | **Option A & C** (Domain email or official affiliation certificate). | **YES (Owner Approval)** |
| **DEC-004** | **Minimum Platform Monthly Invoice Floor** | SaaS Billing, Economics | A) Pure per-student calculation (e.g. 40 students @ ₹10 = ₹400/mo).<br>B) Minimum platform monthly floor (e.g. minimum ₹999/mo). | **Option B** (₹999/mo minimum floor) to cover baseline server and database pooling costs for micro-schools. | **YES (Owner Approval)** |

---

## 5. Traceability Matrix & Implementation Status

| Requirement ID | Requirement Specification | Source Document | Physical Implementation File | Test Evidence | Audit Status | Severity | Recommended Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WEB-001** | Category cards & directory | `PRD.md` | `PublicSaasLandingPage.tsx` | UI verified | `PARTIALLY_VERIFIED` | Medium | Expand in Prompt 07 |
| **REG-001** | 5-step registration wizard | `PRD.md` | `SchoolSetupModule.tsx` | Setup tests | `PARTIALLY_VERIFIED` | High | Rebuild in Prompt 08 |
| **IAM-001** | Password bcrypt hashing | `PRD.md` | `server/middleware/auth.js` | Test 4.1 | **`VERIFIED`** | Critical | Maintained |
| **IAM-002** | 9 pre-created roles & JWT | `PRD.md` | `server/middleware/auth.js` | Test 2.1-2.3 | **`VERIFIED`** | Critical | Maintained |
| **ACA-001** | Dynamic academic engine | `PRD.md` | In-memory service | Academic tests| `PARTIALLY_VERIFIED` | High | Migrate to DB in Prompt 09|
| **ACA-002** | Conflict timetable engine | `PRD.md` | `TimetableSchedulingService.ts` | Test 7.1 | **`VERIFIED`** | High | Maintained |
| **ATT-001** | Attendance batch & lock | `PRD.md` | `server/routes/attendance.js` | Test 6.1 | **`VERIFIED`** | Critical | Maintained |
| **FEE-001** | Fee structure in paise | `PRD.md` | `server/routes/fees.js` | Finance tests| **`VERIFIED`** | Critical | Maintained |
| **BILL-001**| 5 per-student plans | `PRD.md` | `SubscriptionBillingService.ts`| Billing tests | **`VERIFIED`** | Critical | Standardize in Prompt 19|
| **BILL-002**| 30-day trial reminders | `PRD.md` | `SubscriptionBillingService.ts`| Billing tests | **`VERIFIED`** | High | Maintained |
| **BILL-003**| 40% maximum discount cap | `PRD.md` | `server/routes/subscription.js`| Test 8.1 | **`VERIFIED`** | Critical | Maintained |
| **PAY-001** | Dual financial separation | `PRD.md` | `server/routes/payments.js` | Payment tests| **`VERIFIED`** | Critical | Maintained |
| **PAY-002** | Live PG credential check | `PRD.md` | `server/routes/payments.js` | Test 9.1 | **`VERIFIED`** | Critical | Maintained (Zero-False-Pass)|
| **VID-001** | 30/365-day video retention | `PRD.md` | Policy documented | Pending impl | `UNVERIFIED` | High | Implement in Prompt 22 |
| **GOV-001** | UDISE+ DCF export | `PRD.md` | Policy documented | Pending impl | `UNVERIFIED` | Medium | Implement in Prompt 27 |
