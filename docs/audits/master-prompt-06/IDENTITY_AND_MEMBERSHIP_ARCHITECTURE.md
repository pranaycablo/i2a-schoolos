# i2A SchoolOS — Master Prompt 06
## Identity & Membership Architecture Specification & Audit

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Architecture Domain:** IAM (Identity & Access Management)  

---

### 1. Conceptual Model: Identity vs. Membership

In an enterprise multi-school ERP, confusing *Identity* with *Institution Membership* is a catastrophic security vulnerability. 

- **Identity (Who you are)**: A human actor with a unique authentication profile (e.g. Email, Mobile Phone, Salted Password Hash, Multi-Factor State, Global Account Status). An identity is global and portable across institutions.
- **Membership (Where and what you can do)**: The institutional context, legal affiliation, role assignments, and branch authorizations that connect an Identity to an Organization or School Tenant.

```
       ┌────────────────────────────────────────────────────────┐
       │                   GLOBAL IDENTITY                      │
       │  UserAccountEntity (usr-101, email, bcrypt, status)   │
       └───────────────────────────┬────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │  SCHOOL A MEMBERSHIP  │                 │  SCHOOL B MEMBERSHIP  │
   │  Role: TEACHER        │                 │  Role: PARENT         │
   │  Status: ACTIVE       │                 │  Status: ACTIVE       │
   │  School: I2A-SCH-001  │                 │  School: I2A-SCH-002  │
   └───────────────────────┘                 └───────────────────────┘
```

---

### 2. Domain Data Models

#### 2.1 User Account Entity (`UserAccountEntity`)
Defined in [src/types/domain.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/types/domain.ts#L285-L300):
```typescript
export interface UserAccountEntity {
  id: string;                                  // "usr-xxx"
  email: string;                               // Unique indexed
  phone?: string;
  name: string;
  role: SystemUserRole;
  schoolId: string;                            // Primary branch ("ALL" for SUPER_ADMIN)
  orgId?: string | null;                       // Organization if part of a group
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'LOCKED' | 'DISABLED';
  studentId?: string;                          // For STUDENT users
  childrenIds?: string[];                      // For PARENT users
  assignedClasses?: string[];                  // For TEACHER users
  subjects?: string[];                         // For TEACHER users
  createdAt: string;
  updatedAt: string;
}
```

#### 2.2 Branch / Membership Assignment Entity (`UserBranchAssignmentEntity`)
Defined in [src/types/domain.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/types/domain.ts#L302-L312):
```typescript
export interface UserBranchAssignmentEntity {
  id: string;
  userId: string;                              // FK -> UserAccountEntity.id
  schoolId: string;                            // FK -> BranchCampus.id
  role: SystemUserRole;
  isPrimaryBranch: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'ARCHIVED';
  createdAt: string;
}
```

---

### 3. Lifecycle Decoupling & Revocation Semantics

| Scenario | User Account Status | Membership Status | Access to Target School | System Response |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Access** | `ACTIVE` | `ACTIVE` | **Allowed** | 200 OK |
| **Global Account Suspension** | `SUSPENDED` | `ACTIVE` | **Blocked** | 403 `ACCOUNT_SUSPENDED` |
| **Global Account Disabled** | `DISABLED` | `ACTIVE` | **Blocked** | 403 `ACCOUNT_DISABLED` |
| **Brute-Force Lockout** | `LOCKED` | `ACTIVE` | **Blocked** | 403 `ACCOUNT_SUSPENDED` |
| **School Membership Revoked** | `ACTIVE` | `REVOKED` | **Blocked** | 403 `MEMBERSHIP_REVOKED` |
| **Non-Existent User Account** | Not in DB | N/A | **Blocked** | 401 `USER_NOT_FOUND` |

---

### 4. Zero-Trust Enforcement against Client Overrides

A common vulnerability in multi-tenant architectures is accepting client-provided parameters (`req.body.schoolId`, `req.body.role`, `req.body.permissions`, `req.body.tenantId`) to dictate authorization.

In i2A SchoolOS:
1. **Server-Side Token Verification**: The `authenticateToken` middleware cryptographically verifies the bearer JWT against `process.env.JWT_SECRET`, loads the authoritative `UserAccountEntity` from MongoDB, and populates `req.user`.
2. **Authoritative Scoping**: `req.user.schoolId` and `req.user.role` are immutable for the request lifecycle.
3. **Cross-Tenant Guard**: If a non-SuperAdmin sends a foreign `schoolId` in `req.params`, `req.query`, or `req.body`, the `enforceTenant` middleware rejects the request with HTTP 403 `CROSS_TENANT_VIOLATION`.
4. **Whitelisted Field Writes**: Mutation endpoints (e.g. `POST /api/students`, `PUT /api/students/:id`) explicitly whitelist allowable fields. Sensitive metadata (`schoolId`, `id`, `createdAt`) are derived exclusively from server session state.

---

### 5. Verification Evidence

The identity and membership separation is exhaustively validated by:
- **Scenario 06**: Rejection of `DISABLED` accounts with 403 `ACCOUNT_DISABLED`.
- **Scenario 07**: Rejection of `SUSPENDED` accounts with 403 `ACCOUNT_SUSPENDED`.
- **Scenario 08**: Rejection of `LOCKED` accounts with 403 `ACCOUNT_SUSPENDED`.
- **Scenario 09**: Rejection of `REVOKED` memberships with 403 `MEMBERSHIP_REVOKED`.
- **Scenario 10**: Rejection of ghost user tokens with 401 `USER_NOT_FOUND`.
- **Scenario 13**: Rejection of foreign `schoolId` injection in request body with 403 `CROSS_TENANT_VIOLATION`.
- **Scenario 14**: Neutralization of client-submitted `role: 'SUPER_ADMIN'` in request payloads.
