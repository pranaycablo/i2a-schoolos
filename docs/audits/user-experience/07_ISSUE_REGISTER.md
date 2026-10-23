# i2A SchoolOS — Master Real-User Issue Register

**Register Scope:** Complete catalog of all verified usability defects, functional breakdowns, workflow disconnections, and UI/UX vulnerabilities.

---

### Issue Index

| Issue ID | Category | Title | Severity | Affected Persona | File Path |
|---|---|---|:---:|---|---|
| `SEC-UX-001` | Security / Auth | Silent fallback login on invalid password | **Critical (P0)** | All Users | `src/pages/LoginPage.tsx` |
| `UX-SEC-002` | Security / RBAC | Role switching menu exposed in production profile menu | **Critical (P0)** | Parents, Students | `src/components/shell/ProfileSessionMenu.tsx` |
| `FIN-FLOW-003` | Finance / Integrity | Unawaited fire-and-forget fee collection API call | **Critical (P0)** | Accountant, Principal | `src/context/SchoolContext.tsx` |
| `FLOW-004` | Architecture / State | Hardcoded `std-101` and mock user sessions in sub-modules | **Critical (P0)** | Parents, Students, Teachers | `HomeworkDigitalLearningModule.tsx`, `ExaminationResultModule.tsx` |
| `UX-ARCH-005` | UX / Navigation | Parents and Students land on Principal AI Dashboard | **High (P1)** | Parents, Students | `src/components/shell/ShellSidebar.tsx`, `AppShell.tsx` |
| `FUNC-006` | Functional / SIS | Inability to edit, promote, or withdraw student records | **High (P1)** | School Admin, Front Office | `src/components/modules/StudentManagementModule.tsx` |
| `FLOW-007` | State / Data Loss | Attendance marked by teacher lost from UI on page refresh | **High (P1)** | Teacher, Principal | `src/components/modules/AttendanceLeaveModule.tsx` |
| `FLOW-008` | Workflow / Pipeline | Admission pipeline lacks rejection and waitlist paths | **High (P1)** | School Admin, Principal | `src/components/modules/AdmissionWorkflowModule.tsx` |
| `FIN-009` | Finance / Billing | No partial fee payments, concessions, or instalment tracking | **High (P1)** | Accountant, Parent | `src/components/modules/FeeManagementModule.tsx` |
| `UX-010` | UX / Mobile | Browser `prompt()` used for application rejection | **Medium (P2)** | Super Admin | `src/components/modules/PlatformAdminModule.tsx` |
| `A11Y-011` | Accessibility | Icon buttons missing `aria-label` and focus rings | **Medium (P2)** | Keyboard / Screen Reader Users | `src/components/shell/ShellHeader.tsx` |
| `UX-012` | UX / Mobile | 7x6 Timetable grid unusable on mobile screens without zoom | **Medium (P2)** | Teacher, Student | `src/components/modules/TimetableModule.tsx` |
| `I18N-013` | Localization | Incomplete Hindi translations; hardcoded Hindi alerts | **Medium (P2)** | English & Bilingual Users | `PlatformAdminModule.tsx`, `translations.ts` |
| `HR-014` | Staff / Payroll | Missing downloadable payslip PDF for employees | **Low (P3)** | Staff, Teachers | `src/components/modules/PayrollExpenseModule.tsx` |
| `OPS-015` | Transport | Marketing claims real-time GPS while UI banners "NOT_IMPLEMENTED" | **Low (P3)** | Transport Manager, Parents | `src/components/modules/LibraryTransportInventoryModule.tsx` |

---

## Detailed Issue Breakdown

### `SEC-UX-001`: Silent Fallback Login on Invalid Password
- **Affected Persona:** All Roles
- **Component File:** `src/pages/LoginPage.tsx` (lines 69-84)
- **Reproduction Steps:**
  1. Open Login page.
  2. Enter valid email `principal@abcpublicschool.edu.in`.
  3. Enter an intentionally wrong password `WrongPassword123!`.
  4. Click "Sign In to School Portal".
