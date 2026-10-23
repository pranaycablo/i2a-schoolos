# i2A SchoolOS — Master Cross-Module End-to-End Workflow Evidence
**Test Suite:** `src/__tests__/FullErpComprehensiveE2EScenarios.test.ts`  
**Execution Environment:** Node.js v24.15.0 | Vitest v5.0.3 | MongoDB Synthetic Test DB (`i2a_schoolos_synthetic_test`)  
**Audit Verification:** 15 / 15 Cross-Module Scenarios Passed with 100% Deterministic Reproducibility  

---

## 1. Scenario Execution Overview

| Scenario | Title | Modules Involved | Personas Exercised | Status |
| :---: | :--- | :--- | :--- | :---: |
| **01** | Student Admission $\to$ Fee Collection $\to$ Attendance Marking | Admissions, SIS, Fees, Attendance | Applicant, Principal, Accountant, Teacher | **VERIFIED** |
| **02** | Timetable Conflict Detection and Classroom Assignment | Timetable, Academic OS | Principal, Teacher, Staff | **VERIFIED** |
| **03** | Exam Creation, Online Submission & Auto-Grading | Examination, Question Bank, Student Portal | Teacher, Student | **VERIFIED** |
| **04** | Fee Setup $\to$ POS Collection $\to$ Double-Entry Ledger | Fees, Accounting, Operations | Accountant, Cashier | **VERIFIED** |
| **05** | Staff Onboarding $\to$ Leave Application $\to$ Approval | Staff HR, Permissions, Audit | Principal, Faculty Member | **VERIFIED** |
| **06** | Digital Library Cataloging and Student Browsing | Library, Operations, Student Portal | Teacher, Student | **VERIFIED** |
| **07** | Transport Fleet Routing & Geocoded Stops | Transport, Fleet, Operations | Transport Manager, Principal | **VERIFIED** |
| **08** | Parent Portal with Object-Level Child Authorization | Parent Portal, SIS, Privacy | Parent, Student | **VERIFIED** |
| **09** | Multi-Branch School Management & Location Geocoding | Platform Admin, Multi-Tenant OS | Super Admin, Principal | **VERIFIED** |
| **10** | Attendance Date-Locking and Anti-Tamper Enforcement | Attendance, Security, Audit | Teacher, Principal | **VERIFIED** |
| **11** | SaaS Plan Quota Enforcement & Trial Status | Subscription, Billing, Licensing | Super Admin, Principal | **VERIFIED** |
| **12** | School Website Builder & Public CMS Hierarchy | CMS, Landing Page, Branding | Principal, Public Visitor | **VERIFIED** |
| **13** | Forensic Audit Trail Logging for Critical Actions | Audit, Security, Governance | Principal, Auditor | **VERIFIED** |
| **14** | Bilingual (English & Hindi) Consistency Gate | Design System, i18n | All Roles | **VERIFIED** |
| **15** | Strict Cross-Tenant Data Isolation Enforcement | Security, Database Architecture | Principal A, Principal B | **VERIFIED** |

---

## 2. Detailed Scenario Verification Evidence

### Scenario 01: Student Admission $\to$ Fee Collection $\to$ Attendance Marking
1. **Public Application Submitted:** `POST /api/admissions/public`
   - Payload: `studentName: "Devansh Sharma"`, `applyingClass: "Class X"`, `phone: "9822334455"`.
   - Result: `201 Created`, Application ID `adm-1771...` created.
2. **Principal Approval & Auto-SIS Provisioning:** `POST /api/admissions/:id/approve`
   - Authorization: `Bearer principalToken`
   - Result: `200 OK`. Atomic transaction inserted student into `students` collection (`std-1771...`) and created user credentials in `users` collection.
3. **Admission Fee Collection:** `POST /api/fees/receipts/collect`
   - Authorization: `Bearer accountantToken`
   - Payload: `studentId: "std-1771..."`, `feeIds: ["fee-1"]`, `paymentMode: "CASH"`.
   - Result: `201 Created`. Receipt `RCP-1771...` issued with status `PAID`.
4. **Attendance Marking:** `POST /api/attendance/mark`
   - Authorization: `Bearer teacherToken`
   - Payload: `className: "Class X"`, `date: "2026-11-05"`, `attendanceList: [{ entityId: "std-1771...", status: "PRESENT" }]`.
   - Result: `200 OK`. Roster successfully persisted.

---

### Scenario 02: Timetable Conflict Detection and Classroom Assignment
1. **Initial Assignment:** `POST /api/timetables/cells`
   - Payload: Teacher `TCH-1001` assigned to `Class VIII-A` on `Monday` during `P1-E2E-TEST` in Room `RM-101`.
   - Result: `200 OK`. Cell created.
2. **Conflicting Assignment Attempt:** `POST /api/timetables/cells`
   - Payload: Attempted to assign same Teacher `TCH-1001` to `Class IX-B` at the same time (`Monday`, `P1-E2E-TEST`).
   - Result: `409 Conflict`.
   - Response Payload:
     ```json
     {
       "error": "CONFLICT: Teacher Sunita Mishra is already assigned to Class VIII-A on Monday during P1-E2E-TEST.",
       "code": "TEACHER_CONFLICT"
     }
     ```

---

### Scenario 03: Exam Creation, Online Submission & Auto-Grading
1. **Teacher Creates Exam Paper:** `POST /api/exams/papers`
   - Payload: `paperTitle: "General Knowledge & Computing Quiz"`, `totalMarks: 25`, `questions: [{ id: "gk-1", marks: 25, correctAnswer: "Central Processing Unit" }]`.
   - Result: `201 Created`, Exam ID `exam-1771...`.
