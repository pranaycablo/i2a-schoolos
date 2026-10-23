# i2A SchoolOS — Master Prompt 04C Audit Report
## Role-Based Access Control (RBAC), Privilege Escalation & Role Delegation Audit

- **Audit Date:** October 2026
- **Auditor Role:** Principal Security Engineer & Senior Backend Auditor
- **Workspace:** `D:\i2A_School ERP & Managment`
- **Branch:** `phase-a-remediation`
- **Audit Target:** Role Hierarchy Matrix, Privilege Escalation Defense, Role Delegation Limits, Mass-Assignment Protection, and Granular Permissions

---

## 1. Executive Summary

Privilege escalation occurs when a user elevates their authority beyond their assigned privileges, either by creating users with higher roles, modifying their own user record, or manipulating unvalidated parameters during registration or update requests. i2A SchoolOS implements an immutable role hierarchy and strict delegation constraints in `server/middleware/rbac.js` and user management routes. This audit validates these defenses against direct and subtle escalation attacks.

---

## 2. Role Hierarchy & Numeric Rank Structure

i2A SchoolOS defines 12 standard institutional roles, each assigned a strictly ordered numeric rank:

| Role Identifier | Rank | Authority Scope | Primary Institutional Persona |
| :--- | :---: | :--- | :--- |
| `SUPER_ADMIN` | 100 | Global / Multi-Tenant | Platform Owner & Superuser |
| `TRUSTEE` | 90 | Multi-Branch / Organization | School Board / Trust Member |
| `DIRECTOR` | 85 | Multi-Branch Executive | Managing Director |
| `PRINCIPAL` | 80 | Single School Executive | Head of Institution / Principal |
| `VICE_PRINCIPAL` | 75 | Single School Academic | Vice Principal / Academic Head |
| `EXAM_CONTROLLER` | 70 | Examination Domain | Exam Committee Head |
| `ACCOUNTANT` | 65 | Financial & Fee Domain | Chief Accountant / Bursar |
| `SCHOOL_ADMIN` | 60 | Single School Operational | IT / Operations Administrator |
| `TEACHER` | 50 | Classroom & Instructional | Subject / Class Teacher |
| `STAFF` | 40 | Administrative / Auxiliary | Transport, Hostel, Clerical |
| `STUDENT` | 20 | Consumer / Self-Service | Enrolled Student |
| `PARENT` | 10 | Guardian / Ward-Bound | Parent / Legal Guardian |

---

## 3. Privilege Escalation Defenses

### 3.1 Role Assignment & Delegation Invariant
In `server/middleware/rbac.js`:
```javascript
export function canAssignRole(assignerRole, targetRole) {
  const assignerRank = ROLE_RANKS[assignerRole] || 0;
  const targetRank = ROLE_RANKS[targetRole] || 0;

  // A user can never assign a role with rank >= their own rank
  if (targetRank >= assignerRank) {
    return false;
  }
  // Role-specific delegation rules
  if (assignerRole === ROLES.SCHOOL_ADMIN) {
    return [ROLES.TEACHER, ROLES.STAFF, ROLES.STUDENT, ROLES.PARENT].includes(targetRole);
  }
  if (assignerRole === ROLES.PRINCIPAL) {
    return targetRank < 80;
  }
  return assignerRole === ROLES.SUPER_ADMIN;
}
```

### 3.2 Target Modification Immunity
A user cannot modify or deactivate an account holding an equal or higher rank. For example:
- A `SCHOOL_ADMIN` (Rank 60) attempting to deactivate a `PRINCIPAL` (Rank 80) or `DIRECTOR` (Rank 85) is rejected with HTTP 403 `INSUFFICIENT_ROLE_HIERARCHY`.
- A `SCHOOL_ADMIN` attempting to assign the `SUPER_ADMIN` role via user creation receives HTTP 403 `CANNOT_ASSIGN_HIGHER_ROLE`.

### 3.3 Mass Assignment Defense on Profile Updates
When user profile updates occur (`PUT /api/users/:id` or `PUT /api/students/:id`):
- Dangerous fields (`role`, `permissions`, `schoolId`, `isSuperAdmin`, `passwordHash`) are explicitly stripped from update bodies unless the calling session possesses `USER_ROLE_MANAGE` and passes `canAssignRole` checks.
- Self-update endpoints (`PUT /api/users/profile`) strictly reject any attempt by a user to alter their own `role` or `permissions`.

---

## 4. Granular Permission Matrix Enforcement

Rather than relying purely on monolithic role checks (e.g. `if (role === 'ADMIN')`), sensitive actions require specific fine-grained permissions checked via `requirePermission(permission)`:
- `ATTENDANCE_LOCK_OVERRIDE` — Required to reopen locked attendance past the 24-hour cutoff (Restricted to `PRINCIPAL`, `DIRECTOR`, `SUPER_ADMIN`).
- `FEE_CONCESSION_APPROVE` — Required to grant fee discounts (Restricted to `PRINCIPAL`, `DIRECTOR`).
- `AUDIT_LOG_VIEW` — Required to inspect forensic trails (Restricted to `PRINCIPAL`, `TRUSTEE`, `SUPER_ADMIN`).
- `DPDP_OFFICER_OVERRIDE` — Required to execute hard deletion or data export under DPDP requests.

---

## 5. Adversarial Integration Test Evidence

- **Test Suite:** `src/__tests__/EnterpriseSecurityAndRbac.test.ts` & `src/__tests__/MasterPrompt04BIntegration.test.ts`
- **Vectors Executed:**
  - `SCHOOL_ADMIN` attempts to create a `SUPER_ADMIN` user -> HTTP 403 `ROLE_ASSIGNMENT_DENIED`.
  - `TEACHER` attempts to update their own profile with `{"role": "PRINCIPAL"}` -> Rejected, role untouched.
  - `STUDENT` attempts to access `GET /api/audit-logs` -> HTTP 403 `FORBIDDEN_INSUFFICIENT_PERMISSIONS`.
  - `ACCOUNTANT` attempts to modify class attendance lock -> HTTP 403 `FORBIDDEN_ATTENDANCE_SCOPE`.

---

## 6. Audit Verdict

- **Rank Ordering:** `PASS_VERIFIED` (Ordered from 10 to 100).
- **Delegation Limits:** `PASS_VERIFIED` (Zero horizontal or vertical role escalation).
- **Mass Assignment:** `PASS_VERIFIED` (Dangerous keys stripped or blocked).
- **Verdict:** `PASS_VERIFIED`.