- **Expected Behavior:** Server returns HTTP 401 Unauthorized; UI displays red alert: "Invalid email or password". User remains on login screen.
- **Observed Behavior:** The client code enters the `else` block: `loginToSchool(selectedSchoolId, selectedRole); onSuccess?.();`. The user is silently logged in with local mock state!
- **Severity:** **Critical (P0)**
- **Root Cause:** Developer demo fallback intended for offline mode was left active without checking if the server responded with an explicit 401.
- **Recommended Fix:** Only trigger offline/demo fallback if `res.status === 0` (network offline). If `res.status === 401` or `res.status === 400`, set `errorMessage = res.error || 'Invalid credentials'`.

---

### `UX-SEC-002`: Role Switching Menu Exposed in Production Profile Menu
- **Affected Persona:** Parents, Students, Staff
- **Component File:** `src/components/shell/ProfileSessionMenu.tsx` (lines 168-190)
- **Reproduction Steps:**
  1. Log in as a Student (`rahul.kumar@abcpublicschool.edu.in`).
  2. Click the user avatar in the top-right header.
  3. See "Switch Persona (Testing)" with buttons for `Principal`, `Admin`, `Teacher`, `Accountant`.
  4. Click "Principal".
- **Expected Behavior:** Ordinary users cannot switch roles in production. The role switcher should only appear in development environments (`import.meta.env.DEV === true`).
- **Observed Behavior:** Any student or parent can click "Principal" and immediately unlock the Principal sidebar, school configuration, and financial dashboards.
- **Severity:** **Critical (P0)**
- **Recommended Fix:** Wrap the "Switch Persona" block with `{import.meta.env.DEV && (...)}` or restrict it strictly to `SUPER_ADMIN` in debug mode.

---

### `FIN-FLOW-003`: Unawaited Fire-and-Forget Fee Collection API Call
- **Affected Persona:** Accountant, Principal
- **Component File:** `src/context/SchoolContext.tsx` (lines 1280-1316)
- **Reproduction Steps:**
  1. Open Fee Collect Desk.
  2. Click "Collect Fee".
  3. If backend returns an error (or user is offline), observe UI behavior.
- **Expected Behavior:** Client awaits `feeApi.receipts.collect(...)`. If successful, displays receipt. If failed, displays error banner and DOES NOT issue a receipt.
- **Observed Behavior:** `feeApi.receipts.collect` is executed with unawaited `.catch(...)`. An optimistic receipt is generated locally immediately.
- **Severity:** **Critical (P0)**
- **Recommended Fix:** Make `processFeePayment` an async function: `const res = await feeApi.receipts.collect(...)`. Only update `feeReceipts` state if `res.ok === true`.

---

### `FLOW-004`: Hardcoded `std-101` and Mock Sessions in Sub-Modules
- **Affected Persona:** Parents, Students, Teachers
- **Component Files:**
  - `src/components/modules/HomeworkDigitalLearningModule.tsx` (lines 44-51)
  - `src/components/modules/ExaminationResultModule.tsx` (lines 48-55)
  - `src/components/modules/LibraryTransportInventoryModule.tsx` (lines 36-42)
- **Reproduction Steps:**
  1. Log in as Parent `sanjay.kumar@gmail.com` or another student.
  2. Open Homework & LMS module.
  3. View submitted homework.
- **Expected Behavior:** The module uses the logged-in user's authentic `studentId` or `childrenIds` from `SchoolContext`.
- **Observed Behavior:** Local `session` constant hardcodes:
  `id: currentRole === 'STUDENT' ? 'std-101' : currentRole === 'TEACHER' ? 'stf-1' : 'user-active'`.
- **Severity:** **Critical (P0)**
- **Recommended Fix:** Extract current user profile from `SchoolContext` and inject authentic user credentials into the service calls.

---

### `UX-ARCH-005`: Parents & Students Land on Principal AI Dashboard
- **Affected Persona:** Parents, Students
- **Component Files:** `src/components/shell/ShellSidebar.tsx` (line 62), `src/components/shell/AppShell.tsx` (line 39)
- **Reproduction Steps:**
  1. Log in as Parent or Student.
  2. Observe default landing page.
