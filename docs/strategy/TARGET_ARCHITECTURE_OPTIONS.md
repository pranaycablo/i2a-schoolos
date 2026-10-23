# Target Architecture Options & Technical Trade-Off Analysis
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-010 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Architectural Principles & Evaluation Standard

The architectural choices for **i2A SchoolOS** must balance long-term enterprise scalability, multi-tenant security, maintainability, and operational cost-efficiency. Technologies are selected based on strict empirical fit for an educational SaaS platform serving schools in India and globally, rather than industry hype.

---

## 2. Comprehensive Trade-Off Analysis Across 10 Core Architectural Decisions

### Decision 1: Application Architecture — Modular Monolith vs. Distributed Microservices
- **Requirement:** Core backend platform architecture capable of supporting millions of transactions across schools without operational fragility.
- **Candidate Options:**
  - *Option A: Modular Monolith (Layered Express 5 / Node.js)* — Single deployable application partitioned into strictly decoupled internal domain modules (`admissions`, `fees`, `attendance`, `timetables`).
  - *Option B: Distributed Microservices (Docker / Kubernetes / gRPC)* — Separate microservice deployments per functional domain.
- **Comparison & Analysis:**
  - *Microservices Trade-Offs:* Introduces immense distributed system overhead (network latency, distributed transaction rollbacks across admissions/fees, Kubernetes cluster management expenses, complex debugging).
  - *Modular Monolith Benefits:* Extremely low hosting cost, atomic transactions via shared database pool, instant developer onboarding, zero inter-service network serialization delay.
- **Cost / Operational Impact:** Option A reduces hosting costs by $\approx 75\%$ and requires only a small devops footprint.
- **Architectural Recommendation:** **Option A (Modular Monolith)**. Built with strict domain interfaces so high-load modules (e.g., Video Streaming or Exam Engine) can be extracted into standalone workers in the future if warranted.
- **Decision Status:** **APPROVED_RECOMMENDATION**.

---

### Decision 2: Multi-Tenant Database Architecture
- **Requirement:** Absolute data isolation between institutions with low infrastructure overhead.
- **Candidate Options:**
  - *Option A: Shared Database, Tenant-Scoped Collections (MongoDB Native)* — All schools share collections (`students`, `fees`) with mandatory, indexed `schoolId` scoping enforced at the middleware layer.
  - *Option B: Database-Per-Tenant* — Separate MongoDB database instance created dynamically for every registered school.
  - *Option C: PostgreSQL Schema-Per-Tenant* — Relational database with individual PostgreSQL schemas per school.
- **Comparison & Analysis:**
  - *Option B / C Trade-Offs:* Database-per-tenant or schema-per-tenant causes connection pool exhaustion at 500+ schools, complex cross-school aggregation for Educational Trusts, and agonizing database migration scripts across hundreds of instances.
  - *Option A Benefits:* MongoDB 7.7 natively handles high throughput with compound unique indexes (`{ schoolId: 1, admissionNo: 1 }`). Single connection pool handles thousands of tenants seamlessly.
- **Security Implications:** Option A requires mandatory automated tenant validation in the API middleware (`enforceTenant`), which was already built and verified in Phase A.
- **Architectural Recommendation:** **Option A (Shared Database with Mandatory Indexed Tenant Scoping)**.
- **Decision Status:** **VERIFIED_IN_PHASE_A**.

---

### Decision 3: Client Authentication & Session Management
- **Requirement:** Secure session issuance supporting mobile apps, responsive web browsers, and low-latency API verification across 9 roles.
- **Candidate Options:**
  - *Option A: Cryptographic JWT (Stateless Bearer Tokens)* — HMAC SHA256 / RSA signed tokens containing `userId`, `role`, `schoolId`, and expiration.
  - *Option B: Server-Side State Sessions in Redis* — Session ID cookie mapped to centralized Redis key-value store.
  - *Option C: Hybrid (Stateless Short-Lived Access JWT + Revocable Refresh Token in Redis)*.
- **Comparison & Analysis:**
  - *Option A:* Pure stateless JWT cannot be revoked immediately if a staff member is terminated.
  - *Option C Benefits:* Combines speed of local token verification for read requests with an instant revocation list (Redis/Memory blacklist) checked during sensitive mutations.
- **Architectural Recommendation:** **Option C (Short-Lived JWT Access Token + Revocable Session Registry)**.
- **Decision Status:** **APPROVED_RECOMMENDATION**.

---

### Decision 4: Private Object Storage & Document Vault
- **Requirement:** Secure, private storage for student birth certificates, Aadhaar cards, staff contracts, exam answer sheets, and report card PDFs.
- **Candidate Options:**
  - *Option A: Local Server Filesystem (`/uploads`)* — Storing files on local disk.
  - *Option B: AWS S3 / Cloudflare R2 with Pre-Signed URLs* — Private cloud object storage with time-limited signed URLs.
