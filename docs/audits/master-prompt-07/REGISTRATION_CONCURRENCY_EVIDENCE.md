# i2A SchoolOS — Registration Concurrency & Idempotency Evidence

**Audit Timestamp:** October 19, 2026  
**Auditor Roles:** Principal Security Architect, Principal Database Architect  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Concurrency Problem Statement & Root Cause

Under rapid user double-clicks, network retries, or automated bot attacks, multiple HTTP requests to `POST /api/tenants/applications` can arrive at the application server in the exact same millisecond.

### The TOCTOU (Time-of-Check to Time-of-Use) Defect:
In previous iterations, the route executed:
```javascript
const existing = await database.collection('school_applications').findOne({ adminEmail, status: 'PENDING_VERIFICATION' });
if (existing) return res.status(429)...;
await database.collection('school_applications').insertOne(newApp);
```
Under concurrent execution, multiple requests execute the `findOne()` query concurrently before any single request completes its `insertOne()` write. All concurrent requests observe `existing === null`, pass the check, and write duplicate application records into the database.

---

## 2. Deduplication Policy & Architectural Strategy

### Why Global Uniqueness on Email is Inappropriate:
An unconditional global unique index on `adminEmail` across all statuses would permanently bar:
1. An educational trust leader who manages multiple campuses from applying for a second school.
2. An applicant whose previous application was rejected or expired from legitimately reapplying in the future.
3. An institution whose 14-day trial expired from submitting an onboarding inquiry for a paid production upgrade.

### The Approved Minimal-Blast-Radius Strategy:
We enforced an **atomic database-level partial unique index** in MongoDB:
```javascript
await database.collection('school_applications').createIndex(
  { adminEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'PENDING_VERIFICATION' }
  }
);
```

### Key Technical Properties:
1. **Atomic Engine Guarantee:** MongoDB evaluates uniqueness at the storage engine level. If two concurrent threads attempt to insert documents with the same `adminEmail` where `status: 'PENDING_VERIFICATION'`, the second thread is guaranteed to fail atomically with `E11000 duplicate key error`.
2. **Lifecycle Flexibility:** Once an application transitions to `APPROVED` or `REJECTED`, the partial filter expression no longer matches, allowing subsequent legitimate submissions if permitted by institutional policy.
3. **Casing & Whitespace Normalization:** Prior to query and persistence, `adminEmail` is normalized:
   ```javascript
   const normalizedEmail = String(adminEmail).toLowerCase().trim();
   ```

### Application Error Catching in `server/routes/tenants.js`:
```javascript
try {
  await database.collection('school_applications').insertOne(newApp);
} catch (insertErr) {
  if (insertErr.code === 11000 || (insertErr.message && insertErr.message.includes('E11000'))) {
    const winningApp = await database.collection('school_applications').findOne({
      adminEmail: normalizedEmail,
      status: 'PENDING_VERIFICATION'
    });
    return res.status(429).json({
      success: false,
      error: 'An application for this email address is already pending verification. Please wait for our team to review your application.',
      code: 'DUPLICATE_APPLICATION_THROTTLED',
      applicationNo: winningApp?.applicationNo || 'PENDING'
    });
  }
  throw insertErr;
}
```

---

## 3. High Concurrency Empirical Verification (Vector 27)

To prove that duplicate records cannot be generated under high concurrency, an adversarial stress test was executed in [`PublicWebsiteAndCategoryCms.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/PublicWebsiteAndCategoryCms.test.ts#L665-L720).

### Test Setup:
- **Concurrency Load:** **25 concurrent synthetic HTTP requests** fired simultaneously via `Promise.all`.
- **Payload Variance:** Alternating uppercase and padded whitespace variants (e.g. `CONCURRENCY.APPLICANT...` vs `  concurrency.applicant...  `).
- **Target Endpoint:** `POST /api/tenants/applications`.

### Test Execution Output:
```bash
✓ Vector 27: Registration High Concurrency Stress Test: 25 concurrent requests yield exactly 1 insert and 24 throttled (1097ms)
```

### Empirical Results Breakdown:

| Metric | Target Assertion | Observed Result | Status |
|---|---|---|---|
| Successful Creations (HTTP 201) | Exactly 1 | **1** | **PASS** |
| Throttled Rejections (HTTP 429) | Exactly 24 | **24** | **PASS** |
| Other Error Codes (500, etc.) | 0 | **0** | **PASS** |
| MongoDB Records Created | Exactly 1 | **1** | **PASS** |
| Normalized Email in Document | `concurrency.applicant...` | Verified lowercase & trimmed | **PASS** |
| Verification Status of Record | `PENDING_VERIFICATION` | Verified locked | **PASS** |

---

## 4. Production Database Isolation Evidence

- The partial unique index was initialized strictly on the synthetic test database `i2a_schoolos_synthetic_test`.
- `server/db.js` enforces an explicit safeguard that prevents index operations from running against `i2a_schoolos` in non-production environments.
- **Zero index creations or schema operations were performed on production database `i2a_schoolos`.**
