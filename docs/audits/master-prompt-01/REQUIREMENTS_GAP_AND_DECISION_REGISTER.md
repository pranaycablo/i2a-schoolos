# MASTER PROMPT 01 — REQUIREMENTS GAP & DECISION REGISTER
**Project:** i2A SchoolOS | Global Multi-Tenant Education Management Platform  
**Audit Root:** `D:\i2A_School ERP & Managment`  
**Phase:** Phase I — Product Requirements Preservation & Open Business Decision Register  

---

## 1. Preserved Core Business Rules

The technical foundation preserves all 10 core business requirements established in Master Prompt 00 without unapproved alterations:

1. **Student-Tiered Subscription Plans:**
   - Plan 1: **₹10 / student / month** (Basic SIS, Attendance & Digital Fees)
   - Plan 2: **₹20 / student / month** (Adds Homework, Communication & Mobile WebApp)
   - Plan 3: **₹30 / student / month** (Adds AI Exams, Question Bank & Report Cards)
   - Plan 4: **₹40 / student / month** (Adds School Store, Timetables & Staff Payroll)
   - Plan 5: **₹50 / student / month** (Full Enterprise, Custom Branding & Multi-Branch)
2. **30-Day Free Trial Cadence:**
   - 30 days full feature access on initial onboarding.
   - Automated countdown and reminder alerts at Day 15, Day 7, Day 3, and Day 1 prior to expiration.
3. **Dual Financial Architecture:**
   - **SaaS Platform Billing:** School tenant pays i2A SchoolOS for software subscription.
   - **Institutional Fee Ledger:** School collects student tuition and activity fees directly into its own bank/UPI account.
4. **Institutional Hierarchy:**
   - Support for single independent schools, multi-campus groups, coaching institutes, and colleges.
5. **AI Approval Gating (L0–L3):**
   - L0 (Autonomous): Read-only summarization and auto-drafting.
   - L1 (Operational): Teacher single-click approval for worksheets and homework.
   - L2 (Controlled): Principal dual-sign-off for term examinations and fee waivers.
   - L3 (Critical): Mandatory multi-party authentication for payroll disbursement and student enrollment deletion.
6. **Video Retention Policies:**
   - 30-day retention for routine daily class revision clips.
   - 365-day retention for full-length curriculum library recordings.

---

## 2. Open Business Decisions & Contradiction Register

| ID | Issue Description | FOV / Prior Document Claim | Current Master Strategy Rule | Proposed Resolution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | **Pricing Model Discrepancy** | FOV-08 documents specified fixed school rates: ₹1,500 / ₹2,500 / ₹5,000 per month. | Master Prompt 00 explicitly defines per-student pricing: ₹10, ₹20, ₹30, ₹40, ₹50 / student / month. | **Adopt Master Prompt 00 ₹10–₹50 student-tier pricing** as primary business model. The server calculation engine already implements this model. | **PROPOSED (Awaiting Owner Sign-off)** |
| **DEC-002** | **WhatsApp API Cost Liability** | Early documentation assumed unlimited WhatsApp messages could be included in all plans. | Meta Cloud API charges ₹0.40–₹0.90 per marketing/utility conversation window in India. | **Hybrid Billing Model:** Schools provide their own Meta Cloud API credentials, or purchase prepaid message packs from i2A. Unlimited WhatsApp cannot be absorbed under a ₹10/student plan. | **PROPOSED (Awaiting Owner Sign-off)** |
| **DEC-003** | **Video Hosting & Bandwidth Architecture** | Unspecified video hosting; some notes implied native video upload on web server. | High video storage and egress bandwidth costs can create unsustainable unit economics. | **Dual Video Tier:** Support zero-cost YouTube Unlisted / Vimeo embeds by default. Offer Cloudflare R2 + CDN private video hosting as a paid add-on under Plan 5. | **PROPOSED (Awaiting Owner Sign-off)** |
| **DEC-004** | **School Website Domain Routing** | Assumed direct custom domain mapping for all registered schools. | Managing arbitrary DNS records and SSL certificates for non-technical schools requires automated infrastructure. | **Subdomain-First Approach:** Automatically assign `{school-code}.schoolos.in` on onboarding. Support custom CNAME domain mapping as an advanced enterprise feature. | **PROPOSED (Awaiting Owner Sign-off)** |
| **DEC-005** | **Taxation Scope (GST)** | Assumed school ERP platform and all related sales are completely GST tax-exempt. | Core academic tuition is exempt under Notification 12/2017 (Sl. No. 66), but school store commercial goods (uniforms 5%–12%) and SaaS software subscriptions (18% GST) are taxable. | **Explicit Tax Classification:** Software invoices calculate 18% GST; uniform/book store items apply specific SAC/HSN GST rates; school tuition ledger remains GST-exempt. | **PROPOSED (Awaiting Owner Sign-off)** |
| **DEC-006** | **UDISE+ Integration Scope** | Some notes implied real-time API syncing with Ministry of Education servers. | The National Department of School Education does not offer a public bidirectional REST API for private third-party ERPs. | **Standard DCF Export:** i2A provides structured CSV/Excel exports matching the exact format of the annual UDISE+ Data Capture Format. | **PROPOSED (Awaiting Owner Sign-off)** |
