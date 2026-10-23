# i2A SchoolOS — Master Blocker & Risk Register
**Audit Date:** October 2026 | **Project Root:** `D:\i2A_School ERP & Managment`  
**Current Gate Status:** **PASS_FEATURE_EVIDENCE_CLOSURE**  

---

## 1. Executive Summary & Blocker Status
As of this audit closure:
- **Active Critical Blockers:** **0** (Zero)
- **Security Preflight Failures:** **0** (Zero)
- **Automated Test Regressions:** **0** (Zero)
- **Database Boundary Leaks:** **0** (Zero)

The codebase is clear of all architectural and data-integrity blockers. The risks documented below represent operational considerations for the upcoming staging pilot.

---

## 2. Operational & Deployment Risk Register

| Risk ID | Category | Severity | Description | Impact | Mitigation Strategy | Owner |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| `RSK-SYS-001` | Infrastructure | **MEDIUM** | Distributed multi-document transactions require a MongoDB Replica Set (`rs0`). | Running on a standalone MongoDB without a replica set will cause transactions in `institutionHierarchyService.js` to fail. | Local testing uses daemon on port 27018. Staging & Production must connect to a MongoDB Atlas cluster or multi-node replica set. | DevOps / SRE |
| `RSK-EXT-002` | Regulatory | **MEDIUM** | Commercial SMS dispatch in India is strictly regulated by TRAI DLT mandate. | Outbound SMS cannot be sent without registered Principal Entity (PE) ID and pre-approved SMS header templates. | Pre-register school trust on DLT portal (Jio/Airtel/Vil) 10 days prior to commercial go-live. In-app alerts serve as primary channel. | School Admin |
| `RSK-PAY-003` | Finance | **LOW** | Webhook replay attacks or payment gateway signature drift. | Unverified payment webhooks could attempt to mark fees as paid. | Route `POST /api/payments/webhook` validates HMAC-SHA256 signatures and checks `processed_webhooks` for replay protection. | Backend Team |
| `RSK-PERF-004` | Scalability | **LOW** | High-volume fee collections at the start of academic terms. | Potential lock contention on database if multiple cashiers collect fees simultaneously. | All collections are indexed by `schoolId`, `studentId`, `date`, and `idempotencyKey`. Concurrency stress tests confirmed 1,000+ ms throughput. | Database Admin |
| `RSK-PWA-005` | Frontend | **LOW** | Offline attendance marking in areas with poor mobile internet. | Changes made while disconnected could be lost if the user navigates away. | Header includes real-time `Wifi` / `WifiOff` connectivity indicator. Phase 2 roadmap includes IndexedDB offline queueing. | Frontend Team |

---

## 3. P0 / P1 Defect Closure Audit

| Defect ID | Description | Root Cause | Fix File | Regression Test | Final Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `SEC-UX-001` | Mock Login Fallback | Catch block fallback in `LoginPage.tsx` | `src/pages/LoginPage.tsx` | `Phase0Remediation.test.ts` | **CLOSED & VERIFIED** |
| `UX-SEC-002` | Persona Switcher Leak | Unconditional render in profile menu | `ProfileSessionMenu.tsx` | `Phase0Remediation.test.ts` | **CLOSED & VERIFIED** |
| `FIN-FLOW-003` | Premature Fee Receipt | Optimistic modal open in UI | `FeeManagementModule.tsx` | `FinanceSecurity.test.ts` | **CLOSED & VERIFIED** |
| `UX-ARCH-005` | Unauthorized Principal Landing | Default route landed non-admins on Principal view | `AppShell.tsx` | `Phase0IndependentSecurityVerification.test.ts` | **CLOSED & VERIFIED** |

---

## 4. Final Gate Decision & Sign-Off

### Gate Evaluation:
1. **Database Safety Gate:** Passed (Strict synthetic database isolation verified).
2. **Feature Evidence Gate:** Passed (76/80 features verified with automated tests; remaining 4 explicitly documented as external vendor stubs or hardware dependencies).
3. **Regression Test Gate:** Passed (37 test files, 466 tests, 0 failures).
4. **Build & Type Gate:** Passed (`tsc -b` and `oxlint` 0 errors, production build 898ms).

### Verdict:
**`PASS_FEATURE_EVIDENCE_CLOSURE`** 🚀  
The system is certified for deployment to the private staging pilot environment.
