# i2A SchoolOS — Screen & Route Interaction Inventory

**Inventory Scope:** Comprehensive catalog of all screens, modules, modals, forms, and primary interaction elements.

---

## 1. Public SaaS Portal Screens

| # | Screen Name | Component File | Route / Mode | Primary Purpose | Status | Loading & Empty States |
|---|---|---|---|---|:---:|:---:|
| 1 | **Home / Hero** | `HomePage.tsx` | `PUBLIC_SAAS` (Home) | Product overview, statistics, category selector | ✅ **Working** | N/A (Static + Dynamic Data) |
| 2 | **Category Detail** | `CategoryDetailPage.tsx` | `PUBLIC_SAAS` (slug) | Blueprint details for specific educational categories | ✅ **Working** | Empty state for invalid slug |
| 3 | **Pricing Calculator**| `PricingPage.tsx` | `PUBLIC_SAAS` (Pricing) | Tier comparison, student count slider, GST quote | ✅ **Working** | Live reactive calculations |
| 4 | **Trial Registration**| `RegisterTrialPage.tsx` | `PUBLIC_SAAS` (Register) | New institution onboarding & application tracking | ✅ **Working** | Spinner on submit, success card |
| 5 | **Contact & Demo** | `ContactPage.tsx` | `PUBLIC_SAAS` (Contact) | Inquiry form, sales consultation, FAQ links | ✅ **Working** | Validation alerts, reset on submit |
| 6 | **Feature Matrix** | `FeaturesPage.tsx` | `PUBLIC_SAAS` (Features) | Deep dive into 25 operational modules | ✅ **Working** | Categorized accordion tabs |
| 7 | **Terms & Privacy** | `TermsPage.tsx`, `PrivacyPolicyPage.tsx` | `PUBLIC_SAAS` (Legal) | GDPR/DPDP compliance & terms of service | ✅ **Working** | Static legal text |

---

## 2. Authentication & Platform Administration Screens

| # | Screen Name | Component File | Route / Mode | Primary Purpose | Status | Loading & Empty States |
|---|---|---|---|---|:---:|:---:|
| 8 | **Login Portal** | `LoginPage.tsx` | `LOGIN` | User sign-in with school & role selection | ⚠️ **P0 Issue** (`SEC-UX-001`) | Spinner on submit; silent fallback on 401 |
| 9 | **Platform Admin** | `PlatformAdminModule.tsx` | `PLATFORM_ADMIN` | Global school list, MRR metrics, suspension toggle | ⚠️ **Partial** | Search filter; prompt() on reject |
| 10 | **Verification Console** | `ApplicationVerificationConsole.tsx` | Sub-modal in Admin | KYC document checklist, approval, and rejection modal | ✅ **Working** | Filter tabs, audit history |

---

## 3. Core School Operations & Academic Modules

