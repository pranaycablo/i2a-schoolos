# MASTER PROMPT 01 — API AND DATABASE RELIABILITY AUDIT
**Project:** i2A SchoolOS | Global Multi-Tenant Education Management Platform  
**Audit Root:** `D:\i2A_School ERP & Managment`  
**Phase:** Phase D — API Contracts, Data Integrity, and Persistence Reliability  

---

## 1. Authentication Infrastructure Reliability

The authentication subsystem was reviewed in [`server/routes/auth.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/auth.js) and [`server/middleware/auth.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/auth.js):

### 1.1 Password Security
- **Algorithm:** `bcryptjs` using 10 salt rounds (`hashPassword`).
- **Timing Attack Resistance:** `comparePassword` uses standard bcrypt verification preventing timing leaks.
- **Credential Storage:** User documents store `passwordHash`. Raw passwords are never persisted.
- **Account Status Guard:** Even with correct credentials, login is rejected with HTTP 403 `ACCOUNT_SUSPENDED` if `user.status === 'SUSPENDED'` or `'LOCKED'`.

### 1.2 JWT Token Lifecycle
- **Signing:** Uses `jsonwebtoken.sign` with `process.env.JWT_SECRET` and fallback key.
- **Expiration:** Default `24h` (`JWT_EXPIRES_IN`).
- **Tampering & Expiry Rejection:** Verified by `BackendApiIntegration.test.ts` (Test 2.1 & 2.3). Missing tokens return 401 `AUTH_TOKEN_MISSING`; expired tokens return 401 `TOKEN_EXPIRED`; forged signatures return 403 `INVALID_TOKEN`.

### 1.3 OTP & Password Recovery Engine
- **Entropy:** Cryptographically strong 6-digit numeric OTP generated via `crypto.randomInt(100000, 999999)`.
- **Database Storage:** The OTP is hashed with SHA-256 before storage in `password_resets`. Plaintext OTP is never stored in the database.
- **TTL Index:** A MongoDB TTL index (`expireAfterSeconds: 600`) automatically purges expired reset requests after 10 minutes.
- **Rate Limiting:** In-memory cooldown map rejects repeated OTP requests for the same email within 60 seconds with HTTP 429 `RATE_LIMITED`.
- **Attempt Capping:** Maximum 3 incorrect OTP verification attempts before the session is permanently deleted with HTTP 403 `MAX_ATTEMPTS_EXCEEDED`.
- **Single-Use Reset Token:** Upon successful OTP verification, a high-entropy 32-byte hexadecimal reset token is generated and SHA-256 hashed. Reusing a reset token returns HTTP 400.

---

## 2. API Contract & Error Handling Reliability

### 2.1 Uniform Response Contract
All 14 route modules adhere to standard JSON response conventions:
- **Success:** Returns `{ success: true, ...data }` or standard resource representation with HTTP 200 OK or 201 Created.
- **Validation Failure:** Returns `{ error: string, code?: string }` with HTTP 400 Bad Request.
- **Authentication Failure:** Returns `{ error: string, code: 'AUTH_TOKEN_MISSING' | 'TOKEN_EXPIRED' | 'USER_NOT_FOUND' }` with HTTP 401 Unauthorized.
- **Authorization / Tenant Violation:** Returns `{ error: string, code: 'CROSS_TENANT_VIOLATION' | 'INSUFFICIENT_PERMISSIONS' }` with HTTP 403 Forbidden.
- **Resource Not Found:** Returns `{ error: string, code: 'NOT_FOUND' }` with HTTP 404 Not Found.
- **Conflict:** Returns `{ error: string, code: 'TEACHER_CONFLICT' | 'ROOM_CONFLICT' }` with HTTP 409 Conflict.
- **Rate Limit:** Returns `{ error: string, code: 'RATE_LIMITED' }` with HTTP 429 Too Many Requests.

### 2.2 Async Exception Handling & Production Sanitization
- Every async route handler is wrapped in `try ... catch` blocks.
- Unhandled rejections are caught by the global error handler in [`server/index.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/index.js):
  ```javascript
  app.use((err, req, res, _next) => {
    console.error(`❌ [Server Error] ${req.method} ${req.originalUrl}:`, err.message);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' ? { detail: err.message } : {})
    });
  });
  ```
  Internal stack traces and database internal error strings are hidden in production mode.

---

## 3. Database Integrity & Persistence Verification

### 3.1 Live Connection Management
- Implemented in [`server/db.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/db.js).
- Connection is established once and reused across all routes (connection pooling).
- Graceful shutdown handles `SIGINT` and `SIGTERM` signals by calling `closeDb()`.
- Verified live with MongoDB Community Server 7.7.0 at `mongodb://127.0.0.1:27017`.

### 3.2 Read-After-Write Consistency
- Tested and verified in [`src/__tests__/BackendApiIntegration.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/BackendApiIntegration.test.ts):
  - **Student SIS:** `POST /api/students` creates record in MongoDB; immediate `GET /api/students/:id` retrieves identical data; direct `db.collection('students').findOne()` confirms database document state.
  - **Attendance:** `POST /api/attendance/mark` executes atomic `bulkWrite`; immediate `GET /api/attendance` retrieves updated roster.
  - **Timetables:** `POST /api/timetables/cells` updates cell; subsequent conflicting request detects schedule clash directly via database query.
  - **Fees:** `POST /api/fees/receipts/collect` writes immutable receipt and creates corresponding income record in `expenses` ledger collection.

### 3.3 Server Financial Source of Truth
- In `/api/fees/receipts/collect`, client-submitted totals are ignored. The server fetches fee records from MongoDB by ID, calculates base sums, checks discounts and fines, and calculates the exact payable amount.
- In `/api/subscription/calculate-price`, even if a client requests an excessive discount (e.g., 60%), the server strictly enforces a 40% maximum discount cap.

---

## 4. Defect Discovered and Repaired During Audit

### Defect ID: `DEF-001` (Severity: P2 — Workflow Reliability)
- **Component:** [`server/routes/attendance.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/attendance.js)
- **Vulnerability:** When a Principal froze the entire school for a date using `className: 'ALL'`, the lock check in `POST /api/attendance/mark` queried `className: className || 'ALL'`. If a teacher submitted attendance with a specific class like `className: 'Class VIII'`, the query looked for `{ className: 'Class VIII' }` and failed to match the school-wide `{ className: 'ALL' }` lock record, allowing attendance marking to bypass the lock!
- **Remediation Applied:** Updated the query to evaluate an `$or` condition:
  ```javascript
  const lockRecord = await database.collection('attendance_locks').findOne({
    schoolId: req.user.schoolId,
    date,
    $or: [
      { className: className || 'ALL' },
      { className: 'ALL' }
    ],
    isLocked: true
  });
  ```
- **Verification Evidence:** Re-verified by Vitest test suite. Lock check now correctly freezes both specific classes and whole-school submissions.
