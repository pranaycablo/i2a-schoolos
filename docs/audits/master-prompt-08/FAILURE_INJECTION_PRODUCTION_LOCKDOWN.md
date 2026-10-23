# FAILURE INJECTION PRODUCTION LOCKDOWN — MASTER PROMPT 08
**i2A SchoolOS | Phase 08 — Synthetic Failure Injection Hardening & Production Isolation**
**Date:** 2026-10-20  
**Status:** **CLOSED & VERIFIED**

---

## 1. Vulnerability & Threat Description

During integration testing of distributed provisioning transactions and compensatory rollbacks, test suites simulate network partitions, server crashes, and database write aborts using client request headers such as `x-simulate-failure-after-step: after-user`.

If such failure injection hooks are left open or improperly conditioned in production runtime:
1. Malicious clients or compromised administrator accounts could intentionally abort tenant onboarding, preventing institution activations.
2. Attackers could induce repeated rollback cycles to strain system resources.
3. Untrusted headers could bypass business logic.

---

## 2. Multi-Factor Fail-Closed Lockdown Architecture

To ensure failure simulation can **NEVER** be triggered in production runtime or against non-synthetic databases, a strict multi-factor gating function was engineered in [`server/routes/tenants.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/tenants.js#L115-L130):

```javascript
/**
 * Failure Injection Lockdown Helper
 * Multi-factor fail-closed gate: active ONLY in isolated test harness against synthetic test DB
 * Client-supplied headers in production mode or against production DB are strictly ignored.
 */
export function isFailureInjectionAllowed(req, dbName) {
  // Factor 1: Production runtime check (unconditional lockdown)
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  // Factor 2: Explicit test harness authorization flag
  if (process.env.ALLOW_SYNTHETIC_FAILURE_INJECTION !== 'true' && process.env.VITEST !== 'true') {
    return false;
  }
  // Factor 3: Runtime connected database identity verification
  if (dbName !== 'i2a_schoolos_synthetic_test') {
    return false;
  }
  return true;
}
```

### Application in Provisioning Route (`POST /api/tenants/applications/:appId/approve`):
In [`server/routes/tenants.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/tenants.js#L1345-L1355):
```javascript
// Gated Failure Step Acquisition:
const allowFailureInjection = isFailureInjectionAllowed(req, database.databaseName);
const failureStep = allowFailureInjection ? req.headers['x-simulate-failure-after-step'] : null;
```

And in the compensatory rollback error handler:
```javascript
if (allowFailureInjection && req.headers['x-simulate-rollback-failure'] === 'true') {
  throw new Error('SIMULATED_FAILURE: Compensatory rollback failed due to synthetic catastrophic storage error.');
}
```

### Lockdown Properties:
1. **Unconditional Production Bypass:** When `process.env.NODE_ENV === 'production'`, `isFailureInjectionAllowed()` immediately returns `false`. `failureStep` is forced to `null`, completely neutralizing any client-supplied failure headers.
2. **Database Whitelisting:** Even if `NODE_ENV` is improperly configured, if the connected database is not strictly `i2a_schoolos_synthetic_test` (e.g. `i2a_schoolos`), the gate fails closed (`false`).
3. **Zero Configuration Drift:** The test harness explicitly sets `process.env.VITEST = 'true'` only during automated test runs.

---

## 3. Adversarial Test Evidence

In [`src/__tests__/InstitutionRegistrationAndVerification.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/InstitutionRegistrationAndVerification.test.ts):

- **Test 33 (Production Lockdown of Failure Injection):**
  - Application submitted.
  - Runtime environment temporarily forced to `process.env.NODE_ENV = 'production'`.
  - Super Admin calls `/approve` with header `x-simulate-failure-after-step: after-user`.
  - **Result:** Provisioning succeeds with **HTTP 200**, creating the tenant, root organization, administrator account, and academic session.
  - The injected failure header was completely ignored, proving that production runtime is strictly protected against header-driven failure injection.
  - Environment restored to test harness.

---

## 4. Audit Verdict

Failure injection lockdown is **COMPLETE, ENFORCED, AND TEST-VERIFIED**.
Zero possibility of failure injection activation in production environments.
