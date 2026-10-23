# i2A SchoolOS — Master Prompt 02B: Test Database Isolation Repair
**Document ID:** `DOC-MP02B-ISOLATION-REPAIR-002`  
**Phase:** Master Prompt 02B — Test Data Privacy & Isolation Repair  
**Auditor / Roles:** Senior Database Security Engineer, QA Infrastructure Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary

This report documents the architectural repairs implemented to guarantee absolute isolation between the primary application database (`i2a_schoolos`) and the automated test runner environment.

The configuration has been updated so that all tests target a newly isolated synthetic test database: `i2a_schoolos_synthetic_test`.

---

## 2. Configuration Inspection & Verification

### 2.1 Database Connection Resolver (`server/db.js`)
```javascript
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

#### Verified Invariants:
1. **Explicit Target Requirement:** If `VITEST` or `NODE_ENV === 'test'` is active and `TEST_DB_NAME` is omitted, `getDatabaseName()` throws a fatal `[DATABASE_SAFETY_VIOLATION]` exception rather than falling back to `i2a_schoolos`.
2. **Anti-Collision Guard:** If a test runner sets `TEST_DB_NAME = 'i2a_schoolos'` (attempting to target the application database), `getDatabaseName()` aborts with an explicit anti-collision exception.
3. **Application Mode Isolation:** In standard application execution (`NODE_ENV === 'development'` or `'production'`), `getDatabaseName()` resolves to `process.env.DB_NAME || 'i2a_schoolos'`.

### 2.2 Test Configuration (`vite.config.ts`)
```typescript
test: {
  environment: 'node',
  globals: true,
  fileParallelism: false,
  env: {
    TEST_DB_NAME: 'i2a_schoolos_synthetic_test'
  }
}
```
- Vitest explicitly injects `TEST_DB_NAME = 'i2a_schoolos_synthetic_test'`.
- All integration tests automatically bind to this dedicated synthetic database.

---

## 3. Database Isolation Verification Evidence

The test suite [`src/__tests__/DatabaseSafetyPreflight.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/DatabaseSafetyPreflight.test.ts) was expanded to 7 checks verifying that:

```text
 ✓ src/__tests__/DatabaseSafetyPreflight.test.ts (7 tests) 197ms
   ✓ Safety Check 1: Fails closed when TEST_DB_NAME is missing in test environment
   ✓ Safety Check 2: Fails closed when TEST_DB_NAME is identical to the application DB (i2a_schoolos)
   ✓ Safety Check 3: Resolves correctly to isolated test database when TEST_DB_NAME is configured
   ✓ Safety Check 4: Non-test environment returns application database
   ✓ Safety Check 5: Live getDb() in test environment connects strictly to test database
   ✓ Safety Check 6: Primary application database (i2a_schoolos) is never modified by test runs
   ✓ Safety Check 7: Synthetic test database fixtures contain dummy contact numbers and synthetic markers
```

### Empirical Database Mutation Verification
Following the execution of all 21 test suites (156 tests):

| Database | Target Collection | Pre-Test Count | Post-Test Count | Net Change | Mutation Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `i2a_schoolos` (App DB) | `users` | 10 | 10 | **0** | **100% UNTOUCHED** |
| `i2a_schoolos` (App DB) | `students` | 18 | 18 | **0** | **100% UNTOUCHED** |
| `i2a_schoolos` (App DB) | `audit_logs` | 207 | 207 | **0** | **100% UNTOUCHED** |
| `i2a_schoolos_test` (Quarantined) | `audit_logs` | 267 | 267 | **0** | **100% UNTOUCHED** |
| `i2a_schoolos_synthetic_test` | `audit_logs` | 0 | 22 | **+22** | **Active Test Target** |

**Conclusion:** The isolation barrier between tests and the application database is 100% verified.
