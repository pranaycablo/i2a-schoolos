# i2A SchoolOS — Persona-Based Usability & UX Audit

**Audit Scope:** In-depth evaluation of 12 real-user personas.  
**Database Target:** `i2a_schoolos_synthetic_test`  

---

## Persona A: Public Visitor & Admission Applicant

### Evaluation Criteria:
1. Is the value proposition of i2A SchoolOS immediately clear upon landing?
2. Are pricing, feature matrix, category blueprints, and demo access seamless?
3. Can a prospective parent or school applicant register on mobile without guidance?
4. Are form validation errors intuitive?
5. Is an immediate application number, tracking token, and next step provided?

### Forensic Findings:
- **Landing Page Clarity:** `src/components/public/pages/HomePage.tsx` provides high visual quality, clear typography, dynamic statistics, and interactive category tabs (`K-12 Schools`, `Colleges`, `Play Schools`, `Coaching Institutes`).
- **Pricing & Calculator:** `PricingPage.tsx` integrates the pricing quote calculator with volume discounts and GST breakdown. The sliders operate smoothly.
- **Trial Registration (`RegisterTrialPage.tsx`):**
  - Validation requires school name, admin name, email, and phone.
  - Submitting an application returns an `applicationNo` (e.g. `APP-2026-XXXX`) and `trackingToken`.
  - The `TRACK` tab allows tracking the status of submitted applications.
- **Friction Points:**
  - *Public vs School Admission Confusion:* A parent searching for "School Admission" on Google who arrives at the public SaaS site finds "Start Free Trial" for starting an ERP subscription, rather than a student admission form. The student admission form is located on the tenant-specific public website (`WebsiteBuilderModule.tsx`) or inside the admin simulator (`AdmissionWorkflowModule.tsx`).
  - *No Auto-Save on Registration Form:* If a user on a mobile device accidentally refreshes or switches apps, all 10 registration fields are wiped.
- **Persona Usability Score:** **82 / 100 (ACCEPTABLE)**

---

## Persona B: Platform Super Admin

### Test Account:
- **Email:** `superadmin@i2aschoolos.com`
- **Password:** `SuperAdmin@2026#`
- **Role:** `SUPER_ADMIN` (School ID: `ALL`)

### Forensic Findings:
- **Operator Console (`PlatformAdminModule.tsx` & `ApplicationVerificationConsole.tsx`):**
  - Displays total schools, active tenants, MRR summary, and verification queue.
  - Verification checklist modal allows reviewing board affiliation, student counts, and KYC documents.
  - One-click approval triggers tenant creation, database seeding, and sends verification notifications.
- **Friction Points:**
  - *Rejection Popup:* In `PlatformAdminModule.tsx` (line 69), rejecting an application uses the native browser `window.prompt()`. This lacks styling, doesn't validate minimum character length, and can be blocked by browsers.
  - *Missing Multi-Select / Bulk Actions:* Super admins cannot approve or suspend multiple institutions at once.
- **Persona Usability Score:** **78 / 100 (USABLE_WITH_FRICTION)**

---

## Persona C: Organization Director / Group Admin

### Test Account:
- **Email:** `director@dpsgroup.example.com`
- **Role:** `ORG_DIRECTOR` (Organization ID: `org-synth-dps`)

### Forensic Findings:
- **Institutional Tree (`InstitutionalHierarchyModule.tsx`):**
  - Supports 4-tier hierarchy: Organization $\to$ Institution $\to$ Branch $\to$ Campus.
  - Branch and Campus creation forms work properly.
  - MultiTenantSelector in `ShellHeader.tsx` lets directors switch between managed schools.
- **Friction Points:**
  - *Lack of Consolidated Multi-School Overview:* When the Org Director switches schools, they only see that single school's dashboard. There is no single "Group Executive Dashboard" showing aggregated revenue, total cross-campus student enrollment, or branch comparison metrics.
  - *Visual Context Alert:* When switching branches in `MultiTenantSelector.tsx`, the active branch name is shown only in a small header badge. It is easy for an administrator to mistake Branch B for Branch A and perform mutations on the wrong branch.
- **Persona Usability Score:** **64 / 100 (HIGH_FRICTION)**

---

## Persona D: Principal

### Test Account:
- **Email:** `principal@abcpublicschool.edu.in`
- **Password:** `Principal@2026#`
- **Role:** `PRINCIPAL` (School ID: `I2A-SCH-000001`)

### Forensic Findings:
- **Principal AI Dashboard (`PrincipalAIDashboardModule.tsx`):**
  - Executive KPI cards for Students, Fee Collection, and Admissions.
  - Natural language AI assistant generates PTM circulars, holiday notices, and lesson plan outlines.
  - Direct deep-links to Attendance, Admissions, and Fee Management.
