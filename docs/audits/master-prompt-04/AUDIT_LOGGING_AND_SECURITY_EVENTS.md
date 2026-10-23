# i2A SchoolOS — Forensic Audit Logging & Security Events Audit
**Document Reference:** `docs/audits/master-prompt-04/AUDIT_LOGGING_AND_SECURITY_EVENTS.md`  
**Phase:** Master Prompt 04 — Enterprise Security, Privacy, RBAC & Tenant Isolation  
**Date:** October 18, 2026  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Forensic Audit Logging Architecture

Accountability and non-repudiation are enforced through a centralized, structured, append-only audit logging service (`recordAuditEvent`).

### 1.1 Standardized Audit Event Schema
Source File: [`server/services/auditService.js:35-95`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/auditService.js#L35-L95)

Every security-relevant action generates an event document adhering to this schema:

```typescript
interface AuditEventDocument {
  id: string;               // Unique event identifier (e.g., audit-1729243000-1234)
  timestamp: string;        // ISO-8601 UTC timestamp
  schoolId: string;         // Authoritative tenant ID ('I2A-SCH-000001', 'PLATFORM', or 'SYSTEM')
  orgId: string | null;     // Parent Organization ID if applicable
  actorId: string;          // User ID or 'SYSTEM_JOB' or 'ANONYMOUS'
  actorName: string;        // Sanitized display name of the actor
  actorRole: string;        // Role of actor at time of event execution
  action: string;           // Canonical action verb (e.g., 'SUCCESSFUL_LOGIN')
  module: string;           // Functional module (e.g., 'AUTHENTICATION', 'ORGANIZATION_HIERARCHY')
  resourceType: string;     // Resource category ('STUDENT', 'TENANT', 'ORGANIZATION', 'FEE')
  resourceId: string | null;// Target resource identifier
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED'; // Execution outcome
  details: string;          // Sanitized human-readable summary
  ipAddress: string;        // Request IPv4/IPv6 address
  userAgent: string;        // Client browser/device User-Agent string
  correlationId: string;    // Request correlation ID for trace linking
  isSystemEvent: boolean;   // Flag distinguishing background jobs from human user actions
}
```

---

## 2. Automatic Credential & PII Sanitization

Source File: [`server/services/auditService.js:10-33`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/auditService.js#L10-L33)

To prevent credential leakage into log storage, `sanitizeAuditDetails` inspects all audit descriptions and metadata objects before database insertion:
1. **Forbidden Key Stripping:** Any metadata object containing keys such as `password`, `passwordHash`, `plainPassword`, `token`, `resetToken`, `hashedResetToken`, `otp`, `aadhaar`, `nationalId`, `secretKey`, or `creditCard` has its value replaced with `[REDACTED_SECURITY_DATA]`.
2. **Regex Scrubbing:** Query strings or text details matching `password=`, `token=`, `otp=`, or `secret=` are replaced with `[REDACTED]`.

---

## 3. Mandatory Audited Security Events

The following table catalogs the security events recorded by the platform:

| Action Verb | Triggering Event | Outcome Captured | Severity |
| :--- | :--- | :---: | :---: |
| `SUCCESSFUL_LOGIN` | Valid credentials submitted at `/api/auth/login`. | `SUCCESS` | INFO |
| `FAILED_LOGIN_ATTEMPT` | Invalid password or unknown email at `/api/auth/login`. | `DENIED` | WARNING |
| `ACCOUNT_LOCKED` | 5 consecutive failed login attempts reached. | `DENIED` | HIGH |
| `USER_LOGOUT` | User explicitly revokes session at `/api/auth/logout`. | `SUCCESS` | INFO |
| `OTP_REQUESTED` | Password reset requested at `/api/auth/forgot-password`.| `SUCCESS` | INFO |
| `PASSWORD_RESET_SUCCESSFUL` | Password updated via verified OTP and reset token. | `SUCCESS` | MEDIUM |
| `CROSS_TENANT_VIOLATION_BLOCKED` | User attempted to query or mutate a foreign school record. | `DENIED` | CRITICAL |
| `INSUFFICIENT_PERMISSIONS_BLOCKED`| User role lacks required permission for endpoint. | `DENIED` | HIGH |
| `STUDENT_PII_EXPORT` | Bulk export of student records executed at `/api/students/export`. | `SUCCESS` | HIGH |
| `HIERARCHY_MUTATION` | Organization parent pointer updated via transactional mutex. | `SUCCESS` | CRITICAL |
| `PRIVACY_REQUEST_SUBMITTED` | Data subject requested correction/erasure under DPDP. | `SUCCESS` | MEDIUM |
| `PRIVACY_REQUEST_RESOLVED` | Administrator updated status of a privacy request. | `SUCCESS` | MEDIUM |

---

## 4. Audit Log Access Control & Scoping

- **Endpoint:** `GET /api/audit-logs`.
- **Authorization:** Requires `audit.read` permission. Only `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ORG_DIRECTOR`, `PLATFORM_AUDITOR`, and `ORG_AUDITOR` are permitted.
- **Tenant Isolation:**
  - `SUPER_ADMIN` can inspect all audit events across the platform.
  - `ORG_DIRECTOR` queries are filtered to events within their organization network (`{ orgId }`).
  - Institutional administrators (`PRINCIPAL`, `ADMIN`) are strictly restricted to events within their school (`{ schoolId }`).
  - Teachers, Students, Parents, Accountants, and Staff are strictly denied access (`HTTP 403 INSUFFICIENT_PERMISSIONS`).
