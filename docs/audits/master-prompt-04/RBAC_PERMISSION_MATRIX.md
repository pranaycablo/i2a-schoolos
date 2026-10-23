# i2A SchoolOS — Enterprise RBAC & Granular Permission Matrix Specification
**Document Reference:** `docs/audits/master-prompt-04/RBAC_PERMISSION_MATRIX.md`  
**Phase:** Master Prompt 04 — Enterprise Security, Privacy, RBAC & Tenant Isolation  
**Date:** October 18, 2026  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Enterprise Role Hierarchy & Classification

i2A SchoolOS defines a 5-tier role architecture supporting private educational trusts, government school networks, single independent institutions, and multi-branch campus chains.

### 1.1 Role Classification & Numerical Ranks

| Level | Role Identifier | Title | Hierarchy Rank | Operational Scope |
| :--- | :--- | :--- | :---: | :--- |
| **Platform** | `SUPER_ADMIN` | Platform Super Admin | 100 | Global SaaS platform root across all tenants. |
| | `PLATFORM_OPS` | Platform Operations Specialist | 90 | Platform telemetry, maintenance, and support. |
| | `PLATFORM_SUPPORT` | Support Specialist | 85 | Read-only troubleshooting under audit logs. |
| | `PLATFORM_AUDITOR` | Global Compliance Auditor | 80 | Platform-wide read-only audit log review. |
| **Government** | `STATE_ADMIN` | State Education Director | 75 | State-level public school oversight. |
| | `DISTRICT_OFFICER` | District Education Officer (DEO) | 70 | District-level compliance and reporting. |
| | `BLOCK_OFFICER` | Block Education Officer (BEO) | 65 | Sub-district inspection and cluster oversight. |
| | `CLUSTER_COORD` | Cluster Resource Coordinator | 60 | Local school cluster reporting and inspections. |
| **Organization** | `ORG_DIRECTOR` | Group / Trust Director | 70 | All branches and campuses under parent org. |
| | `ORG_FINANCE` | Group Chief Financial Officer | 60 | Consolidated financial and fee oversight. |
| | `ORG_AUDITOR` | Trust Internal Auditor | 60 | Organization-wide compliance and logs. |
| **Institution** | `SCHOOL_OWNER` | Institutional Founder / Owner | 55 | Campus P&L, key appointments, subscription. |
| | `PRINCIPAL` | Academic Principal / Head of School | 50 | Campus academic management, approvals, policy. |
| | `ADMIN` | General School Administrator | 50 | Campus operational administration. |
| | `SCHOOL_HEAD` | Headmaster / Headmistress | 50 | Government institution campus head. |
| | `VICE_PRINCIPAL` | Vice Principal / Dean | 45 | Academic discipline, timetable sign-off. |
| | `ACADEMIC_COORD` | Academic Coordinator | 40 | Curriculum blueprint, subject scheduling. |
| | `EXAM_CONTROLLER`| Examination Controller | 40 | Question paper security, marks freeze, cards. |
| | `ACCOUNTANT` | Bursar / Fee Accountant | 35 | Counter fee collection, POS, payroll. |
| | `HR_MANAGER` | Staff HR Manager | 35 | Staff recruitment, leave records, biometric. |
| | `ADMISSION_OFFICER`| Admissions Counselor | 30 | Inquiries, student document verification. |
| | `CLASS_TEACHER` | Class Teacher / Form Tutor | 25 | Assigned class attendance, remarks, cards. |
| | `TEACHER` | Subject Faculty / Educator | 20 | Assigned subject marks, homework, tests. |
| | `LIBRARIAN` | Campus Librarian | 20 | Book catalog, circulation, overdue fines. |
| | `TRANSPORT_MGR` | Fleet Transport Manager | 20 | Bus routes, vehicle fleet, driver rosters. |
| | `STAFF` | General Administrative Staff | 15 | Identity card printing, visitors, inventory. |
| | `RECEPTIONIST` | Front Desk Receptionist | 15 | Visitor passes, phone inquiries. |
| **Portals** | `PARENT` | Parent / Legal Guardian | 5 | Biological or legal child wards only. |
| | `STUDENT` | Enrolled Student | 1 | Self-assigned academic records only. |

---

## 2. Granular Permission Matrix

