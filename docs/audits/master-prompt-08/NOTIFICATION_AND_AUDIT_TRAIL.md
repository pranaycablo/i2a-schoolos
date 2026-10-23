# Notification & Audit Trail Report
**i2A SchoolOS | Phase 08 — Institution Onboarding Security & Compliance**
*Document Version:* 1.0.0  
*Audit Scope:* Notification Engine, Append-Only Structured Audit Trail, and Forensic Traceability

---

## 1. Notification Event Dispatch

Every state change in the institution onboarding lifecycle triggers a structured notification recorded in the `notifications` collection:

| Event Trigger | Notification Type | Recipient | Content |
|---|---|---|---|
| Public Registration Intake | `APPLICATION_SUBMITTED` | Applicant Email | Acknowledges submission, provides application reference number (`REG-2026-XXXXXX`), sets expectation for 24–48h verification. |
| Super Admin Requests Correction | `APPLICATION_NEEDS_CORRECTION` | Applicant Email | Summarizes reviewer feedback, instructs applicant on required documentation rectifications. |
| Super Admin Rejection | `APPLICATION_REJECTED` | Applicant Email | Formal notification of application ineligibility with policy/document compliance explanation. |
| Super Admin Approval | `TENANT_ACTIVATED` | Applicant Email | Welcome announcement containing assigned Tenant ID (`I2A-SCH-XXXXXX`) and activation invitation reference. |

### Notification Document Schema
```json
{
  "id": "NOTIF-1729345000000-abcd",
  "schoolId": "PLATFORM",
  "recipientEmail": "principal@nalanda.edu.in",
  "type": "APPLICATION_SUBMITTED",
  "title": "School Application Received",
  "message": "Thank you for registering [Nalanda International School]. Your tracking reference is REG-2026-891042.",
  "applicationNo": "REG-2026-891042",
  "createdAt": "2026-10-19T14:14:25.000Z",
  "read": false
}
```

---

## 2. Forensic Immutable Structured Audit Trail

All operations performed by public applicants and Super Admins are recorded into the append-only `audit_logs` collection via `logAuditEvent()`.

### Logged Onboarding Audit Actions

| Action Identifier | Actor Role | Resource | Description |
|---|---|---|---|
| `SCHOOL_APPLICATION_SUBMITTED` | `APPLICANT` | `school_applications` | Initial public intake record creation. |
| `APPLICATION_MOVED_UNDER_REVIEW` | `SUPER_ADMIN` | `school_applications` | Reviewer starts credential inspection. |
| `APPLICATION_CORRECTION_REQUESTED` | `SUPER_ADMIN` | `school_applications` | Operator flags missing/blurry KYC docs. |
| `APPLICATION_CORRECTIONS_RESUBMITTED` | `APPLICANT` | `school_applications` | Applicant provides updated data/documents. |
| `APPLICATION_CHECKLIST_UPDATED` | `SUPER_ADMIN` | `school_applications` | Verification checklist flags modified. |
| `APPLICATION_REJECTED` | `SUPER_ADMIN` | `school_applications` | Application formally rejected with reason code. |
| `TENANT_PROVISIONED_FROM_APPLICATION` | `SUPER_ADMIN` | `school_applications` | Isolated tenant, organization & user created. |
| `APPLICATION_CANCELLED` | `APPLICANT` | `school_applications` | Voluntary withdrawal by applicant. |

### Redaction & Sanitization Guarantees
- The `sanitizeAuditDetails` engine automatically redacts passwords, tokens, API secrets, and sensitive financial data prior to database persistence.
- Cryptographic invitation tokens generated during tenant provisioning are never recorded in audit descriptions.

### Test Verification Evidence (Test 21):
```
✓ 21. Audit Trail Record — Application lifecycle operations record immutable audit entries 6ms
```
Database query on `audit_logs` confirmed multiple structured entries present with timestamp, user ID, module, and detailed action trail.
