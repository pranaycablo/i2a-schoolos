# i2A SchoolOS — Master Prompt 06
## Phase 05 Security & Credentials Preflight Audit Report

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Branch:** `phase-a-remediation`  
**Auditor Roles:** Principal Security Architect, IAM Specialist, MongoDB Security Engineer, Independent QA Auditor  

---

### 1. Executive Summary

During the Phase 05 retrospective and Phase 06 preflight audit, two critical security vectors were identified and remediated prior to proceeding with broader IAM verification:

1. **Cleartext Credential Exposure Vector**:
   - In `src/context/SchoolContext.tsx`, `dispatchCredentialsNotification` generated email dispatch payloads storing raw cleartext passwords (e.g. `'Welcome@2026'`, `'Admin@2026#Launch'`, or `'Student@2026'`).
   - In `src/components/layout/NotificationToast.tsx`, the `EmailPreviewModal` rendered the raw cleartext password with a one-click clipboard copy button.
   - In `src/components/shell/NotificationDrawer.tsx`, any active user could open the drawer and click "View Credentials Email" without role authorization, potentially exposing onboarding passwords.
2. **Production Database Safety Preflight Violation**:
   - In `src/__tests__/DatabaseSafetyPreflight.test.ts` (Safety Check 6) and `src/__tests__/DomainModelAndHierarchy.test.ts` (Scenario 14), tests were directly invoking `db.client.db('i2a_schoolos').collection('users').countDocuments()` to verify baseline invariants.
   - While intended to confirm zero pollution, Master Prompt 06 mandates: *"Production database `i2a_schoolos` से कोई connection, query, write, migration, index creation या record-count verification न करें... यदि कोई safety test production database को query करता है, तो उसे fail-closed बनाएं और सुरक्षित synthetic fixture पर स्थानांतरित करें।"*

Both issues have been remediated with zero-bypass, fail-closed enforcement and verified across the complete test suite.

---

### 2. Forensic Analysis & Root Causes

#### 2.1 Credential Exposure Analysis
- **Root Cause**: During early Phase 05 UI shell prototyping, a developer-friendly email simulation preview was added to test dispatch notifications without third-party SMTP servers. The dispatch payload was placed into component state with plain string passwords.
- **Risk Severity**: High. If an attacker opened the notification panel or inspected browser state in a shared terminal, initial passwords for newly registered principals, teachers, or students would be exposed.

#### 2.2 Production DB Querying in Tests
- **Root Cause**: Safety Check 6 was written in Phase 02 to confirm that test runs did not increase record counts in `i2a_schoolos`. However, querying production databases in automated test suites creates operational risk (potential connection exhaustion, race conditions, or accidental contamination if a test writes under mistaken context).
- **Remediation Target**: Replace production document queries with fail-closed assertions ensuring that attempting to configure `TEST_DB_NAME = 'i2a_schoolos'` throws `DATABASE_SAFETY_VIOLATION`, and verify that the active test database name is strictly `i2a_schoolos_synthetic_test`.

---

### 3. Concrete Code Changes Implemented

#### 3.1 Credential Redaction in `src/context/SchoolContext.tsx`
```typescript
// File: src/context/SchoolContext.tsx (lines 1018-1037)
const dispatchCredentialsNotification = (params: { ... }): SystemNotification => {
  // Privacy & Security: Never store cleartext passwords in notification payloads or client state
  const pwd = '•••••••••••• (Dispatched securely to recipient)';
  const schoolTitle = params.schoolName || branding.name;
  const schId = params.schoolId || activeTenant?.id || 'I2A-SCH-000001';

  const emailPayload: DispatchedEmailPayload = {
    to: params.recipientEmail,
    recipientName: params.recipientName,
    subject: `Official Login Credentials & WebApp Access — ${schoolTitle} (i2A SchoolOS)`,
    schoolName: schoolTitle,
    schoolId: schId,
    role: params.role,
    loginId: params.loginId,
    username: params.username,
    password: pwd,
    loginUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
    webAppDownloadUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
    dispatchedAt: new Date().toLocaleString('en-IN')
  };
  ...
};
```