The canonical permissions defined in [`server/middleware/rbac.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/rbac.js) map functional actions to allowed role categories:

| Permission Code | Description | Allowed Roles |
| :--- | :--- | :--- |
| `organization.manage` | Create, mutate, or reassign organization hierarchy. | `SUPER_ADMIN`, `ORG_DIRECTOR` |
| `branches.manage` | Add or update branches under an organization. | `SUPER_ADMIN`, `ORG_DIRECTOR` |
| `branches.read` | View branch network details and campus lists. | `SUPER_ADMIN`, `ORG_DIRECTOR`, `ORG_FINANCE`, `ORG_AUDITOR`, `STATE_ADMIN`, `DISTRICT_OFFICER`, `PRINCIPAL`, `ADMIN` |
| `school_setup.view` | View school configuration, session, and grading rules. | `SUPER_ADMIN`, `ORG_DIRECTOR`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN` |
| `school_setup.edit` | Modify branding, logos, signature stamps, and fee headers. | `SUPER_ADMIN`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN` |
| `students.read` | View full academic student roster in authorized school. | `SUPER_ADMIN`, `PLATFORM_OPS`, `ORG_DIRECTOR`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN`, `VICE_PRINCIPAL`, `ACADEMIC_COORD`, `ADMISSION_OFFICER`, `TEACHER`, `CLASS_TEACHER`, `EXAM_CONTROLLER` |
| `students.read_basic` | View basic student directory without sensitive PII. | `ACCOUNTANT`, `STAFF`, `LIBRARIAN`, `TRANSPORT_MGR`, `RECEPTIONIST` |
| `students.read_pii` | View unmasked guardian contact, address, and national ID. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ADMISSION_OFFICER` |
| `students.create` | Enroll new student into school SIS. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ADMISSION_OFFICER`, `STAFF` |
| `students.update` | Modify student demographic or academic fields. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `STAFF`, `TEACHER` |
| `students.delete` | Soft delete or archive student enrollment. | `SUPER_ADMIN`, `PRINCIPAL` |
| `students.export` | Bulk export student records with sensitive PII. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` |
| `admissions.approve` | Formally approve student admission application. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` |
| `attendance.mark` | Mark daily student attendance roster. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `TEACHER`, `CLASS_TEACHER`, `STAFF` |
| `attendance.lock` | Permanently lock finalized attendance register. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` |
| `exams.manage` | Schedule exams, create blueprints, approve papers. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `EXAM_CONTROLLER`, `TEACHER` |
| `exams.grade` | Enter and update marks for assigned classes. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `EXAM_CONTROLLER`, `TEACHER`, `CLASS_TEACHER` |
| `fees.structure_manage`| Define fee heads, installment calendars, and discounts. | `SUPER_ADMIN`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN`, `ACCOUNTANT` |
| `fees.collect` | Collect counter payments and generate receipts. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ACCOUNTANT`, `STAFF` |
| `payroll.manage` | Prepare and disburse staff salary vouchers. | `SUPER_ADMIN`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN`, `ACCOUNTANT`, `HR_MANAGER` |
| `audit.read` | Query structured forensic audit event logs. | `SUPER_ADMIN`, `PLATFORM_AUDITOR`, `ORG_DIRECTOR`, `ORG_AUDITOR`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN` |
| `roles.assign` | Provision and assign user roles. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` |
| `privacy.manage` | Review and resolve DPDP data subject requests. | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` |

---

## 3. Strict Privilege Escalation & Segregation Rules

### 3.1 Role Escalation Defense Engine
- **Implementation File:** [`server/middleware/rbac.js:205-240`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/rbac.js#L205-L240).
- **Rule 1:** A user cannot assign a role with a rank equal to or higher than their own rank.
- **Rule 2:** Only `SUPER_ADMIN` can assign `SUPER_ADMIN`, `PLATFORM_OPS`, or `ORG_DIRECTOR` roles.
- **Rule 3:** Tenant administrators (`PRINCIPAL`, `ADMIN`) are restricted to institution-level roles within their assigned school.

### 3.2 Invariant Segregation of Duties
1. **Accountant Isolation:** Accountants possess `fees.collect` and `payroll.manage`, but lack `exams.manage` and `students.read_pii`. They cannot inspect student medical notes or alter exam results.
2. **Teacher Scoping:** Teachers can only mark attendance and grades for their explicitly assigned classes (`assignedClasses`) and subjects (`subjects`).
3. **Parent Object Isolation:** Parents can only access records where `studentId` matches their verified biological/legal ward (`childrenIds`).
4. **Student Object Isolation:** Students can only view their own individual record, submit homework for their enrolled class, and take assigned tests.
