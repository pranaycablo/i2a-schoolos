# MASTER PROMPT 01 — INTEGRATION STATUS MATRIX
**Project:** i2A SchoolOS | Global Multi-Tenant Education Management Platform  
**Audit Root:** `D:\i2A_School ERP & Managment`  
**Phase:** Phase H — External Integrations, Gateways & Provider Verification  

---

## 1. Integration Status Classification Rules

Every external integration is classified under one of the 6 standardized states:
- `VERIFIED_WORKING`: Live credentials present and successfully verified with real external service.
- `IMPLEMENTED_BUT_UNVERIFIED`: Code is complete and structurally sound, but live end-to-end communication has not been exercised.
- `BLOCKED_NO_CREDENTIALS`: Securely blocks execution and refuses to falsify success when external provider API credentials are not present (Zero-False-Pass principle).
- `MOCK_OR_PLACEHOLDER`: Internal simulation, heuristic generator, or mock service used for offline/local workflows.
- `NOT_IMPLEMENTED`: Architectural component designed but source code integration not yet written.
- `NOT_APPLICABLE`: Not a direct API service (e.g., manual government DCF data export).

---

## 2. Comprehensive Integrations Matrix

| Integration Domain | Primary Provider | Integration Status | Empirical Evidence & Architectural State |
| :--- | :--- | :--- | :--- |
| **Payment Gateway (Live Mode)** | Razorpay Live Gateway | **`BLOCKED_NO_CREDENTIALS`** | `POST /api/payments/create-order` with `environment: 'LIVE'` checks for `RAZORPAY_KEY_ID`. In the absence of live production keys, it returns HTTP 400 with `{ status: 'BLOCKED_NO_CREDENTIALS' }`. Zero-False-Pass strictly enforced. |
| **Payment Gateway (Sandbox/Test)** | Razorpay Test API / HMAC Webhook | **`IMPLEMENTED_BUT_UNVERIFIED`** | Full cryptographic HMAC SHA-256 signature verification and webhook idempotency are implemented in `server/routes/payments.js` and verified by `BackendApiIntegration.test.ts` (Test 9.2). |
| **Email Delivery (Live SMTP)** | Nodemailer / Transactional SMTP | **`BLOCKED_NO_CREDENTIALS`** | In `server/routes/notifications.js`, dispatch without configured SMTP host/user sets `deliveryStatus: 'BLOCKED_NO_SMTP_PROVIDER'`. No fake delivery claimed. |
| **Notification Hub (In-App)** | Internal Notification Service | **`VERIFIED_WORKING`** | Dispatched credential payloads and administrative circulars are persisted to MongoDB `notifications` collection and surfaced in the client notification center. |
| **WhatsApp Notifications** | Meta WhatsApp Cloud API | **`MOCK_OR_PLACEHOLDER`** | UI displays WhatsApp triggers and logs intent; real Meta Graph API integration awaits API credentials and business phone registration. |
| **AI / LLM Generation** | Rule-Based AI Engine | **`MOCK_OR_PLACEHOLDER`** | Question paper generator and lesson plans utilize deterministic syllabus question banks, NCERT heuristics, and algorithmic blueprinting rather than external OpenAI/Gemini API calls. |
| **Video & Cloud Storage** | Cloudflare R2 / AWS S3 | **`NOT_IMPLEMENTED`** | Dedicated cloud object storage is designed for Phase B (Master Prompt 08). Currently, digital books reference URL links or static assets. |
| **PWA & Offline Capability** | Progressive Web App | **`IMPLEMENTED_BUT_UNVERIFIED`** | Application is fully mobile-responsive and installable as a web app. Full Service Worker offline asset caching is not yet registered. |
| **Government / UDISE+** | Ministry of Education UDISE+ | **`NOT_APPLICABLE`** | i2A SchoolOS functions as an internal institutional SIS capturing all UDISE+ Data Capture Format (DCF) fields for export, rather than a direct real-time government API. |

---

## 3. Zero-False-Pass Security Compliance

A core requirement of Master Prompt 01 is that the system must never pretend an external integration succeeded when credentials or network connectivity are absent:
1. **Razorpay Guard:** Attempting live payments without API secrets triggers a transparent error modal informing the administrator that live gateway credentials must be supplied in `.env`.
2. **SMTP Guard:** Outgoing email notifications without an active SMTP server are cataloged in MongoDB with status `BLOCKED_NO_SMTP_PROVIDER`, and the full email payload is rendered in the admin dashboard so credentials can be inspected manually during local evaluation.
3. **AI Guard:** AI-generated question papers are clearly stamped with status `AI_DRAFT` requiring explicit teacher/principal review before publication (Level 2 human approval gate).
