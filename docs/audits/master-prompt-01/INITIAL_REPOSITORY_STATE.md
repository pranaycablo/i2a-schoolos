# MASTER PROMPT 01 — INITIAL REPOSITORY STATE & INVENTORY
**Project:** i2A SchoolOS | Global Multi-Tenant Education Management Platform  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Audit Timestamp:** 2026-10-17T12:57:00+05:30  
**Audit Role:** Principal Software Architect, Senior Full-Stack Engineer, QA Automation Lead  

---

## 1. Project Root & Working Directory Verification

- **Configured Working Directory:** `D:\i2A_School ERP & Managment`
- **Resolved Absolute Path:** `D:\i2A_School ERP & Managment`
- **Filesystem Verification:** Confirmed valid directory on Windows local disk `D:`.

---

## 2. Git Version Control State

- **Current Git Branch:** `phase-a-remediation`
- **Latest Checkpoint Commit:** `5f5e683 chore(baseline): checkpoint prior to Phase A remediation`
- **Pre-Existing Modified Tracked Files:**
  - `docs/ROLE_PERMISSION_MATRIX.md`
  - `package-lock.json`
  - `package.json`
  - `server/index.js`
  - `src/components/layout/Header.tsx`
  - `src/context/SchoolContext.tsx`
  - `src/services/AttendanceLeaveService.ts`
  - `src/services/HomeworkDigitalLearningService.ts`
  - `src/services/MarketplaceStoreService.ts`
  - `src/services/TimetableSchedulingService.ts`
  - `tsconfig.app.json`
  - `vite.config.ts`
- **Pre-Existing Untracked Files:**
  - `docs/audits/I2A_SCHOOLOS_PHASE_A_REMEDIATION_REPORT.md`
  - `docs/audits/MASTER_PROMPT_01A_*.md` (4 audit reports)
  - `docs/audits/master-prompt-01a/` (4 reports)
  - `docs/strategy/` (21 Master Prompt 00 strategy documents)
  - `server/db.js`
  - `server/middleware/auth.js`
  - `server/routes/` (14 REST route modules)
  - `src/__tests__/BackendApiIntegration.test.ts`
  - `src/services/apiClient.ts`
- **User Work Preservation Status:** 100% PRESERVED. Zero existing user commits, files, or branches were deleted, discarded, or overwritten.

---

## 3. Package Manifest & Dependency Inventory

### Core Application Manifest (`package.json`)
```json
{
  "name": "i2a-school-erp---managment",
  "private": true,
  "version": "0.0.0",
  "type": "module"
}
```

### Production Runtime Dependencies
| Package | Version | Verified Role |
| :--- | :--- | :--- |
| `express` | `^5.3.0` | Production HTTP REST API server engine |
| `mongodb` | `^7.7.0` | Official native MongoDB Community driver |
| `jsonwebtoken` | `^9.0.3` | Cryptographic JWT token generation and verification |
| `bcryptjs` | `^3.0.3` | Password hashing with salt rounds (10 rounds) |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing middleware |
| `dotenv` | `^18.0.7` | Environment variables loading from `.env` |
| `react` | `^19.2.8` | Client-side reactive UI library |
| `react-dom` | `^19.2.8` | React DOM renderer |
| `lucide-react` | `^1.53.0` | Accessible SVG icon suite |
| `recharts` | `^3.10.1` | Analytics and institutional reporting charts |
| `jspdf` | `^4.2.1` | Client-side official PDF fee receipt and report card generation |
| `html2canvas` | `^1.4.1` | DOM rasterization for ID cards and visual certificates |
| `canvas-confetti` | `^1.9.4` | UI celebration feedback for admissions & payments |

### Development & Tooling Dependencies
| Package | Version | Verified Role |
| :--- | :--- | :--- |
| `vite` | `^8.3.0` | Client bundling, dev server & production builder |
| `@vitejs/plugin-react` | `^6.1.1` | Fast Refresh and JSX transformation for React 19 |
| `typescript` | `~6.0.2` | Strict static typing and project build checks |
| `tailwindcss` | `^4.3.3` | Utility-first responsive CSS engine |
| `@tailwindcss/vite` | `^4.3.3` | Vite plugin for Tailwind v4 |
| `vitest` | `^5.0.3` | Unit, integration & security test runner |
| `oxlint` | `^1.81.0` | High-performance Rust-based static code linter |

---

## 4. Environment & Database Configuration Metadata

- **Node.js Runtime:** `v24.15.0` (x64 Windows)
- **Local Database Engine:** MongoDB Community Server `v7.7.0`
- **Default Database URI:** `mongodb://127.0.0.1:27017`
- **Active Database Name:** `i2a_schoolos`
- **Safety Policy Observed:** No credentials, secrets, or PII were logged or inspected beyond secure metadata.

---

## 5. Initial Risks Identified at Audit Start

1. **Persistent Lock Collision in Tests:**  
   Because MongoDB maintains genuine persistence across test runs, low-entropy test date generation in `BackendApiIntegration.test.ts` (Test 6.1) caused attendance lock collision against locked records from earlier runs.
2. **Worker Fork Concurrency on Windows:**  
   Executing 18 test files concurrently under Vitest on Windows with Node v24 led to child process worker crashes (`0xC0000409`) due to parallel network socket and crypto bindings initialization.
3. **Whole-School Lock Query Scope:**  
   In `server/routes/attendance.js`, the query checked `className: className || 'ALL'`. If an `'ALL'` school-wide freeze was active, a class-specific query would not match without `$or` evaluation.
4. **Third-Party Credentials:**  
   Razorpay and SMTP credentials are not configured in local environment; calls are properly gated with `BLOCKED_NO_CREDENTIALS` / `BLOCKED_NO_SMTP_PROVIDER`.
