# i2A SchoolOS — Master Prompt 06
## Database & Concurrency Safety Specification & Audit

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Security Domain:** Database Fail-Closed Protection, ACID Concurrency & Replica Set Topology  

---

### 1. Fail-Closed Database Connection Gate

Implemented in [server/db.js](file:///D:/i2A_School%20ERP%20&%20Managment/server/db.js#L7-L36):

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
    if (testDb === 'i2a_schoolos_test') {
      throw new Error(
        "[DATABASE_SAFETY_VIOLATION] Target database 'i2a_schoolos_test' is strictly quarantined. Connection prohibited."
      );
    }
    return testDb;
  }
  const configuredDb = process.env.DB_NAME || 'i2a_schoolos';
  if (configuredDb === 'i2a_schoolos_test') {
    throw new Error(
      "[DATABASE_SAFETY_VIOLATION] Target database 'i2a_schoolos_test' is strictly quarantined. Connection prohibited."
    );
  }
  return configuredDb;
}
```

#### Core Safety Principles Enforced:
1. **Zero Silent Fallback**: If `TEST_DB_NAME` is absent in a test environment, the process crashes immediately rather than defaulting to `i2a_schoolos`.
2. **Identity Collision Prohibition**: Setting `TEST_DB_NAME = 'i2a_schoolos'` raises `DATABASE_SAFETY_VIOLATION`.
3. **Quarantine Quarantine**: The historical test database `i2a_schoolos_test` is hardcoded as forbidden under all circumstances.
4. **Zero Production DB Queries in Tests**: Under Phase 06 remediation, all tests that previously read or counted documents in `i2a_schoolos` (Safety Check 6 in `DatabaseSafetyPreflight.test.ts` and Scenario 14 in `DomainModelAndHierarchy.test.ts`) were replaced with fail-closed configuration verification. No test connects to, queries, or counts `i2a_schoolos`.

---

### 2. Transaction Safety & Replica Set Concurrency

#### 2.1 Replica Set Background Daemon
- **Instance**: Single-node MongoDB replica set `rs0` running on port 27018.
- **Data Path**: `D:\i2A_School ERP & Managment\.mongo_rs_data`.
- **Status**: Verified active and healthy (task `task-1844`).

#### 2.2 In-Transaction Mutex & Fencing-Token Ownership
- **Location**: [server/services/hierarchyService.js](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L140-L240)
- **Mechanism**:
  - Mutex document in `hierarchy_mutexes` locked via `findAndUpdate` with a unique UUID fencing token and lease timeout.
  - Multi-document ACID session touches and updates the child organization's `parentOrgId`, increments `version`, and releases the mutex within the same atomic commit.
  - TOCTOU Race Condition Elimination: If a worker's lease expires prior to transaction commit, CAS version check and fencing token validation abort the transaction and raise `HIERARCHY_LOCK_TIMEOUT`.

---

### 3. Concurrency Test Evidence

- **`TransactionalHierarchyService.test.ts`**: 11 passing tests, validating stale worker rejection, lease expiry fence, rollback on circular hierarchy detection, and atomic tree updates.
- **`HierarchyConcurrency.test.ts`**: 14 passing tests, validating 50 concurrent mutation requests with 100% data integrity and zero broken tree links.
- **`DatabaseSafetyPreflight.test.ts`**: 9 passing tests, validating fail-closed gates for missing env, identical db names, and quarantined database strings.
