# Role-Based Access Control (RBAC) & Granular Permission Matrix
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-007 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Security Philosophy & Invariants

1. **Zero Client-Side Security Trust:** Permissions are never determined by the frontend UI. The backend REST API evaluates cryptographically signed JWT claims (`userId`, `role`, `schoolId`, `orgId`) on every single HTTP endpoint.
2. **Object-Level Access Control (IDOR Prevention):** Having a `TEACHER` or `PARENT` role is insufficient; the user must have an active relationship with the requested resource (e.g., a teacher must be assigned to the class; a parent must be linked to the student in `parent_student_links`).
3. **No Plaintext Passwords:** Administrators can never view, generate, or receive plaintext passwords for staff, students, or parents. Account activation occurs via email/SMS invitation links leading to a secure password creation screen.

---

## 2. Granular Role Definitions & Scopes

| Role Identifier | Role Title | Hierarchy Scope | Authentication Method | Primary Operational Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Platform Super Admin | Global Platform Root | Multi-Factor (Password + OTP) | Tenant management, global SaaS billing, plan enforcement, system health. |
| `PLATFORM_OPS` | Platform Support Specialist| Global Read-Only / Impersonate| Multi-Factor (Password + OTP) | Tenant troubleshooting, audit review, ticket resolution under strict audit logs. |
| `ORG_DIRECTOR` | Group / Trust Director | All Branches in Organization | Password + Optional MFA | Consolidated reporting, trust policy, branch creation, group fee oversight. |
| `GOVT_ADMIN` | District / State Officer | All Schools in Jurisdiction | Official SSO / Password + OTP | Compliance review, statistical reporting, UDISE validation, policy audits. |
| `SCHOOL_OWNER`| Institutional Owner | Assigned School Campus | Password + SMS Alert on Login | Financial P&L, fee policy approvals, executive hiring, platform subscription. |
| `PRINCIPAL` | Academic Principal | Assigned School Campus | Password | Daily academic administration, teacher timetable sign-off, discipline, approvals. |
| `TEACHER` | Academic Faculty / Educator | Assigned Classes & Subjects | Password | Attendance marking, homework posting, exam grading, student progress input. |
| `ACCOUNTANT` | Bursar / Fee Accountant | Assigned School Campus | Password | Counter fee collection, POS receipt generation, expense recording, payroll. |
| `STAFF` | Administrative / Front-Desk | Assigned School Campus | Password | Admission inquiries, visitor passes, identity card printing, inventory check. |
| `EXAM_CONTROLLER`| Examination Officer | Assigned School Campus | Password | Exam calendar scheduling, question paper blueprinting, final grade card lock. |
| `LIBRARIAN` | Digital & Physical Librarian | Assigned School Campus | Password | Book cataloging, circulation checkout/returns, overdue fine calculation. |
| `TRANSPORT_MGR`| Transport Coordinator | Assigned School Campus | Password | Vehicle fleet maintenance, bus routes, driver rosters, stop-wise fee mapping. |
| `DRIVER` | Vehicle Operator | Assigned Vehicle & Route | Mobile OTP / PIN | Daily trip passenger checklist, student boarding/alighting confirmation, SOS. |
| `PARENT` | Parent / Legal Guardian | Verified Student Wards Only | Password / Mobile OTP | Child attendance tracking, fee invoice payment, report card download, orders. |
| `STUDENT` | Enrolled Student | Enrolled Class / Section Only | Password / School Student ID | Homework submissions, timetable view, online test engine, revision videos. |

---

## 3. Comprehensive Granular Permission Matrix

The following table details permissions across all core functional domains (`CREATE`, `READ`, `UPDATE`, `DELETE`, `APPROVE`):

