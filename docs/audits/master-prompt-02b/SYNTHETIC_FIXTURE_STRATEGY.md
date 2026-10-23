# i2A SchoolOS — Master Prompt 02B: Synthetic Fixture Strategy
**Document ID:** `DOC-MP02B-SYNTHETIC-STRATEGY-003`  
**Phase:** Master Prompt 02B — Test Data Privacy & Isolation Repair  
**Auditor / Roles:** Senior Privacy Engineer, Database Security Architect  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Strategy Overview

To completely eliminate privacy risks and data leakage from testing operations, i2A SchoolOS has adopted a **100% Synthetic Test Fixture Architecture**.

Under this strategy:
1. No test reads from or copies data from the primary application database `i2a_schoolos`.
2. All baseline testing fixtures are generated deterministically using sanitized dummy data via [`scripts/seed-synthetic-test-db.js`](file:///D:/i2A_School%20ERP%20&%20Managment/scripts/seed-synthetic-test-db.js).
3. All dynamic fixtures created during test execution use high-entropy unique IDs and are torn down via exact primary keys.

---

## 2. Synthetic Data Generation Standards

Every entity provisioned in the dedicated test database `i2a_schoolos_synthetic_test` adheres to strict data privacy patterns:

### 2.1 Entity Sanitization Standards

| Attribute Type | Sanitization Standard | Implementation Pattern | Privacy Compliance |
| :--- | :--- | :--- | :--- |
| **Individual Names** | Explicit synthetic marker appended | `"Rahul Kumar (Synthetic Student)"`, `"Mrs. Sunita Mishra (Synthetic Teacher)"` | Eliminates confusion with real persons |
| **Phone / Mobile Numbers** | Reserved test prefix (dummy block) | `+91 99999 00001` to `+91 99999 00099` | Non-routable; prevents accidental SMS / WhatsApp dispatches |
| **Email Addresses** | Standard institutional test / example domains | `superadmin@i2aschoolos.com`, `parent1@test.example.com` | Prevents outbound delivery to real inboxes |
| **Physical Addresses** | Fictitious campus road strings | `"101 Synthetic Campus Road, Block A, Test City - 000001"` | Zero connection to private residences |
| **Password Hashes** | Standard bcrypt (cost factor 10) on known test secrets | `SuperAdmin@2026#`, `Principal@2026#`, `Teacher@2026#` | Zero reliance on production passwords |
| **Financial / Bank References** | Synthetic transaction codes | `TXN-SYNTH-9842104821` | Non-functional mock identifiers |

---

## 3. Dedicated Synthetic Provisioner (`scripts/seed-synthetic-test-db.js`)

A dedicated script initializes `i2a_schoolos_synthetic_test`:

```javascript
// scripts/seed-synthetic-test-db.js
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const TARGET_DB = process.env.TEST_DB_NAME || 'i2a_schoolos_synthetic_test';

// Critical Safety Interceptor
if (TARGET_DB === 'i2a_schoolos') {
  console.error('❌ [FATAL SECURITY ERROR] Synthetic test seeder is strictly forbidden from targeting application database "i2a_schoolos".');
  process.exit(1);
}
```

### Provisioned Baseline Collections:
- **`tenants`:** 2 synthetic schools (`I2A-SCH-000001` and `I2A-SCH-000002`).
- **`users`:** 10 role personas covering all access levels (`SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `TEACHER`, `ACCOUNTANT`, `STAFF`, `TRANSPORT`, `PARENT`, `STUDENT`).
- **`students`:** 3 synthetic student records with sanitized parent contacts.
- **`fee_types`:** 6 standard fee types.
- **`admissions`:** 2 synthetic admission applications.
- **`timetables`:** 1 synthetic schedule grid.

---

## 4. Dynamic Fixture Lifecycle & Teardown Protocol

For all runtime test operations, the test suite enforces:

1. **High-Entropy Unique Identifiers:**
   ```typescript
   const runTag = `reg_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
   const lockId = `lock-${schoolA}-${testDate}-${targetClass}`;
   const attId = `att_${runTag}_sc6`;
   ```
2. **Deterministic Registry & Atomic Teardown:**
   ```typescript
   afterAll(async () => {
     const db = await getDb();
     if (db) {
       for (const lockId of createdLockIds) {
         await db.collection('attendance_locks').deleteOne({ id: lockId });
       }
       for (const attId of createdAttendanceIds) {
         await db.collection('attendance').deleteOne({ id: attId });
       }
     }
   });
   ```
3. **Fail-Safe Cleanup Guarantee:** Wrapping in `try ... finally` blocks guarantees that even if test assertions fail unexpectedly, test-owned records are deleted immediately without leaving orphan records.
