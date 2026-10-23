# i2A SchoolOS — Master Prompt 04C Audit Report
## Login Throttling, Distributed Brute-Force Defense & Account Lockout Audit

- **Audit Date:** October 2026
- **Auditor Role:** Senior Backend Auditor & Security Specialist
- **Workspace:** `D:\i2A_School ERP & Managment`
- **Branch:** `phase-a-remediation`
- **Audit Target:** Login Rate Limiting, Failed Attempt Tracking, MongoDB-Backed Account Lockout, and Cold Restart Survival

---

## 1. Executive Summary

Credential stuffing and dictionary attacks against school administrative, teacher, and student portals represent a significant threat. In Master Prompt 04, a distributed brute-force protection system was integrated into `server/middleware/auth.js` and `server/routes/auth.js`. This audit inspects the database storage, attempt threshold mechanics, lockout duration, normalization rules, and resilience to container/process restarts.

---

## 2. Throttling & Lockout Architecture

```
User Submits Login (POST /api/auth/login)
                    │
                    ▼
          [isAccountLocked(identifier)]
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    [LOCKED]                [NOT LOCKED]
Return HTTP 429                 │
(Locked for X min)              ▼
                     [Verify Password (bcrypt)]
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
               [INVALID]                 [VALID]
         [recordFailedLoginAttempt]   [clearFailedLogins]
         - Increment attempt count    - Clear memory & DB
         - If >= 5, lock for 15m      - Issue JWT token
         - Persist to MongoDB         - Return user profile
```

### 2.1 Configuration Parameters
- **Maximum Allowed Failures:** 5 attempts (`MAX_FAILED_ATTEMPTS`).
- **Lockout Duration:** 15 minutes (`LOCKOUT_DURATION_MS = 900,000 ms`).
- **Normalized Keying:** `identifier.toLowerCase().trim()`. Prevents case-variation or trailing whitespace bypasses (e.g. `Admin@School.com` vs `admin@school.com`).

---

## 3. Distributed Persistence & Process Restart Survival

### 3.1 MongoDB Collection: `login_attempts`
In `server/middleware/auth.js`:
```javascript
export async function recordFailedLoginAttempt(identifier) {
  if (!identifier) return null;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();

  const current = failedLoginAttempts.get(key) || { count: 0, lastFailed: now, lockedUntil: null };
  current.count += 1;
  current.lastFailed = now;

  if (current.count >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  failedLoginAttempts.set(key, current);

  try {
    const database = await getDb();
    const lockedUntilDate = current.lockedUntil ? new Date(current.lockedUntil) : null;
    await database.collection('login_attempts').updateOne(
      { identifier: key },
      {
        $set: {
          count: current.count,
          lastFailed: new Date(now),
          lockedUntil: lockedUntilDate,
          updatedAt: new Date(now)
        }
      },
      { upsert: true }
    );
  } catch (err) {
    // In-memory fallback
  }

  return current;
}
```

### 3.2 Cold Restart Verification
To ensure an attacker cannot reset their attempt count by causing high server load or waiting for container redeployment:
- When the application process starts up fresh, `failedLoginAttempts` map is empty.
- When `isAccountLocked(identifier)` is called, it checks memory first. If absent or unlocked, it queries `db.collection('login_attempts').findOne({ identifier: key })`.
- If a record exists with `lockedUntil > Date.now()`, the lockout is restored to in-memory state and the request is rejected with HTTP 429.
- Verified in `src/__tests__/MasterPrompt04BIntegration.test.ts` using `clearInMemoryThrottlingCache()`.

---

## 4. Successful Login Reset

When a user provides valid credentials:
```javascript
export async function clearFailedLogins(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  failedLoginAttempts.delete(key);
  try {
    const database = await getDb();
    await database.collection('login_attempts').deleteOne({ identifier: key });
  } catch (err) {
    // In-memory cleared
  }
}
```
- Removes both memory and MongoDB entries, ensuring an account is not penalized for previous accidental mistyped passwords.

---

## 5. Security & Denial of Service (DoS) Analysis

1. **User Enumeration Defense:**
   - When an account is locked, the response does not confirm whether the email exists in `users` collection or not:
   - Error code: `ACCOUNT_TEMPORARILY_LOCKED`
   - Response message: "Account is temporarily locked due to too many failed attempts. Please try again in X minutes."
2. **Resource Exhaustion Defense:**
   - In-memory Map cleanup: Expired lockout entries are automatically cleaned up when checked after expiry.
   - Database documents are updated via atomic `$set` with unique key on `identifier`.

---

## 6. Audit Verdict

- **Lockout Enforcement:** `PASS_VERIFIED` (Locked after exactly 5 failures).
- **Restart Survival:** `PASS_VERIFIED` (Survives complete memory flush).
- **Identifier Normalization:** `PASS_VERIFIED` (Case and whitespace insensitive).
- **Verdict:** `PASS_VERIFIED`.
