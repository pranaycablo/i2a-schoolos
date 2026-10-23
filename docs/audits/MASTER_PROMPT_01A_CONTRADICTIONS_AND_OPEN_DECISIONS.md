# Master Prompt 01A — Contradictions, Open Decisions & Legal Boundary Audit
**Project:** i2A SchoolOS — Global Multi-Tenant Education Management Platform  
**Directory:** `D:\i2A_School ERP & Managment`  
**Classification:** Independent Forensic Gap & Risk Audit  
**Execution Date:** October 17, 2026  
**Status:** `CONTRADICTIONS_DOCUMENTED`  

---

## 1. Executive Summary

This forensic report catalogs all identified business rule divergences, contradictions between legacy documentation and the owner’s explicit instructions, unsupported legal or tax claims, and open architectural decisions that require product owner sign-off.

---

## 2. Identified Contradictions & Proposed Resolutions

### Contradiction 1: FOV-08 Dynamic Class-Group Pricing vs. Owner's 5 Per-Student Plans
- **Historical Implementation:**  
  Under FOV-08 (`FOV_08_DYNAMIC_PRICING_VERIFICATION.md` and `src/services/subscription/SubscriptionBillingService.ts`), dynamic class-group rates were implemented:
  - Nursery: ₹30 / student / mo
  - LKG/UKG: ₹35 / student / mo
  - Classes 1–5: ₹40 / student / mo
  - Classes 6–8: ₹50 / student / mo
  - Classes 9–10: ₹60 / student / mo
  - Classes 11–12: ₹65 / student / mo
  - NEET UG Prep add-on: ₹150 / student / mo
  - NEET PG Prep add-on: ₹250 / student / mo
- **Owner's Explicit Mandate:**  
  In the Master Prompt, the owner strictly specified **Five Sequential Feature Plans**:
  - ₹10 / student / mo (Basic ERP)
  - ₹20 / student / mo (Parent & Reports)
  - ₹30 / student / mo (AI Assisted)
  - ₹40 / student / mo (Automation & Revision Video Access - 1 Month)
  - ₹50 / student / mo (Advanced Learning & Video Archive - 1 Year)
- **Forensic Finding:**  
  The two models represent fundamentally different pricing philosophies: FOV-08 priced by *academic grade level*, whereas the Owner’s model prices by *feature capability tier*.
- **Proposed Reconciled Solution:**  
  1. Standardize on the **Owner's Five Feature Tiers (₹10, ₹20, ₹30, ₹40, ₹50)** as the primary, default SaaS pricing engine across the entire platform.
  2. Retain the class-group engine from FOV-08 as an optional "Custom Enterprise Plan" toggle available only for specialized trust negotiations requiring differential grade billing.
- **Decision Status:** `AWAITING_OWNER_CONFIRMATION`.

---

### Contradiction 2: Integration Test Attendance Lock State Collision (Database Persistence Artifact)
- **Forensic Observation:**  
  During the initial Vitest run of `BackendApiIntegration.test.ts`, Test 6.1 failed with `403 Forbidden` on the first `/attendance/mark` call, then immediately passed on the second run.
- **Root Cause Analysis:**  
  Test 6.1 generated a test date using `Math.floor(1 + Math.random() * 25)`. Because test runs execute against the real live MongoDB database (`mongodb://127.0.0.1:27017/i2a_schoolos`), prior integration test executions had locked that specific calendar date in the `attendance_locks` collection. When `Math.random()` picked that exact previously locked date, the server faithfully enforced the lock rule (`403 Attendance for this date is locked`).
- **Significance:**  
  This provides concrete forensic proof that MongoDB database persistence is active and enforcing server-side business rules. However, test suites must use high-entropy unique test dates (or an isolated test tenant UUID) to eliminate test interference across runs.
- **Decision Status:** `TECHNICAL_OPTIMIZATION_LOGGED`.

---

## 3. Unsupported Legal & Tax Claims (Correction Standard)

To maintain regulatory truthfulness, the following legal and tax corrections are established:

### 3.1 GST Tax Status of School Revenues in India
- **False / Inaccurate Assumption:** *"All educational institution transactions and fees are 100% exempt from Goods and Services Tax (GST)."*
- **Legal Reality under Indian Law:**
  - *Core Curriculum Tuition:* Exempt under Notification No. 12/2017-Central Tax (Rate), Serial No. 66, for services provided by an educational institution to its students, faculty, and staff.
  - *Commercial Marketplace Sales:* Sale of school uniforms, printed books, stationery, and merchandise is **taxable** under applicable GST rate slabs (5% for textiles under threshold; 12% for paper stationery).
  - *Platform SaaS Subscription (Flow A):* Software-as-a-Service provided by i2A to schools is classified under SAC 998315 and is **taxable at 18% GST**.
- **Corrected Architectural Rule:**  
  The system must never claim commercial uniform or platform software sales are tax-free. Invoices in Flow A strictly calculate 18% GST. School store sales in Flow B apply configurable commercial tax rates.

### 3.2 UDISE+ Government Integration Claim
- **False / Inaccurate Assumption:** *"i2A SchoolOS has an official API integration or government certification replacing UDISE+."*
- **Legal Reality:**  
  UDISE+ (Unified District Information System for Education Plus) is administered directly by the Ministry of Education, Government of India. There is no public bidirectional write API for private software to modify central UDISE+ records autonomously.
- **Corrected Architectural Rule:**  
  i2A SchoolOS is officially designated as an internal institutional data management system that pre-validates student records and exports valid Data Capture Format (DCF) packages for manual batch upload to official portals. Zero false claims of official ministry replacement.

---

## 4. Open Architectural Decisions Requiring Owner Sign-Off

| Decision ID | Architectural Question | Impacted Domains | Options Available | Recommended Solution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | **WhatsApp Business Cloud API Cost Allocation** | Notifications, Billing | A) i2A bundles WhatsApp within ₹40/₹50 plans.<br>B) Schools pre-fund a messaging wallet or bring their own Meta Cloud API credentials. | **Option B** (School-funded wallet / BYO Meta keys) to protect platform from unconstrained variable SMS/WhatsApp fees. | `AWAITING_OWNER_SIGN_OFF` |
| **DEC-002** | **Revision Video Cloud Storage Architecture** | Video Library, Unit Economics | A) Native S3/R2 private video streaming with hard storage quotas.<br>B) Hybrid model: Unlisted YouTube/Drive embeds for budget; native HLS for premium. | **Option B** (Hybrid Model) allowing budget institutions to avoid cloud storage surcharges. | `AWAITING_OWNER_SIGN_OFF` |
| **DEC-003** | **Website Domain Ownership Verification Method** | School Registration | A) Domain email challenge (`admin@school.edu.in`).<br>B) DNS TXT token challenge.<br>C) Upload scanned affiliation certificate. | **Option A & C** (Domain email or official affiliation certificate). | `AWAITING_OWNER_SIGN_OFF` |
| **DEC-004** | **Minimum Platform Monthly Invoice Floor** | SaaS Billing, Economics | A) Pure per-student calculation (e.g. 40 students @ ₹10 = ₹400/mo).<br>B) Minimum platform monthly floor (e.g. minimum ₹999/mo). | **Option B** (₹999/mo minimum floor) to cover baseline server and database pooling costs for micro-schools. | `AWAITING_OWNER_SIGN_OFF` |
