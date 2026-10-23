# i2A SchoolOS — Master Prompt 06
## Role-Based Access Control (RBAC) & Permission Enforcement Matrix

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Security Domain:** Authorization, Role Hierarchy & Privilege Escalation Defense  
**Reference Document:** [docs/strategy/ROLE_PERMISSION_MATRIX.md](file:///D:/i2A_School%20ERP%20&%20Managment/docs/strategy/ROLE_PERMISSION_MATRIX.md)  

---

### 1. Enterprise Role Hierarchy & Numerical Ranking

To prevent horizontal and vertical privilege escalation, roles are assigned strict numerical hierarchy rankings. An actor with a lower or equal rank is mathematically forbidden from creating, updating, or assigning a role with an equal or higher rank.

| Scope | Role Identifier | Hierarchy Rank | Operational Authority |
| :--- | :--- | :---: | :--- |
| **Platform** | `SUPER_ADMIN` | **100** | Full omnipotent multi-tenant platform administration |
| **Platform** | `PLATFORM_OPS` | **90** | Cloud infrastructure, deployments, monitoring |
| **Platform** | `PLATFORM_SUPPORT` | **85** | Multi-tenant customer support and diagnostics |
| **Platform** | `PLATFORM_AUDITOR` | **80** | Forensic compliance and cross-tenant audit review |
| **Government** | `STATE_ADMIN` | **75** | State education ministry regulatory jurisdiction |
| **Government** | `DISTRICT_OFFICER` | **70** | District Education Officer (DEO) school inspection |
| **Organization** | `ORG_DIRECTOR` | **70** | Chain/Society director over multiple branch campuses |
| **Organization** | `ORG_FINANCE` | **60** | Multi-branch consolidated ledger and financial reporting |
| **Organization** | `ORG_AUDITOR` | **60** | Multi-branch quality, compliance, and academic review |
| **Institution** | `SCHOOL_OWNER` | **55** | Founder / Trust president of individual school |
| **Institution** | `PRINCIPAL` | **50** | Academic, staff, and disciplinary operational head |
| **Institution** | `ADMIN` | **50** | General institutional administrator |
| **Institution** | `VICE_PRINCIPAL` | **45** | Senior academic administration and scheduling |
| **Institution** | `ACADEMIC_COORD` | **40** | Curriculum, syllabus pacing, and exam scheduling |
| **Institution** | `EXAM_CONTROLLER` | **40** | Question bank approval, exam publishing, report cards |
| **Institution** | `ACCOUNTANT` | **35** | Fee collection, ledger entries, salary disbursement |
| **Institution** | `HR_MANAGER` | **35** | Staff hiring, biometric attendance, leave approvals |
| **Institution** | `ADMISSION_OFFICER` | **30** | Inquiry handling, form verification, enrollment |
| **Institution** | `CLASS_TEACHER` | **25** | Class attendance locking, diary remarks, grading |
| **Institution** | `TEACHER` | **20** | Daily attendance, homework creation, MCQ paper AI |
| **Institution** | `LIBRARIAN` | **20** | Book catalog, barcode issuance, overdue fines |
| **Institution** | `TRANSPORT_MGR` | **20** | Route scheduling, bus tracking, fuel tracking |
| **Institution** | `STAFF` | **15** | General non-teaching operational staff |
| **Institution** | `RECEPTIONIST` | **15** | Front desk, visitor passes, student pick-up passes |
| **Portal** | `PARENT` | **5** | Child attendance, fee receipts, digital report cards |
| **Portal** | `STUDENT` | **1** | Homework submission, online exams, self profile |

---

### 2. Privilege Escalation Defense: `validateRoleAssignment`

Implemented in [server/middleware/rbac.js](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/rbac.js#L500-L535):

```javascript
export function validateRoleAssignment(assignerRole, targetRole) {
  if (!assignerRole || !targetRole) {
    return { allowed: false, error: 'Both assigner role and target role are required.' };
  }

  // Super Admin can assign any role
  if (assignerRole === ROLES.SUPER_ADMIN) {
    return { allowed: true };
  }

  const assignerRank = ROLE_HIERARCHY_RANK[assignerRole] || 0;
  const targetRank = ROLE_HIERARCHY_RANK[targetRole] || 0;

  // Non-SuperAdmin cannot create SuperAdmin, PlatformOps, or OrgDirector
  if (targetRank >= ROLE_HIERARCHY_RANK.ORG_DIRECTOR) {
    return {
      allowed: false,
      error: `FORBIDDEN: Role '${assignerRole}' is not authorized to grant administrative platform/org role '${targetRole}'.`
    };
  }

  // Cannot assign role equal to or higher than self
  if (targetRank >= assignerRank) {
    return {
      allowed: false,
      error: `FORBIDDEN: Privilege escalation rejected. Role '${assignerRole}' (rank ${assignerRank}) cannot assign '${targetRole}' (rank ${targetRank}).`
    };
  }

  return { allowed: true };
}
```

---

### 3. Granular Permission Matrix Mapping

| Domain Permission | Allowed Roles | Enforcement Middleware |
| :--- | :--- | :--- |
| `organization.manage` | `SUPER_ADMIN`, `ORG_DIRECTOR` | `requirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)` |
| `branches.read` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `ORG_FINANCE`, `ORG_AUDITOR`, `PRINCIPAL`, `ADMIN` | `requirePermissions(PERMISSIONS.BRANCHES_READ)` |
| `school_setup.edit` | `SUPER_ADMIN`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN')` |
| `students.read` | `SUPER_ADMIN`, `PLATFORM_OPS`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN`, `VICE_PRINCIPAL`, `TEACHER`, `CLASS_TEACHER` | `requirePermissions(PERMISSIONS.STUDENTS_READ)` |
| `students.read_pii` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ADMISSION_OFFICER` | `redactStudentPii` (Zero-PII Leakage) |
| `students.create` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ADMISSION_OFFICER`, `STAFF` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF')` |
| `students.export` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` | `requirePermissions(PERMISSIONS.STUDENTS_EXPORT)` |
| `admissions.approve` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN')` |
| `attendance.mark` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `TEACHER`, `CLASS_TEACHER`, `STAFF` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF')` |
| `attendance.lock` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN')` |
| `timetable.manage` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ACADEMIC_COORD` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACADEMIC_COORD')` |
| `homework.grade` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `TEACHER`, `CLASS_TEACHER` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TEACHER')` |
| `homework.submit` | `STUDENT` | `requireRoles('STUDENT')` |
| `exams.manage` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `EXAM_CONTROLLER`, `TEACHER` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER')` |
| `fees.collect` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ACCOUNTANT`, `STAFF` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF')` |
| `fees.pay` | `PARENT`, `STUDENT` | `requireRoles('PARENT', 'STUDENT')` |
| `payroll.manage` | `SUPER_ADMIN`, `SCHOOL_OWNER`, `PRINCIPAL`, `ADMIN`, `ACCOUNTANT`, `HR_MANAGER` | `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT')` |
| `audit.read` | `SUPER_ADMIN`, `PLATFORM_AUDITOR`, `ORG_DIRECTOR`, `ORG_AUDITOR`, `PRINCIPAL`, `ADMIN` | `requireRoles(...)` |

---

### 4. Adversarial Verification Evidence

- **Scenario 14**: A student providing `role: 'SUPER_ADMIN'` in the request body is rejected with 403 `INSUFFICIENT_PERMISSIONS` because the server evaluates only `req.user.role`.
- **Scenario 18**: A student token attempting `POST /api/attendance/mark` is rejected with 403 `INSUFFICIENT_PERMISSIONS`.
- **Scenario 20**: A principal attempting `validateRoleAssignment('PRINCIPAL', 'SUPER_ADMIN')` or `validateRoleAssignment('PRINCIPAL', 'ORG_DIRECTOR')` is rejected. Attempting to assign `PRINCIPAL` (equal rank) is rejected. Subordinate role assignment (`TEACHER`) succeeds.
