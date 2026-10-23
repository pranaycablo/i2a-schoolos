# i2A SchoolOS — Functional & Product Gap Analysis

**Scope:** Analysis of missing operational capabilities required by commercial educational institutions compared to standard ERP benchmarks.

---

## 1. Classification Methodology
- **`REQUIRED_GAP` (Mandatory):** Core feature without which daily school administration cannot function.
- **`HIGH_VALUE_IMPROVEMENT` (Recommended):** Feature that significantly enhances operational efficiency and user satisfaction.
- **`OPTIONAL_FUTURE_FEATURE` (Enhancement):** Advanced capability that can be delivered in later roadmap phases.

---

## 2. Comprehensive Gap Inventory

| Feature Area | Gap Description | Current Status in Codebase | Classification |
|---|---|---|:---:|
| **1. Student Record Editing** | Admins cannot edit student details (mobile, address, section, roll number). | Modal is strictly view-only | 🔴 **`REQUIRED_GAP`** |
| **2. Class Promotion & Rollover** | No batch promotion engine to advance students to the next grade at end of year. | Missing from UI and API | 🔴 **`REQUIRED_GAP`** |
| **3. Student Withdrawal / Transfer** | No Transfer Certificate (TC) generation workflow that marks a student as `WITHDRAWN` or `ALUMNI`. | Missing from SIS | 🔴 **`REQUIRED_GAP`** |
| **4. Bulk Excel/CSV Import** | No spreadsheet importer for batch student or staff onboarding. | Only manual single-form entry | 🔴 **`REQUIRED_GAP`** |
| **5. Partial Fee Payments & Instalments** | Cannot accept partial fee amounts (e.g. quarterly instalments); forces 100% full payment. | Hardcoded `balanceAmount: 0` | 🔴 **`REQUIRED_GAP`** |
| **6. Admission Rejection / Waitlist** | Admissions can only be approved; no rejection or waitlist option exists. | Pipeline only advances to enrolled | 🔴 **`REQUIRED_GAP`** |
| **7. Dedicated Parent & Student Portals** | Parents and Students land on the Principal AI dashboard with school-wide financial totals. | Misrouted in AppShell | 🔴 **`REQUIRED_GAP`** |
| **8. Multi-Child Parent Switcher** | Parents with multiple children cannot toggle context between their wards. | Hardcoded to single student | 🔴 **`REQUIRED_GAP`** |
| **9. Fee Concessions & Sibling Discounts** | Cannot enter discretionary fee discounts or scholarship waivers in the fee collect UI. | Missing from collect desk | 🟡 **`HIGH_VALUE_IMPROVEMENT`** |
| **10. Export to Excel / Tally (Finance)** | Cannot export daily fee collection registers or expenses to CSV/Excel for accounting. | No export button | 🟡 **`HIGH_VALUE_IMPROVEMENT`** |
| **11. Staff Payslip Download (PDF)** | Staff cannot view or download their monthly salary slip as a PDF. | Payroll calculates but no slip | 🟡 **`HIGH_VALUE_IMPROVEMENT`** |
| **12. Teacher Substitution Manager** | Finding a substitute for an absent teacher is not connected to automatic timetable reassignment. | Service exists, UI disconnected | 🟡 **`HIGH_VALUE_IMPROVEMENT`** |
| **13. School Holiday Calendar Integration** | Timetable and attendance modules do not respect predefined national/school holiday dates. | No shared holiday master | 🟡 **`HIGH_VALUE_IMPROVEMENT`** |
| **14. Multi-School Consolidated Dashboard** | Org Directors cannot view group-wide financial and enrollment comparisons across branches. | Branch switching only | 🟡 **`HIGH_VALUE_IMPROVEMENT`** |
| **15. Real-Time Hardware GPS Telematics** | Live bus tracking is not integrated with physical AIS-140 GPS devices. | Marked `NOT_IMPLEMENTED` | 🟢 **`OPTIONAL_FUTURE_FEATURE`** |
| **16. AI OCR Answer Sheet Scanner** | Automatic handwritten paper evaluation via optical camera is conceptual. | Mocked in LMS service | 🟢 **`OPTIONAL_FUTURE_FEATURE`** |
| **17. Biometric Hardware Device Gateway** | Fingerprint/Face recognition biometric machines cannot push attendance directly via webhook. | Ingest API defined, no agent | 🟢 **`OPTIONAL_FUTURE_FEATURE`** |
| **18. In-App Help Center & Ticket Desk** | No built-in support ticket system for parents or teachers to report technical issues. | Static FAQ page only | 🟢 **`OPTIONAL_FUTURE_FEATURE`** |

---

## 3. Deep Analysis of Top 3 Missing Workflows

### 3.1 Academic Year Rollover & Batch Class Promotion (`REQUIRED_GAP`)
- **Real-World Reality:** Every year in March/April, an Indian school must promote ~1,200 students from Class I $\to$ Class II, Class II $\to$ Class III, etc. Failed or retained students stay back; Class XII students graduate to Alumni status.
- **Current System Gap:** Currently, `students` collection has static `className` values. There is no batch promotion wizard. Changing 1,200 classes would require manual database scripts.
- **Recommended Architecture:** Create `POST /api/students/promotions/batch` with a UI step-by-step wizard where teachers confirm passing marks, preview next-year rosters, and commit rollover with rollback capability.

### 3.2 Partial Fee Payments & Instalment Tracking (`REQUIRED_GAP`)
- **Real-World Reality:** Tuition fees in Indian private schools are collected in 3 or 4 quarterly instalments (Q1, Q2, Q3, Q4). A parent often deposits ₹8,000 against a total annual fee of ₹32,000.
- **Current System Gap:** The Collect Fee desk forces full collection of all checked fee items. An accountant cannot enter an arbitrary collected amount and leave the remaining balance as outstanding dues.
- **Recommended Architecture:** Add an "Amount Collected" input field in `FeeManagementModule.tsx`. Calculate `balanceAmount = netPayable - amountCollected`. Create an invoice record with status `PARTIALLY_PAID` and carry forward the outstanding balance.

### 3.3 Dedicated Role-Tailored Landing Portals (`REQUIRED_GAP`)
- **Real-World Reality:** When a parent logs into the school mobile app, they want to immediately see: (1) Is my child present today? (2) Any fee dues pending? (3) Any homework given today? (4) Today's school notice.
- **Current System Gap:** Parents land on `PrincipalAIDashboardModule`, which presents high-level management metrics and administrative tools.
- **Recommended Architecture:** Create `ParentPortalHome.tsx` and `StudentPortalHome.tsx`. In `AppShell.tsx`, route `currentRole === 'PARENT'` to `ParentPortalHome` and `currentRole === 'STUDENT'` to `StudentPortalHome`.
