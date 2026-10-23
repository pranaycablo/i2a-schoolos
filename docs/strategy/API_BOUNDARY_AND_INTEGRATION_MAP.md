# API Boundary & Integration Architecture Map
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-012 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. REST API Standards & Envelope Conventions

All client-server communication in i2A SchoolOS strictly adheres to RESTful API conventions:
- **Base URI:** `http://localhost:5000/api` (Production: `https://api.i2aschoolos.com/api/v1`)
- **Transport Security:** Strict HTTPS (TLS 1.3) with mandatory CORS whitelist.
- **Authentication Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Content-Type:** `application/json; charset=utf-8`

### Standard HTTP Status Codes
| Status Code | Meaning & Usage |
| :--- | :--- |
| **`200 OK`** | Successful read, update, or idempotent replay. |
| **`201 Created`** | Successful resource creation (student, invoice, order). |
| **`400 Bad Request`** | Input validation failure, negative amount, missing mandatory fields. |
| **`401 Unauthorized`** | Missing, expired, malformed, or tampered JWT token. |
| **`403 Forbidden`** | Insufficient RBAC role, cross-tenant boundary breach (`TENANT_VIOLATION`), or locked state. |
| **`404 Not Found`** | Resource or route does not exist. |
| **`409 Conflict`** | Unique constraint violation (duplicate email/admissionNo), timetable double-booking. |
| **`429 Too Many Requests`**| OTP or API rate limit exceeded (e.g., >3 OTP requests in 15 min). |
| **`500 Internal Error`** | Unhandled server exception with internal stack trace masked. |
| **`503 Service Unavailable`**| External dependency down or live credentials missing (`BLOCKED_NO_CREDENTIALS`). |

---

## 2. Master REST Endpoint Map (14 Core Route Modules)

```
/api
├── /health                   [GET] Active server & MongoDB health check ping
├── /auth
│   ├── /login                [POST] Authenticate user & issue JWT token
│   ├── /me                   [GET] Decode current user session & permissions
│   ├── /register-school      [POST] Public new school tenant onboarding
│   ├── /forgot-password      [POST] Request 6-digit cryptographic OTP (rate-limited)
│   ├── /verify-otp           [POST] Validate OTP & receive single-use reset token
│   └── /reset-password       [POST] Execute password reset with reset token
├── /tenants
│   ├── /profile              [GET, PUT] School branding, board, logo & details
│   └── /                     [GET] Super Admin multi-school directory
├── /students
│   ├── /                     [GET, POST] List students (tenant-scoped) & create SIS record
│   └── /:id                  [GET, PUT] Get single student profile & update records
├── /admissions
│   ├── /                     [GET] List pending/verified applications
│   ├── /public               [POST] Public parent registration form submission
│   ├── /:id/status           [PUT] Update workflow status (TEST_SCHEDULED, INTERVIEW)
│   └── /:id/approve          [POST] Promote application to enrolled Student record
├── /attendance
│   ├── /                     [GET] Query attendance records by date & class
│   ├── /mark                 [POST] Batch mark class attendance
│   ├── /lock                 [POST] Principal lock attendance for date
│   ├── /summary              [GET] Calculate student & class attendance percentages
│   └── /leaves               [GET, POST, PUT] Staff & student leave application workflows
├── /timetables
│   ├── /                     [GET] Query timetable grid by class / teacher
│   ├── /cells                [POST] Upsert timetable cell (triggers conflict engine)
│   └── /substitutions        [GET, POST] Search & assign daily teacher substitutions
├── /homework
│   ├── /                     [GET, POST] Query class homework feed & post assignment
│   ├── /:id/submit           [POST] Student file submission
│   └── /submissions/:id/grade[PUT] Teacher grading & rubric marks entry
├── /exams
│   ├── /papers               [GET, POST] Exam paper creation & question blueprinting
│   ├── /papers/:id/submit    [POST] Online exam student answer submission
│   └── /submissions          [GET] Term exam marksheets & gradebook ledger
├── /fees
│   ├── /types                [GET, POST] Fee structure creation (Tuition, Annual, Lab)
│   └── /receipts             [GET] Query payment receipts
│       └── /collect          [POST] Record fee collection & generate receipt PDF
├── /marketplace
│   ├── /products             [GET, POST] Catalog products & kit bundles
│   └── /orders               [GET, POST] Idempotent order placement & cancellation
├── /operations
│   ├── /staff                [GET, POST] Staff workforce directory & profiles
│   ├── /payroll              [GET] Query monthly salary registers
│   │   └── /disburse         [POST] Execute payroll disbursement & generate payslips
│   └── /expenses             [GET, POST] School operational expense ledgers
├── /subscription
│   ├── /profile              [GET] Query active SaaS plan, trial days & discount
│   ├── /invoices             [GET] View platform billing history
│   └── /invoices/generate    [POST] Generate monthly invoice (enforces 40% discount cap)
├── /payments
│   ├── /create-order         [POST] Generate gateway order (Zero-False-Pass credential check)
│   └── /razorpay-webhook     [POST] Webhook endpoint (enforces SHA256 HMAC & idempotency)
└── /notifications
    ├── /                     [GET] In-app notification feed
    ├── /dispatch             [POST] Dispatch alert (tracks SMTP/WhatsApp provider status)
    └── /:id/read             [PUT] Mark notification as read
```

---

## 3. External Integration Architecture

```mermaid
graph LR
    subgraph i2A Core
        API["i2A SchoolOS REST API"]
    end

    subgraph Payment Gateways (Flow A & B)
        RZP["Razorpay (Orders & Webhooks)"]
        PHN["PhonePe PG"]
        PTM["Paytm PG"]
    end

    subgraph Multi-Channel Messaging
        SMTP["SMTP Mail Server (AWS SES / SendGrid)"]
        WABA["WhatsApp Business Cloud API (Meta)"]
        SMS["Transactional SMS Gateway (DLT Registered)"]
    end

    subgraph Accounting & Compliance
        Tally["Tally Prime (XML/Excel Sync)"]
        UDISE["UDISE+ (DCF JSON Export)"]
    end

    API -->|SHA256 HMAC Webhook| RZP
    API -->|PG API| PHN
    API -->|PG API| PTM

    API -->|TLS SMTP| SMTP
    API -->|HTTPS Graph API| WABA
    API -->|HTTP REST| SMS

    API -->|Ledger Export| Tally
    API -->|Batch Validation| UDISE
```

---

## 4. Webhook Security & Idempotency Specification

### Payment Webhook Protocol (`POST /api/payments/razorpay-webhook`)
1. **Raw Payload Buffering:** Express intercepts raw body bytes before JSON parsing.
2. **Cryptographic Signature Verification:**
   $$\text{Computed Signature} = \text{HMAC-SHA256}(\text{Raw Body}, \text{RAZORPAY\_WEBHOOK\_SECRET})$$
   - Computed signature is compared against `x-razorpay-signature` header using `crypto.timingSafeEqual` to prevent timing attacks.
   - If invalid, server terminates immediately with `400 Invalid HMAC signature`.
3. **Idempotency Gate:**
   - Server queries `payment_webhooks` collection for `event.id`.
   - If exists: Logs replay attempt and returns `200 OK` without duplicate processing.
   - If new: Inserts `event.id`, marks payment order `PAID`, updates student fee ledger, and returns `200 OK`.
