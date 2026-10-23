# i2A SchoolOS — Master Role, Route and Permission Matrix

**Audit Date:** 2026-10-22  
**Target Architecture:** Multi-Tenant Role-Based Access Control (RBAC)  
**Verification Scope:** All 13 Mandated Roles, Route Guards, API Endpoints, and Scoping Boundaries  

---

## 1. Role Inventory & Implementation Status

| # | Role Identifier | Canonical Name | Implementation Status | Scope Level | Primary Landing Module |
|---|-----------------|----------------|-----------------------|-------------|------------------------|
| 1 | `SUPER_ADMIN` | Platform Super Administrator | **IMPLEMENTED** | Multi-Tenant Platform | `PlatformAdminModule` (`PLATFORM_ADMIN`) |
| 2 | `ORG_DIRECTOR` | Organization / Group Trustee | **IMPLEMENTED** | Multi-School Group | `InstitutionalHierarchyModule` |
| 3 | `ADMIN` / `SCHOOL_OWNER` | School Owner / General Admin | **IMPLEMENTED** | Single Institution | `PrincipalAIDashboardModule` |
| 4 | `PRINCIPAL` | Principal / Academic Director | **IMPLEMENTED** | Single Institution | `PrincipalAIDashboardModule` |
| 5 | `BRANCH_ADMIN` | Branch / Campus Administrator | **IMPLEMENTED** | Single Branch Campus | `PrincipalAIDashboardModule` (Branch-Scoped) |
| 6 | `HR_MANAGER` / `HR` | HR & Workforce Administrator | **IMPLEMENTED** | Institution / Branch | `StaffWorkforceModule` |
| 7 | `TEACHER` | Faculty / Subject Teacher | **IMPLEMENTED** | Assigned Classes/Subjects | `AttendanceLeaveModule` / `HomeworkDigitalLearningModule` |
| 8 | `ACCOUNTANT` | Fee & Finance Cashier | **IMPLEMENTED** | Institution Financial Desk | `FeeManagementModule` |
| 9 | `LIBRARIAN` | Library Resource Manager | **PARTIAL** | Campus Library | `LibraryTransportInventoryModule` (Mapped under `STAFF`) |
| 10 | `TRANSPORT` / `TRANSPORT_MGR` | Fleet & Transport Supervisor | **IMPLEMENTED** | Campus Fleet | `LibraryTransportInventoryModule` |
| 11 | `STAFF` | General Administrative Staff | **IMPLEMENTED** | Campus Operations | `AttendanceLeaveModule` / `StudentManagementModule` |
| 12 | `STUDENT` | Enrolled Learner | **IMPLEMENTED** | Self Student Record Only | `StudentPortalModule` |
| 13 | `PARENT` | Parent / Legal Guardian | **IMPLEMENTED** | Linked Children Records Only | `ParentPortalModule` |

---

## 2. Granular Role-by-Role Route & Permission Matrix

### 1. Platform Super Admin (`SUPER_ADMIN`)
- **Login Route:** `/login` (Decoupled auth; verified role in DB).
- **Landing View:** `PLATFORM_ADMIN` (renders `PlatformAdminModule`).
- **Permitted Modules:** `PlatformAdminModule`, `InstitutionHierarchyModule`, `SchoolSetupModule`, `SubscriptionBillingModule`.
- **CRUD Operations:** Create school tenants, register branches, configure plan tiers, view global statistics, invite tenant administrators.
- **Backend APIs:** `/api/tenants`, `/api/organizations`, `/api/hierarchy`, `/api/subscription`.
- **Tenant Scope:** Global (unconstrained multi-tenant access).
- **Error / Empty State:** Zero schools renders "No Registered Schools" with onboarding call-to-action.

### 2. Organization / Group Admin (`ORG_DIRECTOR`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `institutional_hierarchy`.
- **Permitted Modules:** `InstitutionalHierarchyModule`, `PrincipalAIDashboardModule`, `AuditTrailModule`.
- **CRUD Operations:** Create branches, reassign institutional parents, view aggregated group metrics, provision school administrators.
- **Backend APIs:** `/api/hierarchy`, `/api/staff`, `/api/tenants/:id/branches`.
- **Tenant Scope:** Scoped to all institutions owned by the organization.

### 3. School Owner & Principal (`ADMIN`, `PRINCIPAL`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `principal_dashboard`.
- **Permitted Modules:** All operational modules (`principal_dashboard`, `student_management`, `admission_workflow`, `fee_management`, `attendance_timetable`, `timetable_engine`, `examination_ai`, `homework_learning`, `staff_workforce`, `library_transport`).
- **CRUD Operations:** Full create, read, update, delete for students, staff, academic sessions, fee structures, timetable grids, and exam papers.
- **Backend APIs:** Full suite (`/api/students`, `/api/staff`, `/api/fees`, `/api/attendance`, `/api/homework`, `/api/exams`, `/api/timetables`).
- **Tenant Scope:** Strictly isolated to `user.schoolId`.

