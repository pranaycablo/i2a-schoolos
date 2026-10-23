# i2A SchoolOS — Master Prompt 02: API Contract Gap Register
**Document ID:** `DOC-MP02-GAP-REGISTER-003`  
**Phase:** Master Prompt 02 — Architecture Hardening & API Contracts  
**Auditor:** Senior Backend Engineer, API Contract Reviewer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary

This register records all discrepancies, schema mismatches, missing validations, and contract gaps identified between the frontend client layer (`src/services/apiClient.ts`, `src/context/SchoolContext.tsx`) and the backend API controllers (`server/routes/`).

Every identified gap has been evaluated, remediated, and verified against automated regression tests.

---

## 2. API Contract Gap Analysis & Remediation Log

| Gap ID | Endpoint | Observed Discrepancy | Risk Level | Remediation Implemented | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | Global API Routes | Inconsistent error payload shapes across routes (`{ error }` vs `{ error, code }`) | MEDIUM | Created `server/middleware/apiResponse.js` and standardized all errors to `{ success: false, error, code, details?, requestId? }`. | **REMEDIATED & VERIFIED** |
| **GAP-02** | `apiClient.ts` | `ApiResult<T>` lacked `code` and `requestId` properties, forcing clients to do fragile string parsing. | MEDIUM | Updated `ApiResult<T>` in `src/services/apiClient.ts` to include `code?: string`, `details?: unknown`, and `requestId?: string`. | **REMEDIATED & VERIFIED** |
| **GAP-03** | `POST /api/students` | Incomplete input validation: Empty `name`, `className`, or `section` were accepted without 400 rejection. | HIGH | Implemented strict input validation returning 400 Bad Request with `code: 'VALIDATION_ERROR'` and details array. | **REMEDIATED & VERIFIED** |
| **GAP-04** | `POST /api/fees/types` | Fee amount was not verified for negative values or non-numeric types. | HIGH | Added validation enforcing non-negative numeric `amount` and required `name`, returning 400 `VALIDATION_ERROR`. | **REMEDIATED & VERIFIED** |
| **GAP-05** | `GET /api/students/:id` | If student ID belonged to School B, requesting from School A could return 200 or 500 depending on filter. | CRITICAL | Enforced authoritative `req.tenantFilter` on all student lookups and updates, returning 404 `RESOURCE_NOT_FOUND` on cross-tenant lookup to prevent IDOR leaks. | **REMEDIATED & VERIFIED** |
| **GAP-06** | `server/index.js` (404/500) | Global 404 and 500 error handlers did not provide `success: false` and `requestId`. | LOW | Standardized global 404 (`ROUTE_NOT_FOUND`) and 500 (`INTERNAL_ERROR`) with `requestId` and `success: false`. | **REMEDIATED & VERIFIED** |
| **GAP-07** | Live Payment Gateway | Zero false pass required when live credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are missing. | HIGH | Endpoint explicitly detects `environment === 'LIVE'` and returns `400` with status `BLOCKED_NO_CREDENTIALS` (Zero False Pass). | **REMEDIATED & VERIFIED** |
| **GAP-08** | Email Notifications | Zero false pass required when SMTP server credentials are not configured. | HIGH | Dispatch endpoint explicitly flags `BLOCKED_NO_SMTP_PROVIDER` in database record and returns safe diagnostic provider notes. | **REMEDIATED & VERIFIED** |

---

## 3. Residual Known Limitations

1. **Third-Party Provider Credentials:** Live production transactions via Razorpay and live transactional SMTP emails remain blocked until the school or platform operator configures production API keys in environment variables.
2. **Local Fallback State:** `SchoolContext.tsx` contains static demo fallbacks to enable offline development. In connected mode, state is synchronized directly with MongoDB.
