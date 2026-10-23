# Business Rules, Policy Logic & Open Architectural Questions
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-004 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Core Business Rules & Invariant Policies

### 1.1 Dual Financial Flow Separation Invariant (RULE-FIN-001)
The platform must maintain strict logical and physical separation between two distinct financial domains:
- **Flow A: Platform SaaS Subscription (School -> i2A Platform)**
  - *Payor:* Educational Institution / Trust / Owner.
  - *Payee:* i2A SchoolOS Platform Merchant Account.
  - *Purpose:* SaaS license, platform maintenance, per-student monthly billing, cloud storage quotas.
  - *Tax Rule:* Standard 18% Goods & Services Tax (GST) applied to SaaS software licenses.
  - *Invoice Format:* `INV-PLATFORM-YYYY-XXXX`.
- **Flow B: Institutional Student Fees & Store Orders (Parent/Student -> School)**
  - *Payor:* Parent, Guardian, or Self-Enrolled Student.
  - *Payee:* Individual School’s Dedicated Merchant Account (or offline Cash/Cheque counter).
  - *Purpose:* Tuition, admissions, transport, laboratory, examination, and uniform kit charges.
  - *Tax Rule:* Core educational tuition is generally GST-exempt under Indian tax law; incidental commercial sales (uniforms, books) apply applicable GST (5%–12%).
  - *Receipt Format:* `REC-SCHOOLID-YYYY-XXXX`.
- **Invariant:** Funds from Flow B must **never** touch i2A Platform bank accounts unless operating an authorized escrow/split-settlement model.

---

### 1.2 The Five Per-Student Feature Tiers (RULE-PLAN-001)
The owner’s pricing structure establishes five sequential, additive feature tiers:

| Tier Price | Plan Name | Core Inclusions & Entitlements | Exclusions & Boundaries |
| :--- | :--- | :--- | :--- |
| **₹10 / student / mo** | **Basic ERP** | Student SIS, Admissions pipeline, Daily class attendance, Timetable grid, Manual daily homework posting, Weekly tests, Staff directory. | Parent Portal, Report Cards, AI features, Video access, Automation. |
| **₹20 / student / mo** | **Parent & Reports** | All ₹10 features + Dedicated Parent Portal, Student Progress Cards, Automated CBSE/ICSE Report Card PDF generator, Digital Fee Receipts. | AI features, Revision Videos, Automated workflows. |
| **₹30 / student / mo** | **AI Assisted** | All ₹20 features + AI Question Bank generator, AI Exam Paper creator, Chapter weakness diagnostic analytics, Principal NLQ assistant. | Video library access, Automated low-attendance triggers. |
| **₹40 / student / mo** | **Automation & Revision**| All ₹30 features + Configurable management automation (auto fee reminders, auto-absence alerts) + **1-Month Revision Video Access** (retention enforced). | 1-Year Video Archive, Advanced predictive analytics. |
| **₹50 / student / mo** | **Advanced & Archive** | All ₹40 features + **1-Year Revision Video Archive** (retention enforced), Multi-branch consolidated analytics, Priority support SLA. | None (All platform capabilities unlocked). |

---

### 1.3 30-Day Free Trial & Reminder Cadence (RULE-TRIAL-001)
1. **Authoritative Timestamping:** Trial period is exactly 30 calendar days ($30 \times 24 \times 60 \times 60 \times 1000\text{ ms}$) computed from UTC server time.
2. **Single Trial Policy:** A school identity (verified by school registration number, email, and phone) is entitled to exactly one free trial. Duplicate registrations revert to `EXPIRED` or require payment.
3. **Automated Reminder Cadence:**
   - *Days 1–19:* Silent evaluation; no payment pressure.
   - *Day 20:* First payment reminder dispatched (10 days remaining).
   - *Days 21–29:* Daily payment reminder (strictly at most one per calendar day, deduplicated by idempotent key).
   - *Day 30:* Final expiration warning.
   - *Suppression Rule:* Once an invoice is marked `PAID` and subscription transitions to `ACTIVE`, all trial reminders are immediately and permanently suppressed.
4. **Grace Period & Data Retention:** Upon Day 31 without payment, the school transitions to `TRIAL_EXPIRED`. Data is held in **read-only mode for 60 days** before archival. Student records are never immediately wiped.

---

### 1.4 Subscription Contract Durations & Discount Cap (RULE-BILL-001)
1. **Contract Durations:** Schools can purchase 1-Year, 2-Year, 3-Year, or 5-Year subscription terms.
2. **40% Maximum Commercial Discount Cap:**
   - Special commercial discounts applied to annual contracts are strictly capped at **40%**.
   - Any discount request exceeding 40% (e.g. 50%) is rejected server-side with `400 Bad Request`.
   - All discounts require authorized Super Admin role approval recorded in the audit log.

---