#### 3.2 Masking & Copy Deactivation in `src/components/layout/NotificationToast.tsx`
```tsx
// File: src/components/layout/NotificationToast.tsx (lines 124-142)
{[
  { label: language === 'hi' ? 'स्कूल / संस्था' : 'School / Institution', value: payload.schoolName, key: 'school' },
  { label: language === 'hi' ? 'स्कूल ID' : 'School ID', value: payload.schoolId, key: 'schoolid' },
  { label: language === 'hi' ? 'लॉगिन ID (Username)' : 'Login ID / Username', value: payload.username, key: 'username', mono: true },
  { label: language === 'hi' ? 'पासवर्ड (Password)' : 'Password (Initial Setup)', value: '•••••••••••• (Sent securely to registered recipient)', key: 'password', mono: true, sensitive: true },
  { label: language === 'hi' ? 'भूमिका' : 'Role / Access Level', value: payload.role, key: 'role' },
].map(({ label, value, key, mono, sensitive }) => (
  <div key={key} className="flex items-center justify-between gap-2">
    <span className="text-slate-500 dark:text-slate-400 font-medium min-w-28">{label}</span>
    <div className="flex items-center gap-1.5 flex-1 justify-end">
      <span className={`${mono ? 'font-mono' : 'font-bold'} text-slate-900 dark:text-white text-[11px] ${sensitive ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 px-2 py-0.5 rounded-lg text-amber-700 dark:text-amber-300' : ''}`}>
        {sensitive ? '•••••••••••• (Sent securely to recipient)' : value}
      </span>
      {!sensitive && (
        <button
          onClick={() => copy(value || '', key)}
          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-500 hover:text-indigo-600 transition-all"
          title="Copy"
        >
          <CheckCheck className={`w-3 h-3 ${copied === key ? 'text-emerald-500' : ''}`} />
        </button>
      )}
    </div>
  </div>
))}
```

#### 3.3 Role-Gated Access in `src/components/shell/NotificationDrawer.tsx`
```tsx
// File: src/components/shell/NotificationDrawer.tsx
const { notifications, markNotificationAsRead, clearAllNotifications, language, currentRole } = useSchool();
...
const canViewCredentials = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(currentRole);
...
{n.emailPayload && canViewCredentials && (
  <button
    type="button"
    onClick={() => setActiveEmailModal(n.emailPayload || null)}
    className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
  >
    <Mail className="h-3 w-3" />
    View Credentials Dispatch Record
  </button>
)}
```

#### 3.4 Production DB Query Elimination in Test Suites
- In `src/__tests__/DatabaseSafetyPreflight.test.ts`:
```typescript
it('Safety Check 6: Primary application database (i2a_schoolos) is protected and isolated from test execution', async () => {
  // Fail-closed verification: active test db is strictly isolated from production DB name
  const db = await getDb();
  expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
  expect(db.databaseName).not.toBe('i2a_schoolos');

  // Explicitly test that attempting to target production database in test mode fails closed
  process.env.TEST_DB_NAME = 'i2a_schoolos';
  expect(() => getDatabaseName()).toThrowError(/DATABASE_SAFETY_VIOLATION.*cannot be identical to the primary application database/);
});
```
- In `src/__tests__/DomainModelAndHierarchy.test.ts`:
```typescript
it('Scenario 14: Confirms test client is strictly isolated to synthetic test database', async () => {
  expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
  expect(db.databaseName).not.toBe('i2a_schoolos');
  expect(db.databaseName).not.toBe('i2a_schoolos_test');
});
```

---

### 4. Verification & Gate Confirmation

| Audit Check | Previous State | Remediated State | Status |
| :--- | :--- | :--- | :--- |
| **Notification Payload Password** | Raw string (`Welcome@2026`) | Masked (`••••••••••••`) | **PASS_VERIFIED** |
| **Email Modal Password Rendering** | Cleartext + Clipboard Copy | Masked + Copy Disabled | **PASS_VERIFIED** |
| **Notification Drawer Access** | Any unprivileged user | Role-gated (`canViewCredentials`) | **PASS_VERIFIED** |
| **Production DB Test Queries** | Direct query to `i2a_schoolos` | Fail-closed synthetic isolation | **PASS_VERIFIED** |
| **Quarantine Database DB-Check** | Strict throw on `i2a_schoolos_test` | Strict throw on `i2a_schoolos_test` | **PASS_VERIFIED** |

All preflight checks pass with zero regression across all test suites.
