# i2A SchoolOS — Master Prompt 03B: Database Index Safety Review
**Document ID:** `DOC-MP03B-INDEX-SAFETY-004`  
**Phase:** Master Prompt 03B — Domain Model Forensic Verification & Regression Gate  
**Auditor:** Database Reliability Engineer, Data Safety Auditor  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary & Audit Scope

This audit inspects the database index definitions, startup invocation lifecycle, error-handling resilience, and production deployment safety within [`server/db.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/db.js).

In accordance with Section 6 of Master Prompt 03B:
> *"यदि code में index definitions मौजूद हैं, लेकिन यह प्रमाण नहीं है कि वे सुरक्षित रूप से deploy किए जा सकते हैं, तो स्थिति `PARTIAL` रखें।"*

This report distinguishes between verified synthetic execution and the operational readiness required for future production rollout.

---

## 2. Startup Call Sites & Invocation Lifecycle

- **Invocation Point (`server/db.js`, lines 28–41):**
  ```javascript
  export async function getDb() {
    if (!db) {
      const activeDbName = getDatabaseName();
      client = new MongoClient(MONGO_URI, { ... });
      await client.connect();
      db = client.db(activeDbName);
      console.log(`🗄️ [MongoDB] Connected to database: "${activeDbName}" at ${MONGO_URI}`);
      await initializeIndexes(db);
    }
    return db;
  }
  ```
- **Lifecycle Assessment:**
  - `initializeIndexes(db)` is called **lazily once** on initial database connection. Subsequent calls to `getDb()` reuse the cached `db` instance without re-executing index commands.
  - **Error Boundary (lines 144–146):**
    ```javascript
    try {
      // index definitions
    } catch (err) {
      console.warn('⚠️ [MongoDB] Index initialization notice:', err.message);
    }
    ```
    If index creation encounters an error (e.g. timeout or duplicate existing records), the exception is safely caught and logged. The server process **does not crash**, maintaining high availability.
- **Unintended Mutation Risk on Production Startup:**
  - `.createIndex()` in MongoDB is a schema/metadata operation that builds index B-trees. It **never modifies, deletes, or alters document values**.
  - Therefore, running index initialization carries **zero document mutation risk**.

---

## 3. Forensic Inspection of Domain Index Specifications

| Collection | Key Specification | Options | Tenant Scoped? | Duplicate Conflict Risk | Synthetic Status | Production Rollout Status |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `organizations` | `{ id: 1 }` | `{ unique: true }` | Global PK | Zero (deterministic string IDs) | **PASS** | **PARTIAL** (Pending prod dry-run) |
| `organizations` | `{ orgCode: 1 }` | `{ unique: true, sparse: true }` | Global Code | Safe (sparse allows missing codes) | **PASS** | **PARTIAL** |
| `organizations` | `{ parentOrgId: 1 }` | Standard | N/A | Zero | **PASS** | **PASS** |
| `academic_sessions` | `{ id: 1 }` | `{ unique: true }` | Global PK | Zero | **PASS** | **PARTIAL** |
| `academic_sessions` | `{ schoolId: 1, sessionName: 1 }` | `{ unique: true }` | **YES** (`schoolId`) | If legacy school had duplicate sessions, index build would fail. | **PASS** | **PARTIAL** |
| `classes` | `{ id: 1 }` | `{ unique: true }` | Global PK | Zero | **PASS** | **PARTIAL** |
| `classes` | `{ schoolId: 1, name: 1 }` | Standard | **YES** | Zero (non-unique) | **PASS** | **PASS** |
| `sections` | `{ id: 1 }` | `{ unique: true }` | Global PK | Zero | **PASS** | **PARTIAL** |
| `student_enrollments` | `{ id: 1 }` | `{ unique: true }` | Global PK | Zero | **PASS** | **PARTIAL** |
| `student_enrollments` | `{ schoolId: 1, studentId: 1, academicSessionId: 1 }` | `{ unique: true }` | **YES** (`schoolId`) | Compound UK prevents duplicate enrollment in same session. | **PASS** | **PARTIAL** |
| `guardian_relationships`| `{ id: 1 }` | `{ unique: true }` | Global PK | Zero | **PASS** | **PARTIAL** |
| `guardian_relationships`| `{ schoolId: 1, studentId: 1, guardianUserId: 1 }`| `{ unique: true }` | **YES** (`schoolId`) | Prevents duplicate parent-student link. | **PASS** | **PARTIAL** |
| `guardian_relationships`| `{ guardianUserId: 1 }` | Standard | N/A | Zero | **PASS** | **PASS** |

---

## 4. Potential Impact of Pre-Existing Duplicate Records

In a live production database with years of unconstrained inserts:
1. If two records share `{ schoolId: 'SCH-01', sessionName: '2026-2027' }`, MongoDB will throw error `E11000 duplicate key error collection` during unique index creation.
2. In i2A SchoolOS, `server/db.js` catches this error in the notice handler:
   `⚠️ [MongoDB] Index initialization notice: E11000 duplicate key error...`
3. **Safety Protection:** The system **never** runs destructive background deletions (e.g. `deleteMany`) to force index creation.
4. **Production Pre-Requisite:** Prior to deploying these unique indexes to production `i2a_schoolos`, an idempotent pre-migration script must query for duplicate compound tuples and present them for administrative remediation.

---

## 5. Audit Verdict & Classification

- **Synthetic Test Database (`i2a_schoolos_synthetic_test`):** **`PASS`**  
  All indexes were successfully created and verified via Vitest automated tests.
- **Production Deployment Readiness (`i2a_schoolos`):** **`PARTIAL`**  
  In strict accordance with Section 6 of Master Prompt 03B, index definitions are verified in code and synthetic environments, but production deployment must remain `PARTIAL` until explicit Phase B pre-migration dry-runs confirm zero duplicate conflicts on live data.