- **Friction Points:**
  - *Daily Attendance Freeze Confirmation:* Locking attendance for the day is an irreversible operation that prevents teachers from making edits. In `AttendanceLeaveModule.tsx`, clicking "Lock Attendance" locks the day immediately without a double-confirmation modal explaining that unlocks require manual Super Admin overrides.
  - *Leave Anti-Self-Approval Message:* If a Principal submits a leave request for themselves, the backend correctly rejects self-approval, but the UI displays a generic red error rather than an informative note explaining that a School Director or Trustee must approve the Principal's leave.
- **Persona Usability Score:** **85 / 100 (FUNCTIONAL)**

---

## Persona E: School Admin & Front Office

### Test Account:
- **Email:** `admin@abcpublicschool.edu.in`
- **Password:** `Admin@2026#`
- **Role:** `ADMIN` (School ID: `I2A-SCH-000001`)

### Forensic Findings:
- **Admissions & Enrollment (`AdmissionWorkflowModule.tsx`):**
  - Step-by-step pipeline from parent submission to interview scheduling and final student provisioning.
  - Approved admissions automatically create a Student record and a linked Parent user profile.
- **Critical Workflow Blockers:**
  - *No Student Record Editing:* In `StudentManagementModule.tsx`, student cards only provide "360° Profile" and "Print I-Card". An admin cannot edit a student's contact number, address, roll number, or parent details.
  - *No Student Inactivation, Transfer, or Withdrawal:* If a student leaves the school, there is no action to mark them as `WITHDRAWN`, `TRANSFERRED`, or `ALUMNI`.
  - *No Class Promotion:* At the end of an academic session, there is no tool to promote Class VIII students to Class IX.
  - *No Bulk Excel/CSV Import:* Onboarding 1,000 existing students requires either running a database seed script or typing 1,000 individual forms by hand.
- **Persona Usability Score:** **52 / 100 (BLOCKED_WORKFLOW)**

---

## Persona F: Accountant / Finance Staff

### Test Account:
- **Email:** `alok.nath@abcpublicschool.edu.in`
- **Password:** `Accountant@2026#`
- **Role:** `ACCOUNTANT` (School ID: `I2A-SCH-000001`)

### Forensic Findings:
- **Fee Management Desk (`FeeManagementModule.tsx`):**
  - Displays fee categories (Tuition, Computer, Transport, Annual charges).
  - Generates printable receipts with QR codes and digital signature blocks.
  - Double-entry ledger integration posts fee collections to `expenses` collection.
- **Critical Financial UX Flaws:**
  - *Unawaited Asynchronous Collection:* In `src/context/SchoolContext.tsx` (line 1286), the receipt collection API call is unawaited. If the backend fails or rejects the transaction, the UI still displays a success modal and issues a local receipt.
  - *No Partial Payments or Instalments:* Real-world parents rarely pay the entire annual tuition in one payment. The UI does not provide an "Amount to Pay" input field; it forces `paidAmount = totalAmount` and `balanceAmount = 0`.
  - *No Fee Concession / Sibling Discount:* The UI lacks input fields for discounts or late fine waivers, even though the backend schema supports them.
  - *No Export to Excel / Tally:* Accountants cannot export daily cashbook or fee collections to CSV/Excel for external auditing.
- **Persona Usability Score:** **58 / 100 (UNSAFE_FINANCIAL_UX)**

---

## Persona G: Teacher

### Test Account:
- **Email:** `sunita.mishra@abcpublicschool.edu.in`
- **Password:** `Teacher@2026#`
- **Role:** `TEACHER` (School ID: `I2A-SCH-000001`, Assigned: `Class VIII`, `Class X`)

### Forensic Findings:
- **Teacher Workspace:**
  - Access to Student SIS, Homework & LMS, Attendance & Leave, and Timetable.
  - Can create homework assignments and mark student submissions.
- **Friction Points:**
  - *Attendance Refresh Bug:* Marking student attendance in `AttendanceLeaveModule.tsx` updates an in-memory service object. If the teacher presses F5 (browser refresh), `syncFromBackend` is never called on mount, and the roster reverts to default state.
  - *Hardcoded Student ID in Submissions:* In `HomeworkDigitalLearningModule.tsx`, student submissions reference hardcoded `'std-101'`. The teacher cannot cycle through different students in the class without manual state tampering.
- **Persona Usability Score:** **68 / 100 (HIGH_FRICTION)**

---

## Persona H: Staff & HR

### Test Account:
- **Email:** `office@abcpublicschool.edu.in`
- **Password:** `Staff@2026#`
- **Role:** `STAFF` (School ID: `I2A-SCH-000001`)