| Functional Domain / Endpoint | Super Admin | Org Director | Principal | Teacher | Accountant | Staff | Transport / Lib | Parent | Student |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **School Onboarding & Setup** | CRUD+A | Read-Only | Read-Only | Denied | Denied | Denied | Denied | Denied | Denied |
| **Branch / Campus Management** | CRUD+A | CRUD+A | Read-Only | Denied | Denied | Denied | Denied | Denied | Denied |
| **Academic Master & Sessions** | CRUD+A | Read-Only | CRUD+A | Read-Only | Denied | Denied | Denied | Denied | Denied |
| **Class, Section & Subjects** | CRUD+A | Read-Only | CRUD+A | Read-Only | Denied | Denied | Denied | Denied | Denied |
| **Admissions Application** | CRUD+A | Read-Only | Approve/Reject | Denied | Denied | Create/Verify | Denied | Denied | Public Apply |
| **Student SIS Records** | CRUD+A | Read-All | CRUD+A | Read-Assigned | Read-Basic | Read-Basic | Read-Basic | Read-Ward | Read-Self |
| **Class Attendance Marking** | CRUD+A | Read-All | CRUD+Lock | Mark-Assigned | Denied | Denied | Denied | Read-Ward | Read-Self |
| **Timetable Scheduling** | CRUD+A | Read-All | CRUD+Approve | Read-Assigned | Denied | Denied | Denied | Read-Ward | Read-Self |
| **Homework & Assignments** | CRUD+A | Read-All | Read-All | CRUD+Grade | Denied | Denied | Denied | Read-Ward | Read/Submit |
| **Question Bank & Tests** | CRUD+A | Read-All | Approve/Publish| Create/Review | Denied | Denied | Denied | Denied | Take Test |
| **Examinations & Marks Entry**| CRUD+A | Read-All | Approve/Lock | Grade-Assigned | Denied | Denied | Denied | Read-Ward (Pub)| Take/View |
| **Report Card Publishing** | CRUD+A | Read-All | Approve/Publish| Draft-Comments | Denied | Print Only | Denied | Read-Ward (Pub)| Read-Self |
| **School Fee Invoicing** | CRUD+A | Read-All | Read-All | Denied | CRUD | Denied | Denied | Read-Ward | Read-Self |
| **Fee Collection & Receipts** | CRUD+A | Read-All | Read-All | Denied | Collect/Receipt| Denied | Denied | Pay Dues | Denied |
| **Staff Directory & HR** | CRUD+A | Read-All | CRUD+A | Read-Self | Read-Payroll | Denied | Read-Self | Denied | Denied |
| **Payroll Disbursement** | CRUD+A | Read-All | Approve Only | Denied | Prepare/Disburse| Denied | Denied | Denied | Denied |
| **Transport & Routes** | CRUD+A | Read-All | Read-All | Denied | Read-Fees | Denied | CRUD (Trn) | Read-Route | Read-Route |
| **Library Management** | CRUD+A | Read-All | Read-All | Read-Books | Read-Fines | Denied | CRUD (Lib) | Read-Catalog | Read/Borrow |
| **School Marketplace** | CRUD+A | Read-All | Read-All | Denied | Denied | Manage Store | Denied | Buy/Track | Read-Items |
| **Revision Video Library** | CRUD+A | Read-All | Manage Videos | Upload Course | Denied | Denied | Denied | Watch Ward | Watch Enrolled |
| **Platform SaaS Subscription** | CRUD+A | Manage Sub | View Invoices | Denied | View Invoices | Denied | Denied | Denied | Denied |
| **Audit Logs & Security** | Read-All | Read-Org | Read-School | Denied | Denied | Denied | Denied | Denied | Denied |

*Legend:*  
- **CRUD+A:** Create, Read, Update, Delete, and Final Legal Approval.  
- **Mark-Assigned:** Can only perform actions on specifically assigned classes/sections.  
- **Read-Ward:** Can only read records linked to their biological/legal child wards.  
- **Denied:** Server returns `HTTP 403 Forbidden` with audit log capture.

---

## 4. User Lifecycle Management

### 4.1 Secure Invitation & Password Activation Workflow
```
[Admin / Principal creates Staff/Student Profile]
                      │
                      ▼
[Backend generates secure, cryptographic Invitation Token (15-min expiry)]
                      │
                      ▼
[Dispatches Email / SMS with activation link: i2aschoolos.com/activate?token=XYZ]
                      │
                      ▼
[User sets private password matching complexity rules (>= 8 chars, 1 uppercase, 1 symbol)]
                      │
                      ▼
[Password hashed via bcrypt (salt rounds = 10) -> Account activated -> Token invalidated]
```

### 4.2 Account Suspension & Revocation
- **Immediate Session Invalidation:** When an administrator revokes or suspends a staff member (e.g. employee resignation or termination), their active JWT session is added to the server-side Redis/Memory revocation list, terminating access within 60 seconds.
- **Audit Logging:** Account status changes (`ACTIVE`, `SUSPENDED`, `REVOKED`) require a mandatory text justification and are logged with the executing administrator's ID and IP address.
