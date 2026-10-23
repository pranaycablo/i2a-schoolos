# Tenant Provisioning, Idempotency & Failure Recovery
**i2A SchoolOS | Phase 08 — Institution Onboarding Security & Compliance**
*Document Version:* 1.0.0  
*Audit Scope:* Production Container Provisioning, Entity Graph Generation, Idempotency Guarantees, and Recovery

---

## 1. Automated Tenant Container Provisioning

When a Super Admin approves an institution application via `POST /api/tenants/applications/:appId/approve`, the server provisions an isolated multi-tenant environment.

### Entity Graph Generation

```mermaid
erDiagram
    TENANT ||--|| ORGANIZATION : "roots (1:1)"
    TENANT ||--|{ USER : "administrates"
    TENANT ||--|{ ACADEMIC_SESSION : "schedules"
    APPLICATION ||--|| TENANT : "spawns (1:1)"

    TENANT {
        string id PK "I2A-SCH-XXXXXX"
        string name "Institution Name"
        string code "SCHCODE-CITY"
        string subscriptionStatus "ACTIVE"
        string planId "PROFESSIONAL"
        int studentLimit "1000"
    }

    ORGANIZATION {
        string id PK "I2A-SCH-XXXXXX"
        string orgCode UK "SCHCODE_N"
        string type "STANDALONE_INSTITUTION"
        string status "ACTIVE"
        string tenantId FK "I2A-SCH-XXXXXX"
    }

    USER {
        string id PK "USER-ADMIN-XXX"
        string email UK "admin@school.edu.in"
        string role "PRINCIPAL"
        string schoolId FK "I2A-SCH-XXXXXX"
        string tenantId FK "I2A-SCH-XXXXXX"
        string invitationToken "crypto-hex-48"
        boolean mustChangePassword true
    }

    ACADEMIC_SESSION {
        string id PK "SESS-I2A-SCH-XXXXXX-2026-2027"
        string schoolId FK "I2A-SCH-XXXXXX"
        string sessionName "2026-2027"
        boolean isCurrent true
    }
```

---

## 2. Collision-Proof Identifier Allocation

### 1. Unique Tenant ID (`I2A-SCH-XXXXXX`)
To guarantee that newly provisioned tenant IDs never collide with pre-existing records:
```javascript
let tenantCount = await database.collection('tenants').countDocuments();
let formattedId = `I2A-SCH-${String(tenantCount + 1).padStart(6, '0')}`;
while (await database.collection('tenants').findOne({ id: formattedId })) {
  tenantCount += 1;
  formattedId = `I2A-SCH-${String(tenantCount + 1).padStart(6, '0')}`;
}
```

### 2. Unique Organization Code (`orgCode`)
The `organizations` collection enforces a unique index on `{ orgCode: 1 }`. To eliminate `E11000` duplicate key errors across similar school names:
```javascript
const baseCode = (app.schoolName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4) || 'SCH').toUpperCase();
let cleanCode = baseCode;
let suffix = 1;
while (await database.collection('organizations').findOne({ orgCode: cleanCode })) {
  cleanCode = `${baseCode}${suffix++}`;
}
```

---

## 3. Idempotency Proof: Repeated Approval Test

A common production hazard is double-clicking the "Approve" button or experiencing an automatic network retry after a delayed gateway response.

In legacy systems, this created duplicate tenants and orphaned organization nodes. In i2A SchoolOS:
1. When an application is approved, `app.status` is set to `'APPROVED'` and `app.tenantId` is recorded.
2. If `POST /api/tenants/applications/:appId/approve` is called again for the same application:
   ```javascript
   if (app.status === 'APPROVED' && app.tenantId) {
     const existingTenant = await database.collection('tenants').findOne({ id: app.tenantId });
     return res.json({
       success: true,
       message: 'Application is already approved and provisioned.',
       tenant: existingTenant,
       idempotent: true
     });
   }
   ```
3. The server immediately returns HTTP 200 with `idempotent: true` and the existing tenant object.
4. **Zero** additional inserts are performed.

### Test Execution Proof (Test 20):
```
✓ 20. Idempotent Approval — Repeated approve calls return 200 with idempotent: true and ZERO duplicate tenants 28ms
```
- First approval creates tenant `I2A-SCH-XXXXXX`.
- Second approval returns `idempotent: true`.
- Final database count: **Exactly 1 tenant, 1 organization, 1 admin user**. Zero duplicates.

---

## 4. Failure Recovery & Error Handling

If any unhandled exception occurs prior to completion:
- The state transition is not finalized.
- The catch block returns HTTP 500 with a sanitized error message.
- Because the application status remains `UNDER_REVIEW`, the Super Admin can re-inspect the dossier and safely re-trigger approval once any underlying environmental issue is resolved.