- **Comparison & Analysis:**
  - Local storage is brittle, non-replicated, fails in containerized deployments, and poses direct filesystem injection vulnerabilities.
  - Cloudflare R2 / AWS S3 guarantees zero data loss, automated replication, and zero egress fees (Cloudflare R2), keeping documents 100% private.
- **Architectural Recommendation:** **Option B (Private Cloud Object Storage with Time-Limited Pre-Signed URLs)**.
- **Decision Status:** **TARGET_PHASE_29**.

---

### Decision 5: Background Jobs & Durable Task Scheduler
- **Requirement:** Asynchronous execution of automated fee reminders, daily attendance low-percentage checks, report card batch generation, and trial expiration checks.
- **Candidate Options:**
  - *Option A: In-Memory `setInterval` / Node-Cron* — Local node timers.
  - *Option B: Redis-Backed Durable Task Queue (BullMQ)* — Distributed queue with automatic retries, job deduplication, and failure alerting.
- **Comparison & Analysis:**
  - In-memory timers fail and drop jobs whenever the server restarts or scales horizontally.
  - BullMQ provides guaranteed execution, rate-limited dispatch (crucial for WhatsApp/SMS limits), and dead-letter queue (DLQ) inspection.
- **Architectural Recommendation:** **Option B (BullMQ + Redis)**.
- **Decision Status:** **TARGET_PHASE_21**.

---

### Decision 6: Artificial Intelligence Orchestration & Provider Abstraction
- **Requirement:** Natural language query, question bank generation, and lesson summarization without vendor lock-in.
- **Candidate Options:**
  - *Option A: Direct Hardcoded Vendor SDK (OpenAI only)*.
  - *Option B: Modular AI Gateway Layer* — Interface defining `generateDraft()`, `extractConcepts()`, `summarizeText()`, dynamically switching between OpenAI, Google Gemini 1.5/2.0, Anthropic, or local open-weights LLMs (Ollama/Llama 3).
- **Benefits:** Protects i2A against API pricing shifts and allows government/sovereign deployments to run private, air-gapped on-premise models.
- **Architectural Recommendation:** **Option B (Vendor-Agnostic AI Service Gateway)**.
- **Decision Status:** **APPROVED_RECOMMENDATION**.

---

### Decision 7: Revision Video Delivery Architecture
- **Requirement:** Low-latency video streaming supporting 30-day (₹40 plan) and 365-day (₹50 plan) retention.
- **Candidate Options:**
  - *Option A: Raw MP4 Storage on S3* — High storage cost, excessive bandwidth egress, easy unauthorized piracy.
  - *Option B: HLS Adaptive Bitrate Streaming via Cloudflare Stream / AWS MediaConvert* — Chunked video streaming with encrypted tokens.
  - *Option C: Hybrid (Unlisted YouTube / Google Drive Private Embed + Cloudflare Stream for Premium)*.
- **Architectural Recommendation:** **Option C (Hybrid Model)** — Allows budget institutions to embed unlisted private videos at zero storage cost, with native HLS streaming unlocked on premium plans.
- **Decision Status:** **TARGET_PHASE_22**.

---

### Decision 8: Frontend Delivery Strategy — PWA vs. Native Mobile Apps
- **Requirement:** High mobile engagement for parents and teachers across Android and iOS devices in India.
- **Candidate Options:**
  - *Option A: Progressive Web App (PWA) with Service Worker* — Single responsive web codebase, installable to home screen, zero 30% Google/Apple app store commission.
  - *Option B: Capacitor / React Native Native Wrapper* — Wraps React codebase into native APK and IPA packages for Google Play Store and Apple App Store listing.
- **Benefits:** Phase 1 delivers a pristine PWA; Phase 2 wraps the identical React 19 app using Capacitor to publish official store apps without maintaining dual codebases.
- **Architectural Recommendation:** **PWA-First Architecture + Capacitor Hybrid Store Wrapper**.
- **Decision Status:** **APPROVED_RECOMMENDATION**.

---

### Decision 9: API Versioning Strategy
- **Requirement:** Prevent breaking changes across mobile apps and external institutional integrations.
- **Architectural Standard:** URI-based semantic versioning: `/api/v1/...`. All current Phase A endpoints reside at `/api/...` and will be aliased to `/api/v1/...` to establish a frozen baseline.
- **Decision Status:** **APPROVED_RECOMMENDATION**.

---

### Decision 10: Immutable Security & Financial Audit Trail
- **Requirement:** Compliance with Indian financial audit laws and forensic traceability.
- **Architectural Standard:** Dedicated `audit_logs` MongoDB collection configured with write-only / append-only permissions. Log records cannot be edited or deleted by any user (including Super Admin).
- **Decision Status:** **VERIFIED_IN_PHASE_A**.
