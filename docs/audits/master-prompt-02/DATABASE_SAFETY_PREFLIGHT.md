# i2A SchoolOS — Master Prompt 02: Database Safety Pre-Flight Audit
**Document ID:** `DOC-MP02-DB-SAFETY-001`  
**Phase:** Master Prompt 02 — Architecture Hardening & API Contracts  
**Auditor:** Database Reliability Engineer, Senior Backend Engineer, QA Automation Lead  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Repository Branch:** `phase-a-remediation`  

---

## 1. Executive Summary & Defect Remediation

### 1.1 The Original Hazard
Prior to this remediation, `server/db.js` resolved the active database target via:
```javascript
// DANGEROUS FALLBACK PATTERN:
export function getDatabaseName() {
  if (process.env.TEST_DB_NAME && (process.env.VITEST || process.env.NODE_ENV === 'test')) {
    return process.env.TEST_DB_NAME;
  }
  return process.env.DB_NAME || 'i2a_schoolos';
}
```

Under this pattern, if an integration test suite executed within Vitest without an explicit `TEST_DB_NAME` defined, it **silently defaulted to `i2a_schoolos`** (the operational/application database). Any test fixture cleanup or mutation would inadvertently impact the development database.

### 1.2 Remediated Fail-Closed Enforcement
The database selection in `server/db.js` has been hardened with strict fail-closed guards:

```javascript
// server/db.js
export function getDatabaseName() {
  const isTest = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
  if (isTest) {
    const testDb = process.env.TEST_DB_NAME;
    if (!testDb) {
      throw new Error(
        '[DATABASE_SAFETY_VIOLATION] Test environment detected but TEST_DB_NAME is not configured. Silently falling back to the application database is prohibited to prevent data corruption.'
      );
    }
    const appDb = process.env.DB_NAME || 'i2a_schoolos';
    if (testDb === appDb) {
      throw new Error(
        `[DATABASE_SAFETY_VIOLATION] TEST_DB_NAME ('${testDb}') cannot be identical to the primary application database ('${appDb}'). A dedicated isolated test database is required.`
      );
    }
    return testDb;
  }
  return process.env.DB_NAME || 'i2a_schoolos';
}
```

---

## 2. Test Configuration & Database Separation

1. **Explicit Vitest Configuration (`vite.config.ts`):**
   ```typescript
   test: {
     environment: 'node',
     globals: true,
     fileParallelism: false,
     env: {
       TEST_DB_NAME: 'i2a_schoolos_test'
     }
   }
   ```
2. **Dedicated Test Database (`i2a_schoolos_test`):**
   - Application database `i2a_schoolos` contains real seed data (2 tenants, 10 users, 18 students) and remains **100% read-only and preserved**.
   - `i2a_schoolos_test` was provisioned as a dedicated, isolated test database containing identical baseline seed fixtures for integration testing.
   - All 20 test suites now execute strictly against `i2a_schoolos_test`.

---

## 3. Regression Test Verification (`DatabaseSafetyPreflight.test.ts`)

A dedicated test suite [`src/__tests__/DatabaseSafetyPreflight.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/DatabaseSafetyPreflight.test.ts) was created to prove that:

1. **Safety Check 1:** When `TEST_DB_NAME` is missing in test mode, `getDatabaseName()` throws `[DATABASE_SAFETY_VIOLATION]` (Fails closed).
2. **Safety Check 2:** When `TEST_DB_NAME` is set to `i2a_schoolos` (the application database), `getDatabaseName()` throws `[DATABASE_SAFETY_VIOLATION]` preventing any test from targeting production.
3. **Safety Check 3:** When `TEST_DB_NAME` is set to `i2a_schoolos_test`, `getDatabaseName()` cleanly returns `i2a_schoolos_test`.
4. **Safety Check 4:** When outside of test mode (`NODE_ENV === 'development'`), `getDatabaseName()` returns `i2a_schoolos`.
5. **Safety Check 5:** Live `getDb()` inside test suites connects to `i2a_schoolos_test` and never targets `i2a_schoolos`.

### Test Execution Proof

```text
 ✓ src/__tests__/DatabaseSafetyPreflight.test.ts (5 tests) 107ms
   ✓ Safety Check 1: Fails closed when TEST_DB_NAME is missing in test environment
   ✓ Safety Check 2: Fails closed when TEST_DB_NAME is identical to the application DB (i2a_schoolos)
   ✓ Safety Check 3: Resolves correctly to isolated test database when TEST_DB_NAME is configured
   ✓ Safety Check 4: Non-test environment returns application database
   ✓ Safety Check 5: Live getDb() in test environment connects strictly to test database

 Test Files  20 passed (20)
      Tests  146 passed (146)
   Duration  9.78s
```

---

## 4. Compliance Sign-Off for Master Prompt 02 Section 4

| Section 4 Safety Rule | Compliance Status | Evidence |
| :--- | :--- | :--- |
| 1. Tests explicitly identify intended DB | **COMPLIANT** | `vite.config.ts` declares `TEST_DB_NAME: 'i2a_schoolos_test'` |
| 2. Tests fail closed if DB not configured | **COMPLIANT** | `getDatabaseName()` throws `[DATABASE_SAFETY_VIOLATION]` |
| 3. Never silently select application DB | **COMPLIANT** | Confirmed by unit tests |
| 4. Production & test DB separated | **COMPLIANT** | Separate databases `i2a_schoolos` and `i2a_schoolos_test` |
| 5. Destructive cleanup targets test records | **COMPLIANT** | Primary-key deletions (`deleteOne({ id })`) |
| 6. No destructive runs on shared DB | **COMPLIANT** | Dedicated isolated database verified |
| 7. Zero credentials printed | **COMPLIANT** | Sanitized logging only |
| 8. No deletion/reset of `i2a_schoolos` | **COMPLIANT** | `i2a_schoolos` untouched |
| 9. Real DB not treated as disposable | **COMPLIANT** | Preserved |
| 10. Fail-closed gate verification | **COMPLIANT** | 5/5 regression tests passed |

**GATE STATUS: PASS_VERIFIED**