- **Expected Behavior:** Parent lands on "Parent Portal Home" (Child attendance, fee dues, notices). Student lands on "Student Portal Home" (Today's classes, homework, exam timetable).
- **Observed Behavior:** Default route is `principal_dashboard`, showing Principal AI Circular Generator, school-wide financial totals, and administrative dropout risk metrics.
- **Severity:** **High (P1)**
- **Recommended Fix:** Create dedicated `ParentDashboardView.tsx` and `StudentDashboardView.tsx` and route based on `currentRole`.

---

### `FUNC-006`: Inability to Edit, Promote, or Withdraw Student Records
- **Affected Persona:** School Admin, Front Office
- **Component File:** `src/components/modules/StudentManagementModule.tsx`
- **Reproduction Steps:**
  1. Open Student SIS.
  2. Click on a student.
  3. Try to change their section or edit phone number.
- **Expected Behavior:** "Edit Student" button opens a form allowing updates to address, phone number, section, or status (`ACTIVE`, `WITHDRAWN`, `TRANSFERRED`).
- **Observed Behavior:** Modal is strictly read-only.
- **Severity:** **High (P1)**
- **Recommended Fix:** Add `EditStudentModal` and wire to `studentsApi.update(studentId, data)`.

---

### `FLOW-007`: Attendance Marked by Teacher Lost from UI on Page Refresh
- **Affected Persona:** Teacher, Principal
- **Component File:** `src/components/modules/AttendanceLeaveModule.tsx` (lines 73-100)
- **Reproduction Steps:**
  1. Teacher marks attendance for Class VIII-A for today's date.
  2. Clicks "Submit & Sync Attendance".
  3. Presses browser refresh (F5).
- **Expected Behavior:** Marked attendance remains visible on the screen after reload.
- **Observed Behavior:** The component initializes from `AttendanceLeaveService.getInstance()`, which re-instantiates default mock records. `syncFromBackend` is never called on mount.
- **Severity:** **High (P1)**
- **Recommended Fix:** Call `attendanceService.syncFromBackend(schoolId, selectedClass, selectedSection, selectedDate)` inside a `useEffect` on component mount and date/class change.

---

### `FLOW-008`: Admission Pipeline Lacks Rejection & Waitlist Paths
- **Affected Persona:** School Admin, Principal
- **Component File:** `src/components/modules/AdmissionWorkflowModule.tsx`
- **Reproduction Steps:**
  1. View submitted student admission application.
  2. Attempt to reject the application or mark as waitlisted.
- **Expected Behavior:** Principal has buttons for "Schedule Interview", "Approve & Enroll", "Reject Application", and "Put on Waitlist".
- **Observed Behavior:** Only forward transitions exist (`SUBMITTED` $\to$ `INTERVIEW_SCHEDULED` $\to$ `ENROLLED`).
- **Severity:** **High (P1)**
- **Recommended Fix:** Add "Reject" and "Waitlist" buttons with reason modals in `AdmissionWorkflowModule.tsx`.

---

### `FIN-009`: No Partial Fee Payments, Concessions, or Instalment Tracking
- **Affected Persona:** Accountant, Parent
- **Component File:** `src/components/modules/FeeManagementModule.tsx` (lines 54-68)
- **Reproduction Steps:**
  1. Student has ₹12,000 annual fee.
  2. Parent wants to pay ₹4,000 for Quarter 1.
  3. Accountant tries to enter ₹4,000 in collect fee desk.
- **Expected Behavior:** Accountant can enter amount collected (₹4,000), leaving balance (₹8,000) for future payment.
- **Observed Behavior:** UI forces total payment of all selected items: `paidAmount = totalAmount` and `balanceAmount = 0`.
- **Severity:** **High (P1)**
- **Recommended Fix:** Add `amountCollected`, `discountAmount`, and `fineAmount` input fields in the fee collection desk.

---

### `UX-010`: Browser `prompt()` Used for Application Rejection
- **Affected Persona:** Super Admin
- **Component File:** `src/components/modules/PlatformAdminModule.tsx` (line 69)
- **Reproduction Steps:**
  1. Super Admin clicks "Reject" on school trial application.
  2. Browser shows native OS dialog box.
- **Expected Behavior:** Styled accessible modal with pre-defined rejection reason codes (`DOCS_INCOMPLETE`, `INVALID_AFFILIATION`, etc.).
- **Observed Behavior:** Native `window.prompt()` executes.
- **Severity:** **Medium (P2)**
- **Recommended Fix:** Replace `window.prompt()` with the already existing `showRejectModal` inside `ApplicationVerificationConsole.tsx`.