### Forensic Findings:
- **Workforce Management (`StaffWorkforceModule.tsx`):**
  - Generates atomic employee IDs (`EMP-YYYY-NNNN`).
  - Supports staff directory, department filtering, and leave approval desk.
  - PII masking protects bank account numbers and salary details.
- **Friction Points:**
  - *No Payslip Generation / Download:* While `PayrollExpenseModule.tsx` calculates salaries, staff members have no button to view or download their monthly payslip (PDF).
  - *Leave Balance Ledger Missing:* When applying for casual or medical leave, the remaining leave balance is not shown on the leave request modal.
- **Persona Usability Score:** **74 / 100 (USABLE_WITH_FRICTION)**

---

## Persona I: Transport Manager

### Test Account:
- **Email:** `driver.manoj@abcpublicschool.edu.in`
- **Password:** `Transport@2026#`
- **Role:** `TRANSPORT` (School ID: `I2A-SCH-000001`)

### Forensic Findings:
- **Fleet Management (`LibraryTransportInventoryModule.tsx`):**
  - Displays bus routes, stops, vehicle numbers, and student stop assignments.
  - Tracks vehicle capacity and prevents overbooking beyond seat limits.
- **Friction Points:**
  - *Marketing vs Reality Disconnect:* Marketing banners on the public site advertise "Real-Time Bus GPS Tracking & Live Speed Geofencing". Inside the module, a yellow alert banner explicitly states: *"Live GPS hardware tracking is marked NOT_IMPLEMENTED as physical AIS-140 GPS telematics devices and vehicle tracker APIs are not integrated in this pure frontend instance."* This causes immediate confusion for transport supervisors.
  - *Driver App View Missing:* Manoj (the driver) has no simplified mobile dashboard showing just his passenger checklist for pickup/drop.
- **Persona Usability Score:** **60 / 100 (CONFUSING_CLAIMS)**

---

## Persona J: Parent

### Test Account:
- **Email:** `sanjay.kumar@gmail.com`
- **Password:** `Parent@2026#`
- **Role:** `PARENT` (Linked Student ID: `std-101`)

### Forensic Findings:
- **Critical UX Breakdown:**
  - *Default Landing Page:* When Sanjay logs in, he is directed to `PrincipalAIDashboardModule.tsx`! He sees total school fee collections (₹1.8 Crore), school-wide admissions pipelines, and dropout risk alerts instead of his son Rahul's attendance and dues.
  - *Hardcoded Child Context:* In multiple sub-modules (`HomeworkDigitalLearningModule.tsx`, `ExaminationResultModule.tsx`), child mapping is hardcoded to `'std-101'`.
  - *Multi-Child Switcher Missing:* For parents with two or more children in the same school (e.g. Class IV and Class VIII), there is no child dropdown switcher in the header to switch between children.
- **Persona Usability Score:** **42 / 100 (CRITICAL_UX_FAILURE)**

---

## Persona K: Student

### Test Account:
- **Email:** `rahul.kumar@abcpublicschool.edu.in`
- **Password:** `Student@2026#`
- **Role:** `STUDENT` (School ID: `I2A-SCH-000001`, Student ID: `std-101`)

### Forensic Findings:
- **Critical UX Breakdown:**
  - *Default Landing Page:* Rahul lands on the Principal AI Assistant dashboard with teacher administrative tools.
  - *Online Exam Simulator:* In `ExaminationModule.tsx` (line 30), `currentStudent` is hardcoded as `students[0]`. If another student logs in, their test answers are recorded under `students[0]`.
  - *Missing Study Schedule & Today's Classes Card:* The student dashboard lacks a "Today's Schedule & Pending Homework" widget.
- **Persona Usability Score:** **46 / 100 (CRITICAL_UX_FAILURE)**

---

## Persona L: Subscription Customer

### Persona Details:
- **Role:** School Trustee / Management evaluating or managing ERP billing.
- **Module:** `SubscriptionBillingModule.tsx`

### Forensic Findings:
- **Billing Overview:**
  - Displays plan tier (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`), student volume limits, and module entitlements.
  - Dynamic cost estimator calculates total costs based on enrolled student groups.
- **Friction Points:**
  - *Gateway Invoicing Not Live:* Payment gateway for SaaS subscription renewals is simulated. Clicking "Renew Plan" does not launch a live payment modal unless credentials are provided.
  - *Proration Explanations Missing:* Upgrading mid-cycle does not show a proration calculation for remaining days in the billing cycle.
- **Persona Usability Score:** **80 / 100 (USABLE_WITH_FRICTION)**
