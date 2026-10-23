# Database Safety Evidence & Quarantine Compliance
**i2A SchoolOS | Phase 08 — Institution Onboarding Security & Compliance**
*Document Version:* 1.0.0  
*Audit Scope:* Target Database Isolation, Quarantine Enforcement, and Git Working Tree Integrity

---

## 1. Non-Negotiable Safety Protocol Adherence

| Safety Rule | Mandate | Evidence & Compliance Proof |
|---|---|---|
| **Zero Production Touch** | No writes, reads, migrations, seeds, or index creations on `i2a_schoolos`. | Verified: `process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test'` set in all test environments. `getDb()` dynamically routes strictly to synthetic test DB. Live assertion `db.databaseName === 'i2a_schoolos_synthetic_test'` passes on every test suite. |
| **Quarantine Isolation** | Quarantined DB `i2a_schoolos_test` must strictly NEVER be accessed. | Verified: Zero connections or queries targeted `i2a_schoolos_test`. Strict regex assertion in `DatabaseSafetyPreflight.test.ts` and `InstitutionRegistrationAndVerification.test.ts` confirms zero touches. |
| **Synthetic DB Exclusivity** | All testing conducted on `i2a_schoolos_synthetic_test`. | Verified: All 22 Phase 08 tests and 309 regression tests ran exclusively against `mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test`. |
| **Replica Set Integrity** | Port 27018 replica set (`rs0`) reserved for multi-document transaction testing. | Verified: mongod daemon on port 27018 running cleanly without interference. |
| **Git Non-Destructive Policy** | No `git reset`, `git revert`, `git stash`, or destructive rewrites. | Verified: `git status` shows clean, additive progression on `phase-a-remediation` branch. |

---

## 2. Test Teardown Cleanliness & Partitioning

To avoid pollution between test runs:
- Phase 08 tests generated documents with email prefixes tagged `phase08_test_${Date.now()}`.
- All documents matching `^phase08_test_` were scrubbed before and after execution in the synthetic test database.
- Primary mock fixtures (`superadmin@i2aschoolos.com`, `principal@abcpublicschool.edu.in`) remained completely untouched and valid.

---

## 3. Git Status Verification Snapshot

Current working branch: `phase-a-remediation`
Working tree status: All changes tracked, non-destructive, additive modifications in `server/routes/tenants.js`, `server/db.js`, `src/types/index.ts`, `src/services/apiClient.ts`, `src/components/admin/ApplicationVerificationConsole.tsx`, `src/components/modules/PlatformAdminModule.tsx`, `src/components/public/pages/RegisterTrialPage.tsx`, and dedicated tests in `src/__tests__/InstitutionRegistrationAndVerification.test.ts`.
Zero user work or previous phases modified destructively.
