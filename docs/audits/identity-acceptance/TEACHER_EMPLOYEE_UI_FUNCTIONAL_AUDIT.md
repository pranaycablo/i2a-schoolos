# i2A SchoolOS — Teacher & Employee UI Full Functional Audit

**Audit Target:** `AttendanceLeaveModule.tsx`, `HomeworkDigitalLearningModule.tsx`, `StaffWorkforceModule.tsx`  
**Audited Roles:** `TEACHER`, `ACCOUNTANT`, `STAFF`, `PRINCIPAL`  
**Test Method:** Headless Google Chrome Automation + RBAC Adversarial Vector Suite  
**Visual Artifacts:**  
- Teacher Workspace: [`03_teacher_workspace_roster.png`](file:///d:/i2A_School%20ERP%20%26%20Managment/docs/audits/identity-acceptance/screenshots/03_teacher_workspace_roster.png)  
- Staff Workforce: [`04_staff_workforce_directory.png`](file:///d:/i2A_School%20ERP%20%26%20Managment/docs/audits/identity-acceptance/screenshots/04_staff_workforce_directory.png)  

---

## 1. Feature-by-Feature Functional Assessment

| Feature | Audited Role | UI View / Action | Data Scope | Backend API | Status |
|---|---|---|---|---|---|
| **Class Attendance Roster** | `TEACHER` | Daily class attendance table with Present/Absent/Late buttons | Filtered by assigned classes | `POST /api/attendance/mark` | **PASS** |
| **Attendance Locking Rule** | `TEACHER` | Attempting to edit attendance after 24-hour lock window | School lock registry | Returns `403 ATTENDANCE_LOCKED` | **PASS** |
| **Homework Creation** | `TEACHER` | Form: Title, Class, Due Date, Attachments | Teacher's assigned subject | `POST /api/homework` | **PASS** |
| **Submission Grading** | `TEACHER` | Review student submissions, enter marks & feedback | Published homework | `POST /api/homework/submissions/:id/grade` | **PASS** |
| **Staff Leave Application** | `TEACHER` / `STAFF` | Apply for Casual/Sick leave with date range & reason | Scoped to caller's staff ID | `POST /api/staff/leaves` | **PASS** |
| **Leave Approval Queue** | `PRINCIPAL` / `HR` | Review leave requests with approve/reject actions | School-wide staff leaves | `PATCH /api/staff/leaves/:id/decision` | **PASS** |
| **Staff Directory & Search** | `PRINCIPAL` / `HR` | Search by name, employee code, department, branch | School tenant staff | `GET /api/staff` | **PASS** |
| **Staff Onboarding & Provisioning** | `PRINCIPAL` / `HR` | Form: Add Staff, generate employee ID, provision account | School tenant | `POST /api/staff` | **PASS** |
| **Payroll Payslip Viewing** | `STAFF` | Download monthly salary statement | Read-only for employee | `GET /api/staff/:id` | **PASS** |

---

## 2. Role-Specific Boundary Enforcement

Rigorous adversarial vectors were executed against employee accounts:

### Vector 1: Teacher Querying Unassigned Classes
- **Scenario:** Teacher assigned to `Class VIII` and `Class X` queries students in `Class VI`.
- **Implementation:** `server/routes/students.js` checks if `req.query.className` is in `req.user.assignedClasses`.
- **Result:** Query returns `[]` (empty dataset). Zero student records from unassigned classes are leaked.

### Vector 2: Accountant Attempting Academic Mutations
- **Scenario:** Accountant submits exam paper creation or attempts to mark student attendance.
- **Implementation:** `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER')` blocks accountants.
- **Result:** HTTP 403 Forbidden (`INSUFFICIENT_PERMISSIONS`).

### Vector 3: Teacher Attempting Payroll / Institutional Modification
- **Scenario:** Teacher attempts to call `POST /api/auth/register-school` or access administrative billing.
- **Implementation:** Route guard and API middleware block non-admin roles.
- **Result:** HTTP 403 Forbidden.

### Vector 4: Deactivated / Suspended Employee Access Revocation
- **Scenario:** An employee's status is updated to `SUSPENDED` or `TERMINATED` in the database.
- **Implementation:** Authentication middleware verifies `user.status === 'ACTIVE'` on every request.
- **Result:** Subsequent login attempts return `HTTP 403 ACCOUNT_SUSPENDED`. Active tokens are invalidated.

---

## 3. Verdict

Employee and faculty workflows operate with strict separation of duties and least-privilege scoping.

**Teacher & Employee UI Status:** `PASS`
