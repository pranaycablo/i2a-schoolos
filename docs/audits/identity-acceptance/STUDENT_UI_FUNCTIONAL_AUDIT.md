# i2A SchoolOS — Student UI Full Functional Audit

**Audit Target:** `StudentPortalModule.tsx` & Associated Student API Endpoints  
**Audited Role:** `STUDENT` (`rahul.kumar@abcpublicschool.edu.in`)  
**Test Method:** Real Headless Google Chrome Automation + Vitest API Integration Suite  
**Visual Artifacts:**  
- Desktop: [`01_student_portal_desktop.png`](file:///d:/i2A_School%20ERP%20%26%20Managment/docs/audits/identity-acceptance/screenshots/01_student_portal_desktop.png)  
- Mobile: [`01_student_portal_mobile_375x667.png`](file:///d:/i2A_School%20ERP%20%26%20Managment/docs/audits/identity-acceptance/screenshots/01_student_portal_mobile_375x667.png)  

---

## 1. Feature-by-Feature Functional Assessment

| Feature | UI Element / Tab | Data Scope | Field Permissions | API Endpoint | Result |
|---|---|---|---|---|---|
| **Learner Desk Header** | Blue gradient hero banner with name, class, roll number | Current authenticated student only | **Read-Only** (Internal ID, admission number locked) | `/api/auth/me`, `/api/students/:id` | **PASS** |
| **Attendance Indicator** | Top right KPI badge displaying attendance rate (94.2%) | Scoped to `user.studentId` | **Read-Only** | `/api/attendance?entityId=...` | **PASS** |
| **Daily Timetable** | Tab: *"Today's Schedule"* | Class periods (Math, Science, English, etc.) | **Read-Only** | `/api/timetables` | **PASS** |
| **Homework Management** | Tab: *"My Homework"* | Published homework assignments for student's class | **Read-Only** (Title, due date, attachments) | `/api/homework?className=...` | **PASS** |
| **Homework Submission** | Action: *"Submit Assignment"* | Student assignment attempt | **Editable** (text response, file upload) | `POST /api/homework/:id/submit` | **PASS** |
| **Late Submission Lock** | Submission form when `now > dueDate` | Assignment submission | Rejects if `allowLateSubmission: false` | `POST /api/homework/:id/submit` | **PASS** |
| **Exam Marks & Grades** | Tab: *"Exams & Results"* | Published term exam results | **Read-Only** | `/api/exams` | **PASS** |
| **Digital Library** | Tab: *"Digital Library"* | Curated reading books and NCERT/CBSE digital PDF links | **Read-Only** | `/api/operations/library` | **PASS** |
| **Account Password Change** | Session Profile Menu -> Change Password | Authenticated user credentials | **Editable** (requires current password validation) | `POST /api/auth/change-password` | **PASS** |
| **Session Termination** | Header User Profile Menu -> Sign Out | Active JWT token | Revokes token & clears `sessionStorage` | `POST /api/auth/logout` | **PASS** |

---

## 2. Field Mutability & Least-Privilege Protection

To guarantee academic record integrity, students are strictly prevented from modifying administrative fields:

```
[Student Profile]
  ├── Name                 : Read-Only
  ├── Admission No         : Read-Only (Non-editable)
  ├── Roll No              : Read-Only (Assigned by School Admin)
  ├── Class / Section      : Read-Only
  ├── Attendance Roster    : Read-Only
  ├── Exam Scores          : Read-Only (Graded by Teachers)
  ├── Fee Balances         : Read-Only (Managed by Cashier)
  ├── Homework Submission  : EDITABLE (Student submits answers)
  └── Account Password     : EDITABLE (Requires Current Password)
```

Direct API inspection confirms that `PUT /api/students/:id` requires administrative roles (`SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `STAFF`, `TEACHER`). A student sending a `PUT` request receives HTTP 403 Forbidden.

---

## 3. Responsive Experience (Mobile & Desktop)

- **Desktop (1366 × 768):** Full two-column grid. Left side presents the interactive timetable period breakdown with live badges (`COMPLETED`, `IN_PROGRESS`, `UPCOMING`); right side displays recent homework deadlines and pending items.
- **Mobile (375 × 667):** Tabs collapse into horizontal scroll pills. Period cards stack cleanly into single-column layout with 0px horizontal overflow. Touch targets exceed 44px.

---

## 4. Verdict

The Student UI satisfies all real-user learner desk requirements with 100% fail-closed privacy controls.

**Student UI Functional Status:** `PASS`
