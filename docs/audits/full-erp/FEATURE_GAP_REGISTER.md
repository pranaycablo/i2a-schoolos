# i2A SchoolOS — Master Feature Gap Register & Architectural Limitations
**Scope:** All 21 Modules (A through U) | **Audit Date:** October 2026  
**Purpose:** Formal registry of identified limitations, third-party stub dependencies, and production readiness requirements.

---

## 1. Executive Gap Summary
Across the 21 modules audited in `i2A SchoolOS`, zero blocking architectural or data-integrity defects were detected in the core application logic. All business rules—admissions, student SIS, attendance locks, timetable conflict solver, exam auto-grading, fee collection, double-entry bookkeeping, and multi-tenant isolation—operate reliably and fail-closed.

The register below documents operational prerequisites, third-party external integrations, and secondary enhancements necessary before transitioning from Staging to large-scale Commercial Production.

---

## 2. Feature Gap & Limitation Register

| Gap ID | Module Affected | Severity | Limitation / Gap Description | Risk Analysis | Current Mitigation / Workaround | Target Milestone |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| `GAP-EXT-001` | Module L (Fees) | **MEDIUM** | Live Payment Gateway (Razorpay/Cashfree) operates in synthetic mock mode. Webhook signature verification uses simulated headers rather than live cryptographic secrets. | In staging, simulated checkout completes without real money transfer. In production, live gateway credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_SECRET`) must be provided. | Simulated POS & Online payment succeeds with valid transaction IDs. Fail-closed transaction safety verified. | Phase 1 Staging $\to$ Prod |
| `GAP-EXT-002` | Module S (Communications) | **MEDIUM** | SMS and WhatsApp notification dispatch uses synthetic delivery logs. No live Twilio/Gupshup SMS gateway API key is configured. | Parents do not receive actual SMS on their cellular devices; notifications appear in the in-app drawer and console logs. | Simulated payload logged with recipient phone and text. In-app notifications deliver instantaneously. | Phase 1 Staging $\to$ Prod |
| `GAP-EXT-003` | Module N (Transport) | **LOW** | Fleet GPS vehicle tracking uses simulated coordinate streams rather than hardware OBD-II / AIS-140 GPS telematics integration. | Parents see simulated bus movement on the route map rather than live satellite tracking. | Mock GPS engine provides realistic route traversal based on predefined waypoints. | Phase 2 Telematics |
| `GAP-UX-004` | Module K (Report Cards) | **LOW** | Report cards render via browser CSS Print layout. Server-side headless Chrome (Puppeteer) PDF generation is not enabled by default to save server memory. | Report card layout relies on browser print dialog (`window.print()`) rather than direct binary PDF download link. | Responsive print stylesheet optimizes margins and page breaks cleanly for A4 paper. | Phase 2 Headless PDF |
| `GAP-SYS-005` | Module U (Platform Admin) | **LOW** | MongoDB single-node development vs. replica set requirement. Transactional multi-document writes (`institutionHierarchyService.js`) require a MongoDB replica set (`rs0`), which runs on port 27018 in local testing. | Single-node standalone instances without replica sets cannot execute multi-document transactions. | Automated script `scripts/start-test-replica-set.js` provisions replica set for test execution. Production MongoDB Atlas provides replica sets natively. | Completed / Verified |
| `GAP-PWA-006` | Module Q & P (Portals) | **ENHANCEMENT** | Offline PWA service worker caches static assets but does not yet queue offline attendance writes for background sync when disconnected. | If internet connectivity drops mid-attendance marking, user must wait for connection before saving. | Visual offline banner (`WifiOff`) alerts user immediately when backend connection is severed. | Phase 2 Offline Sync |

---

## 3. Severity Distribution
- **Critical (Blocker):** 0
- **High (Urgent):** 0
- **Medium (Integration Prerequisite):** 2 (`GAP-EXT-001`, `GAP-EXT-002`)
- **Low (Operational Polish):** 3 (`GAP-EXT-003`, `GAP-UX-004`, `GAP-SYS-005`)
- **Enhancement:** 1 (`GAP-PWA-006`)

---

## 4. Certification Impact
None of the listed items represent application vulnerabilities or corruptive data flaws. All core ERP business workflows are functionally operational and safe for staging deployment.
