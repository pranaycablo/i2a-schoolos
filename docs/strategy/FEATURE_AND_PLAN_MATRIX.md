# Feature Catalogue & Per-Student Plan Entitlement Matrix
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-009 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Feature Entitlement Architecture

i2A SchoolOS employs a centralized, server-side feature gating engine. Entitlements are evaluated at runtime by checking the school’s active subscription tier (`subscriptionTier`) and plan status (`TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED`). Client-side UI toggles merely reflect server permissions; direct API calls to unauthorized endpoints return `403 Feature Not Included in Current Subscription Tier`.

---

## 2. Complete 5-Tier Feature Matrix

The following matrix categorizes all platform capabilities across the owner’s five per-student monthly plans, explicitly tagging their implementation status:
- `[OWNER]` = Dictated directly by owner.
- `[IMPL]` = Verified implemented in repository.
- `[PROP]` = Proposed enterprise enhancement.
- `[EXT]` = Requires third-party credentials/hardware.

| Platform Capability / Module | ₹10 / Mo (Basic) | ₹20 / Mo (Parent & Reports) | ₹30 / Mo (AI Assisted) | ₹40 / Mo (Automation & Rev) | ₹50 / Mo (Advanced & Archive) | Source & Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student SIS & Enrollment** | ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Online Admissions Pipeline** | ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Daily Class Attendance Grid**| ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Timetable & Substitution** | ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Manual Daily Homework Feed**| ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Weekly Tests (Manual)** | ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Staff Directory & Basic HR**| ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **School Fee Invoicing** | ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Counter Cash/Cheque Receipts**| ✅ Included | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Dedicated Parent Portal** | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Student Progress Reports** | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **CBSE/ICSE Report Card PDFs** | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Digital Receipts Delivery** | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Online Payment Gateway Link** | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | ✅ Included | `[PROP]` `[IMPL]` `[EXT]` |
| **AI Question Bank Generator** | ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **AI Test & Exam Paper Creator**| ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **AI Diagnostic Weakness Engine**| ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[PROP]` |
| **Principal AI Assistant (NLQ)** | ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` |
| **Management Automation Bots** | ❌ Excluded | ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | `[OWNER]` `[PROP]` |
| **Automated Fee Due Reminders**| ❌ Excluded | ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` `[EXT]` |
| **Auto Low-Attendance Alerts** | ❌ Excluded | ❌ Excluded | ❌ Excluded | ✅ Included | ✅ Included | `[OWNER]` `[IMPL]` `[EXT]` |
| **1-Month Revision Video Access**| ❌ Excluded | ❌ Excluded | ❌ Excluded | ✅ **30-Day Window** | ✅ Included | `[OWNER]` `[PROP]` |
| **1-Year Revision Video Archive**| ❌ Excluded | ❌ Excluded | ❌ Excluded | ❌ Excluded | ✅ **365-Day Window**| `[OWNER]` `[PROP]` |
| **Multi-Branch Consolidated BI**| ❌ Excluded | ❌ Excluded | ❌ Excluded | ❌ Excluded | ✅ Included | `[PROP]` `[IMPL]` |
| **School Marketplace Store** | Add-on | Add-on | Add-on | Add-on | ✅ Included | `[PROP]` `[IMPL]` |
| **Transport Fleet GPS Tracking**| Add-on | Add-on | Add-on | Add-on | ✅ Included | `[PROP]` `[IMPL]` `[EXT]` |
| **Digital Library Management** | Add-on | Add-on | Add-on | Add-on | ✅ Included | `[PROP]` `[IMPL]` |

---

## 3. Subscription Billing & Pricing Engine Rules

### 3.1 Authoritative Student Count Calculation
1. **Billable Student Definition:** Any student marked with status `ACTIVE` or `PROVISIONAL` within the academic session during any part of the billing month.
2. **Student Status Lifecycle Rules:**
   - *Withdrawn / Transferred Students:* Marked `TRANSFERRED` or `WITHDRAWN` upon issuance of Transfer Certificate (TC). Excluded from subsequent billing cycles.
   - *Inactive / Suspended Students:* If marked `INACTIVE` by school admin, access is revoked, but they remain billable for the current month until formal withdrawal to prevent temporary suspension billing evasion.
3. **Monthly Billing Formula:**
   $$\text{Monthly Base} = \text{Active Student Count} \times \text{Plan Rate}$$
   $$\text{Add-On Courses} = \sum (\text{Enrolled Students}_j \times \text{Course Rate}_j)$$
   $$\text{Subtotal} = \text{Monthly Base} + \text{Add-On Courses} - \text{Approved Commercial Discount}$$
   $$\text{Total Invoice Payable} = \text{Subtotal} + (\text{Subtotal} \times 0.18\text{ GST})$$

---

### 3.2 School Subscription Term Options & Discount Structure

Schools contract with i2A SchoolOS for multi-year commitments to lock in pricing and receive volume incentives:

| Subscription Duration | Base Term Rate | Maximum Permissible Discount | Commercial Policy |
| :--- | :--- | :--- | :--- |
| **30-Day Free Trial** | Free (₹0) | N/A | Full ₹50 plan capabilities unlocked for 30 days. Reminders start Day 20. |
| **1-Year Commitment** | 12 × Monthly | Up to 15% Discount | Standard annual contract paid upfront or quarterly. |
| **2-Year Commitment** | 24 × Monthly | Up to 25% Discount | Medium-term institutional commitment. |
| **3-Year Commitment** | 36 × Monthly | Up to 35% Discount | Multi-year trust agreement with locked pricing. |
| **5-Year Commitment** | 60 × Monthly | **Strict 40% Maximum Cap** | Long-term enterprise contract. Capped at 40% server-side. |

> **Anti-Tampering Enforcement:** Discounts above 40% are physically rejected by the backend API (`server/routes/subscription.js`). No administrator may input or approve fictitious discounts.

---

### 3.3 Plan Upgrade, Downgrade & Expiration Lifecycle
- **Upgrades (e.g. ₹20 -> ₹40):** Effective immediately. Pro-rated difference for remaining days in month is billed on the next cycle.
- **Downgrades (e.g. ₹50 -> ₹30):** Takes effect at the end of the current billing cycle. Revision video archives exceeding new plan limits transition to read-only for 30 days before archival.
- **Trial Expiration:** If unpaid by Day 30, transitions to `TRIAL_EXPIRED`. Institution retains read-only access for a 60-day grace period.
- **Payment Failure on Active Subscription:** 7-day grace period with daily bursar alerts. On Day 8, transitions to `SUSPENDED` (parent/student portals display payment maintenance message).