### 4. Branch / Campus Admin (`BRANCH_ADMIN`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `principal_dashboard`.
- **Permitted Modules:** Academic and operational modules scoped by `branchId`.
- **CRUD Operations:** Manage classes, sections, local staff, and student admissions within designated branch. Cross-branch mutation returns HTTP 403.
- **Backend APIs:** `/api/students?branchId=...`, `/api/staff?branchId=...`.
- **Tenant Scope:** Isolated to `user.schoolId` AND `user.branchId`.

### 5. HR / Workforce Administrator (`HR_MANAGER`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `staff_workforce`.
- **Permitted Modules:** `staff_workforce`, `payroll_expenses`, `attendance_timetable`.
- **CRUD Operations:** Onboard staff, issue cryptographic invitation tokens, assign departments, approve leaves, generate salary slips. Cannot modify student academic marks.
- **Backend APIs:** `/api/staff`, `/api/staff/leaves`, `/api/auth/invite-user`, `/api/auth/resend-invitation`.
- **Tenant Scope:** Scoped to `user.schoolId`.

### 6. Teacher / Faculty (`TEACHER`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `attendance_timetable` / `homework_learning`.
- **Permitted Modules:** `attendance_timetable`, `homework_learning`, `examination_ai`, `student_management` (read-only roster).
- **CRUD Operations:** Mark daily class attendance, create homework assignments, grade submissions, input exam marks. Cannot access payroll, financial fee counter, or system configuration.
- **Backend APIs:** `/api/attendance/mark`, `/api/homework`, `/api/homework/:id/submit`, `/api/exams/marks`.
- **Tenant Scope:** Strictly filtered by `user.assignedClasses` (e.g. Class VIII, Class X). Querying unassigned classes returns empty dataset.

### 7. Accountant / Fee Manager (`ACCOUNTANT`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `fee_management`.
- **Permitted Modules:** `fee_management`, `student_management` (read-only for billing reconciliation).
- **CRUD Operations:** Configure fee heads, record offline counter collections (cash/cheque/DD), generate receipts, track defaulters. Cannot mark student attendance or grade exams.
- **Backend APIs:** `/api/fees/types`, `/api/fees/collect`, `/api/fees/receipts`.
- **Tenant Scope:** Scoped to `user.schoolId`.

### 8. Fleet & Transport Supervisor (`TRANSPORT`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `library_transport`.
- **Permitted Modules:** `library_transport` (Transport fleet view).
- **CRUD Operations:** Vehicle route assignment, driver phone mapping, stop schedules. Cannot access student academic grades, fees, or staff payroll.
- **Backend APIs:** `/api/operations/transport`.
- **Tenant Scope:** Scoped to `user.schoolId`.

### 9. Student (`STUDENT`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `student_portal`.
- **Permitted Modules:** `student_portal` (Learner desk: schedule, homework submissions, report cards, digital library).
- **CRUD Operations:** Read own timetable, read own attendance, submit homework files, read own exam results. Zero write permission to grades, fees, or class configurations.
- **Backend APIs:** `/api/students/:id` (own ID only), `/api/attendance` (self only), `/api/homework` (published only), `/api/homework/:id/submit` (self submission).
- **Tenant Scope:** Scoped exclusively to `user.studentId`.

### 10. Parent / Guardian (`PARENT`)
- **Login Route:** `/login`.
- **Landing View:** `SCHOOL_PORTAL` -> `parent_portal`.
- **Permitted Modules:** `parent_portal` (Overview, Fees & Invoices, Homework, Term Results).
- **CRUD Operations:** Switch between linked siblings, view fee dues, view receipts, inspect attendance percentage. Zero access to unrelated students.
- **Backend APIs:** `/api/students` (filtered by `childrenIds`), `/api/fees/receipts` (scoped to linked children), `/api/attendance` (scoped to linked children).
- **Tenant Scope:** Scoped exclusively to `user.childrenIds`.

---

## 3. Direct URL Route Guard Verification

When a low-privilege user (Student or Parent) attempts client-side state dispatch or direct navigation to restricted administrative modules:
1. `AppShell` intercepts navigation via `isModuleAuthorized(activeModule, currentRole)`.
2. Access is denied immediately.
3. Renders a secure, high-contrast Access Denied notification (`ShieldAlert`).
4. Provides a single-click recovery button: *"Return to My Authorized Portal"*.
5. Corresponding backend API calls reject unauthorized requests with HTTP 403 Forbidden.