| # | Module ID | Screen Name | Component File Path | Primary Roles | Operational Status |
|---|---|---|---|---|:---:|
| 11 | `principal_dashboard` | **Principal AI Dashboard** | `PrincipalAIDashboardModule.tsx` | Principal, Admin | ⚠️ **Misconfigured for Parents/Students** |
| 12 | `institutional_hierarchy` | **Institutional Hierarchy** | `InstitutionalHierarchyModule.tsx` | Org Director, Principal | ✅ **Working** (Tree, Branches, Campuses) |
| 13 | `school_setup` | **School Setup Wizard** | `SchoolSetupModule.tsx` | Admin, Principal | ✅ **Working** (Logo, Palette, Domain) |
| 14 | `student_management` | **Student SIS 360°** | `StudentManagementModule.tsx` | Admin, Teacher, Staff | ⚠️ **Missing Edit, Promote & Bulk Import** |
| 15 | `admission_workflow` | **Admission Pipeline** | `AdmissionWorkflowModule.tsx` | Principal, Admin, Staff | ⚠️ **Missing Rejection & Waitlist Actions** |
| 16 | `digital_books_ai` | **Digital Library & OCR** | `DigitalBooksAIQuestionBankModule.tsx` | Teacher, Student, Principal | ✅ **Working** (NCERT Reader, AI Drafts) |
| 17 | `homework_learning` | **Homework & LMS** | `HomeworkDigitalLearningModule.tsx` | Teacher, Student, Parent | ⚠️ **Hardcoded `std-101` in local session** |
| 18 | `examination_ai` | **Examinations AI** | `ExaminationModule.tsx` | Teacher, Student, Principal | ⚠️ **Online exam hardcoded to `students[0]`** |
| 19 | `examination_result_engine`| **CCE Result Engine** | `ExaminationResultModule.tsx` | Teacher, Principal | ⚠️ **Hardcoded `std-101` in local session** |
| 20 | `report_card_certs` | **Report Cards & Certs** | `ReportCardCertificateModule.tsx` | Teacher, Parent, Student | ✅ **Working** (Print-ready PDF / CSS) |
| 21 | `attendance_timetable` | **Attendance & Leave** | `AttendanceLeaveModule.tsx` | Teacher, Staff, Principal | ⚠️ **In-memory state resets on browser refresh** |
| 22 | `timetable_engine` | **Timetable Engine** | `TimetableModule.tsx` | Admin, Teacher, Principal | ✅ **Working** (Conflict detection active) |
| 23 | `payroll_expenses` | **Payroll & Expenses** | `PayrollExpenseModule.tsx` | Principal, Accountant | ⚠️ **Missing payslip PDF download** |
| 24 | `staff_workforce` | **Staff Workforce** | `StaffWorkforceModule.tsx` | Principal, Admin | ✅ **Working** (Atomic IDs, PII Redaction) |
| 25 | `library_transport` | **Fleet & Transport** | `LibraryTransportInventoryModule.tsx` | Transport, Parent, Staff | ⚠️ **Live GPS marked NOT_IMPLEMENTED** |
| 26 | `fee_management` | **Fee Management Desk**| `FeeManagementModule.tsx` | Accountant, Principal, Parent | ⚠️ **Unawaited async collect; no partial payments** |
| 27 | `school_marketplace` | **Marketplace Store** | `SchoolMarketplaceModule.tsx` | Parent, Student, Staff | ✅ **Working** (Cart checkout & order tracking) |
| 28 | `subscription_billing`| **SaaS Subscription** | `SubscriptionBillingModule.tsx` | Principal, Trustee | ⚠️ **Simulated gateway renewal** |
| 29 | `website_builder` | **Website Builder** | `WebsiteBuilderModule.tsx` | Admin, Principal | ✅ **Working** (Subdomain / custom domain) |
| 30 | `audit_trail` | **Audit Trail System** | `AuditTrailModule.tsx` | Super Admin, Principal | ✅ **Working** (Immutable log display) |
| 31 | `design_system` | **Design System Showcase**| `DesignSystemShowcase.tsx` | Developer / Auditor | ✅ **Working** (Token verification) |

---

## 4. Modal Dialogs & Interaction Inspection

| Modal Component | Triggering Screen | Purpose | Destructive? | Confirmation Safeguard |
|---|---|---|:---:|:---:|
| **Add Student Modal** | `StudentManagementModule` | Enroll student directly | No | Form validation on required fields |
| **Student 360 Profile Modal** | `StudentManagementModule` | View student bio, parents, and fee history | No | Close on `X` or backdrop click |
| **Print I-Card Modal** | `StudentManagementModule` | Branded student ID card with barcode | No | Print window integration |
| **Add Fee Structure Modal** | `FeeManagementModule` | Define new tuition or transport fee | No | Form validation |
| **Print Receipt Modal** | `FeeManagementModule` | Official fee receipt with QR code | No | Print window integration |
| **Add Question Modal** | `DigitalBooksAIQuestionBank` | Add MCQ/Subjective question to bank | No | Form validation |
| **Add Branch / Campus Modal**| `InstitutionalHierarchy` | Create new branch node in DAG | No | Form validation & capacity checks |
| **School Rejection Alert** | `PlatformAdminModule` | Reject institution trial application | Yes | ⚠️ **Browser `prompt()`, no modal** |
| **Attendance Freeze Alert** | `AttendanceLeaveModule` | Lock daily attendance permanently | Yes | ⚠️ **No confirmation modal; instant lock** |
