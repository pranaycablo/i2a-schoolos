# i2A SchoolOS — Master Prompt 04B: Report 06
# RBAC Privilege Escalation Defense Results

**Project Root:** `D:\i2A_School ERP & Managment`  
**Phase:** Master Prompt 04B  
**Target Module:** `server/middleware/rbac.js` & `server/routes/students.js`  
**Auditor:** Antigravity Senior Forensic Security Agent  
**Date:** October 18, 2026  

---

## 1. Executive Summary

Privilege escalation occurs when an attacker with low-privilege access elevates their account permissions or assigns administrative capabilities to themselves or other users.

In i2A SchoolOS, role-based access control is enforced via a **canonical permission matrix and a role hierarchy ranking engine** (`server/middleware/rbac.js`). In Master Prompt 04B, all role assignment mutations, permission verification middleware, and mass-assignment defense mechanisms were independently audited and verified under adversarial testing.

---

## 2. Role Hierarchy & Escalation Ranking (`server/middleware/rbac.js`)

In `server/middleware/rbac.js`, every role is assigned an integer rank between 1 and 100:

| Role Category | Role Identifier | Numerical Rank | Permissions / Authority |
|---------------|-----------------|----------------|--------------------------|
| **Platform** | `SUPER_ADMIN` | 100 | Complete unrestricted root access |
| **Platform** | `PLATFORM_OPS` | 90 | Platform operations & maintenance |
| **Platform** | `PLATFORM_AUDITOR` | 80 | Read-only compliance auditor |
| **Jurisdiction**| `STATE_ADMIN` | 75 | State-level education department |
| **Organization**| `ORG_DIRECTOR` | 70 | Trust / Society / Chain multi-branch governance |
| **Institution** | `PRINCIPAL` | 50 | Institutional executive head |
| **Institution** | `ADMIN` | 50 | General school administrator |
| **Institution** | `VICE_PRINCIPAL` | 45 | Secondary institutional admin |
| **Academics** | `EXAM_CONTROLLER` | 40 | Examination controller |
| **Finance** | `ACCOUNTANT` | 35 | Fee collection & expense ledger |
| **Faculty** | `CLASS_TEACHER` | 25 | Class roster & attendance lock |
| **Faculty** | `TEACHER` | 20 | Homework & grade management |
| **Operations** | `TRANSPORT_MGR` | 20 | Fleet & bus route management |
| **Staff** | `STAFF` | 15 | General staff operations |
| **Portal** | `PARENT` | 5 | Linked child profile, fee payment |
| **Portal** | `STUDENT` | 1 | Self-profile, online exams, homework |

### Escalation Validation Rules (`validateRoleAssignment`)

```javascript
// server/middleware/rbac.js lines 504–534
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

## 3. Defense-in-Depth Against Mass Assignment

In `server/routes/students.js` (`PUT /api/students/:id`), incoming updates are passed through a strict whitelist:
```javascript
const allowedFields = [
  'name', 'gender', 'dob', 'bloodGroup', 'category', 'className', 'section',
  'rollNo', 'fatherName', 'motherName', 'parentMobile', 'parentEmail',
  'address', 'city', 'state', 'pincode', 'status', 'admissionDate'
];
```
Any caller attempting to inject `role: 'SUPER_ADMIN'`, `schoolId: 'I2A-SCH-000002'`, or `id: 'hacked-id'` finds those keys filtered out before the MongoDB update document is constructed.

---

## 4. Adversarial Test Evidence (Part 9 Executable Vectors)

1. **Vector 11: School Admin cannot assign Platform Roles**
   - Attempt: `validateRoleAssignment('ADMIN', 'SUPER_ADMIN')` $\rightarrow$ `allowed: false`.
   - Attempt: `validateRoleAssignment('PRINCIPAL', 'ORG_DIRECTOR')` $\rightarrow$ `allowed: false`.
   - **Result:** PASSED.

2. **Vector 12: Self-granted permission rejected**
   - Attempt: `validateRoleAssignment('TEACHER', 'TEACHER')` $\rightarrow$ `allowed: false`.
   - Attempt: `validateRoleAssignment('TEACHER', 'PRINCIPAL')` $\rightarrow$ `allowed: false`.
   - Attempt: `validateRoleAssignment('ADMIN', 'ADMIN')` $\rightarrow$ `allowed: false`.
   - **Result:** PASSED.

3. **Vector 16: Mass assignment defense on student identity fields**
   - Attacker sends `role: 'SUPER_ADMIN'` in `PUT /api/students/:id`.
   - Result: Response HTTP 200, but database verification confirms `role` remains `undefined` and was not injected into the student document.
   - **Result:** PASSED.

4. **Vector 18: Non-privileged audit log read rejected**
   - Student token requesting `GET /api/audit-logs` $\rightarrow$ HTTP 403 `INSUFFICIENT_PERMISSIONS`.
   - Parent token requesting `GET /api/audit-logs` $\rightarrow$ HTTP 403 `INSUFFICIENT_PERMISSIONS`.
   - **Result:** PASSED.