### 1.5 Human-in-the-Loop AI Action Gate (RULE-AI-001)
No AI module may execute consequential mutations autonomously. All AI operations are categorized into 4 strict action levels:
- **Level 0 (L0) — Contextual Suggestion:** Informational display only (e.g. suggesting an absent teacher's substitute).
- **Level 1 (L1) — Draft Generation:** AI creates a candidate artifact in `DRAFT` status (e.g., generating a question paper draft or report card comment).
- **Level 2 (L2) — Human Review & Approval:** A qualified human stakeholder (Teacher, Principal, Admin) must inspect, edit, and click "Approve & Publish".
- **Level 3 (L3) — Controlled Low-Risk Automation:** Scripted, deterministic rules executing pre-authorized tasks (e.g., dispatching pre-approved fee reminders).
- **Absolute Invariant:** AI is strictly prohibited from altering student grades, issuing expulsion orders, authorizing payroll disbursements, or modifying tenant permissions.

---

### 1.6 Revision Video Retention & Storage Quotas (RULE-VID-001)
1. **Plan-Enforced Retention:**
   - *₹40 Plan:* Video recordings are retained and accessible to students for exactly **30 calendar days** from the recording date. On Day 31, access expires automatically.
   - *₹50 Plan:* Video recordings are preserved in the institution's revision archive for **365 calendar days** (1 full academic year).
2. **Storage Accountability:** Video storage consumption is tracked per school. A video is only recognized as uploaded when its byte size, duration, and verified cloud storage URI are confirmed by the backend (metadata-only records are flagged as `PENDING_UPLOAD`).

---

## 2. Unresolved Business Decisions & Identified Conflicts

The following conflicts between historical documentation and the owner’s instructions must be explicitly documented and resolved:

### Conflict 1: Class-Group Dynamic Pricing (FOV-08) vs. Owner's 5 Per-Student Feature Tiers
- **The Conflict:**
  - In earlier audit reports (FOV-08 / `FOV_08_DYNAMIC_PRICING_VERIFICATION.md`), a dynamic pricing model was implemented where monthly rates varied by grade level (Nursery: ₹30, Classes 1–5: ₹40, Classes 6–8: ₹50, Classes 9–10: ₹60, Classes 11–12: ₹65) plus add-on exam prep fees.
  - In the Master Prompt, the owner explicitly specifies **Five Per-Student Feature Plans** (₹10 Basic, ₹20 Parent & Reports, ₹30 AI Assisted, ₹40 Automation & Revision, ₹50 Advanced Learning & Archive).
- **Proposed Resolution:**
  - Standardize on the **Owner's Five Feature Plans (₹10, ₹20, ₹30, ₹40, ₹50 per student/month)** as the primary SaaS subscription pricing model.
  - The class-group pricing model from FOV-08 should be preserved in the billing engine as an optional "Flexible Custom Plan" available only for specialized enterprise contracts upon Super Admin approval.
- **Status:** *AWAITING_OWNER_CONFIRMATION*.

---

### Conflict 2: WhatsApp Business API Billing Model & Account Ownership
- **The Issue:**
  - WhatsApp Business Cloud API imposes per-conversation charges (Authentication, Utility, Service, and Marketing conversation categories).
  - Who pays for WhatsApp utility notifications (fee reminders, attendance alerts)?
- **Options:**
  - *Option A (Platform-Bundled):* i2A absorbs WhatsApp costs within the ₹40/₹50 plans up to a monthly quota (e.g. 5 conversations per student/month), billing overages.
  - *Option B (School-Provided):* Each school brings its own Meta Cloud API credentials or pre-funds a messaging wallet inside i2A.
- **Proposed Recommendation:** Option B (School-managed messaging wallet or BYO Meta API credentials) to prevent unconstrained operational cost liability for i2A.
- **Status:** *UNRESOLVED_BUSINESS_DECISION*.

---

### Conflict 3: Video Storage Infrastructure & Bandwidth Costs
- **The Issue:**
  - High-definition video streaming for thousands of students incurs significant cloud storage (AWS S3 / Cloudflare R2) and CDN egress bandwidth expenses.
  - At ₹40 or ₹50 per student/month, unlimited video hosting could become economically unviable.
- **Options:**
  - *Option A (Native Cloud Hosting):* i2A provides direct S3/R2 storage with a hard quota (e.g. 500 MB storage per student).
  - *Option B (Hybrid Unlisted Embed):* Schools upload class videos to private/unlisted YouTube or Google Drive links, which i2A securely embeds and enforces retention policies on.
- **Proposed Recommendation:** Hybrid approach — Support secure Google Drive / YouTube private integration for budget schools, and dedicated S3/Cloudflare R2 private bucket with strict storage quotas for premium schools.
- **Status:** *UNRESOLVED_BUSINESS_DECISION*.

---

### Conflict 4: Institution Website Verification Method
- **The Issue:**
  - During institution onboarding (Step B/C), a school may provide a website URL. A website URL cannot receive an SMS or email OTP.
- **Supported Verification Options:**
  - *Method 1 (Domain Email Verification):* Verifying an email matching the domain (e.g. `principal@schoolname.edu.in`).
  - *Method 2 (DNS TXT Record Challenge):* School webmaster inserts a verification token (`i2a-verification=XXXXX`) into their domain DNS.
  - *Method 3 (Official Affiliation Document):* Uploading a scanned affiliation certificate from CBSE/ICSE/State Board displaying the URL.
- **Proposed Recommendation:** Method 1 as default; Method 3 for schools without IT personnel.
- **Status:** *ARCHITECTURAL_PROPOSAL*.