2. **Student Takes Exam:** `POST /api/exams/papers/:id/submit`
   - Authorization: `Bearer studentToken`
   - Payload: `answers: [{ questionId: "gk-1", selectedOption: "Central Processing Unit" }]`.
   - Result: `201 Created`.
   - Score: `25/25` (`100%`), Computed Grade: `A+`, Status: `GRADED`.

---

### Scenario 04: Fee Setup $\to$ POS Collection $\to$ Double-Entry Ledger Entry
1. **Fee Collection:** `POST /api/fees/receipts/collect`
   - Payload: `paymentMode: "ONLINE_UPI"`, `discountAmount: 200`.
   - Result: `201 Created`. Receipt generated with unique `receiptNo`.
2. **Double-Entry Ledger Verification:** `GET /api/operations/expenses`
   - Verified that an `INCOME` ledger entry with matching `receiptNo` and exact paid amount exists in the `expenses` collection.
   - Result: **Audit Confirmed Match**.

---

### Scenario 05: Staff Onboarding $\to$ Leave Application $\to$ Approval
1. **Staff Onboarding:** `POST /api/staff`
   - Result: `201 Created`. Generated Employee ID matching regex `^EMP-\d{4}-\d{4}$`.
2. **Leave Application:** `POST /api/staff/leaves`
   - Result: `201 Created`, Status: `PENDING`.
3. **Principal Decision:** `PATCH /api/staff/leaves/:id/decision`
   - Payload: `decision: "APPROVED"`, `comments: "Medical leave approved"`.
   - Result: `200 OK`. Status updated to `APPROVED`. Anti-self approval security verified.

---

### Scenario 06: Digital Library Cataloging and Student Browsing
1. **Catalog Book:** `POST /api/operations/library`
   - Payload: Title: `"Digital AI in Education Vol 2026"`, Subject: `"Artificial Intelligence"`.
   - Result: `201 Created`.
2. **Student Catalog Query:** `GET /api/operations/library`
   - Authorization: `Bearer studentToken`
   - Result: `200 OK`. Book returned in catalog.

---

### Scenario 07: Transport Fleet Routing & Geocoded Stops
1. **Create Route:** `POST /api/operations/transport`
   - Payload: `routeNumber: "ROUTE-09-E2E"`, stops with pickup and drop timings.
   - Result: `201 Created`.
2. **Route Query:** `GET /api/operations/transport`
   - Result: `200 OK`. Tenant-isolated routes returned.

---

### Scenario 08: Parent Portal with Object-Level Child Authorization
1. **Parent Students Query:** `GET /api/students`
   - Authorization: `Bearer parentToken` (Parent: `sanjay.kumar@gmail.com`)
   - Result: `200 OK`.
   - Security Assertion: Every student returned was verified to match parent's linked children (`childrenIds` or `parentEmail`). No cross-family leakage.

---

### Scenario 09: Multi-Branch School Management & Location Geocoding
1. **Super Admin Lists All Schools:** `GET /api/tenants`
   - Result: `200 OK`. Multi-tenant school directory returned.
2. **Update School Location:** `PUT /api/tenants/I2A-SCH-000001/location`
   - Payload: `latitude: 28.6139`, `longitude: 77.2090`, `city: "New Delhi"`.
   - Result: `200 OK`. `isGeocoded: true` recorded.

---

### Scenario 10: Attendance Date-Locking and Anti-Tamper Enforcement
1. **Initial Attendance Marked:** `POST /api/attendance/mark` $\to$ `200 OK`.
2. **Principal Locks Date:** `POST /api/attendance/lock` $\to$ `200 OK`.
3. **Tamper Attempt:** `POST /api/attendance/mark` on locked date.
   - Result: `403 Forbidden` (`ATTENDANCE_LOCKED`). Roster integrity preserved.

---

### Scenario 11: SaaS Plan Quota Enforcement & Trial Status
1. **Plans Query:** `GET /api/subscription/plans` $\to$ `200 OK` (STARTER, PROFESSIONAL, ENTERPRISE).
2. **Trial Status Query:** `GET /api/subscription/trial-status` $\to$ `200 OK`.
   - Verified active trial parameters: `daysRemaining`, `isTrialActive: true`, student limits.

---

### Scenario 12: School Website Builder & Public CMS Hierarchy
1. **Update Branding:** `PUT /api/tenants/:schoolId/branding` $\to$ `200 OK`.
2. **Public Categories CMS:** `GET /api/categories` $\to$ `200 OK`.

---

### Scenario 13: Forensic Audit Trail Logging for Critical Actions
1. **Audit Logs Query:** `GET /api/audit-logs`
   - Authorization: `Bearer principalAToken`
   - Result: `200 OK`. Over 200 audit events returned.
   - Security Assertion: Every event strictly matched `schoolId: "I2A-SCH-000001"`.

---

### Scenario 14: Bilingual (English & Hindi) Consistency Gate
1. **Dictionary Test:** Validated dictionary parity across English and Hindi.
2. Result: Key terms (`school_setup`, `principal_dashboard`, `fee_management`, `student_management`) verified in both languages.

---

### Scenario 15: Strict Cross-Tenant Data Isolation Enforcement
1. **Adversarial Cross-School Fetch:** School B Principal calls `GET /api/students/:schoolAStudentId`.
   - Result: `404 Not Found` (fail-closed due to `req.tenantFilter`).
2. **Adversarial Cross-School List:** School B Principal calls `GET /api/students`.
   - Result: `200 OK`. Zero School A records returned.
