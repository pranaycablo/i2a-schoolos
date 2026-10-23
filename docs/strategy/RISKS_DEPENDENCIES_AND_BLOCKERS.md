# Risks, Dependencies & Operational Blockers Matrix
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-020 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Risk Assessment Standard

This register identifies technical, commercial, regulatory, and external dependency risks that could impact the delivery, reliability, or operational economics of **i2A SchoolOS**, along with concrete mitigation strategies.

---

## 2. Comprehensive Risk & Blocker Register

| Risk ID | Risk Title & Description | Category | Impact | Likelihood | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-TEC-001** | **Video Streaming & Egress Bandwidth Expenses**<br>Unlimited HD video hosting on ₹40/₹50 plans could generate massive AWS/CDN bandwidth bills that exceed monthly student subscription revenue. | Technical / Financial | **HIGH** | **HIGH** | Enforce Cloudflare Stream / R2 (zero egress fees); cap storage per institution; enforce strict 30-day (₹40) and 365-day (₹50) automated purge crons. | Cloud Architect |
| **RSK-TEC-002** | **Vite Bundle Size Growth (> 1.3 MB)**<br>Single minified bundle is currently 1,377 kB, which could degrade initial page load times on 3G/4G networks in rural Indian schools. | Technical / UX | **MEDIUM**| **HIGH** | Implement route-based dynamic code splitting (`React.lazy()`) for heavy charting (Recharts) and PDF generation (jsPDF) in Phase 05. | Frontend Lead |
| **RSK-EXT-001** | **Payment Gateway Merchant Onboarding Delays**<br>Schools take weeks to complete KYC verification with Razorpay/PhonePe to receive live payment keys. | External Dependency | **HIGH** | **HIGH** | Built-in offline Cash/Cheque counter collection mode; maintain sandbox mode with transparent `BLOCKED_NO_CREDENTIALS` indicators. | Product Ops |
| **RSK-EXT-002** | **Meta WhatsApp Business API Per-Message Fees**<br>Meta charges per-conversation fees for utility and marketing templates. High-volume fee reminders could create unconstrained costs. | External Dependency | **HIGH** | **MEDIUM** | In-app notification hub serves as the primary free channel; WhatsApp messages require school-funded messaging wallet or BYO Meta API credentials. | Finance Lead |
| **RSK-EXT-003** | **DLT Telemarketer Registration for Transactional SMS**<br>In India, TRAI requires Distributed Ledger Technology (DLT) template registration before transactional SMS can be delivered. | Regulatory / External| **MEDIUM**| **HIGH** | Support pre-approved standardized OTP templates; encourage in-app push and email notifications as primary authentication channels. | Legal / Ops |
| **RSK-REG-001** | **DPDP Act 2023 Parental Consent Liability**<br>Section 9 mandates verifiable parental consent for processing minor children's data, with severe statutory penalties for non-compliance. | Regulatory / Legal | **CRITICAL**| **MEDIUM**| Online admission portal captures explicit digital guardian verification timestamps; zero behavioral tracking or advertising algorithms in the codebase. | Legal Counsel |
| **RSK-REG-002** | **UDISE+ Schema Drift**<br>The Department of School Education periodically alters annual Data Capture Format (DCF) fields, breaking static export formats. | Regulatory | **MEDIUM**| **MEDIUM**| Abstract UDISE+ mapping into versioned JSON field-mapping schemas rather than hardcoded database columns. | Data Architect |
| **RSK-BIZ-001** | **Unit Economics Viability of ₹10 Plan**<br>At ₹10/student/month, institutions with small headcounts (< 100 students = ₹1,000/mo) generate minimal margin against cloud hosting. | Business / SaaS | **HIGH** | **MEDIUM** | Establish a minimum platform monthly invoice floor (e.g. minimum ₹999/month base fee for institutions with under 100 students). | Product Owner |
| **RSK-OPS-001** | **Driver Smartphone & Digital Literacy Barriers**<br>School bus drivers and conductors may lack modern smartphones or technical proficiency to operate the Driver Web App. | Operational | **MEDIUM**| **HIGH** | Driver app features large, high-contrast buttons, voice prompts, and simple 1-tap passenger checklist; transport manager can override centrally. | UX Strategist |
| **RSK-AI-001**  | **AI Exam Hallucination & Syllabus Misalignment**<br>External LLMs can hallucinate incorrect mathematical steps or questions outside the designated board syllabus. | AI / Quality | **HIGH** | **MEDIUM** | Strict Level 2 Human-in-the-Loop policy: AI papers always save as `DRAFT`; teacher must verify and sign off before paper is published to students. | AI Architect |

---

## 3. Pre-Requisite External Dependencies & Credentials Checklist

Before initiating production pilots for live payment or messaging modules, the following external items must be provisioned:
1. **Razorpay Live Merchant Account:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
2. **Transactional SMTP Relay:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (AWS SES / SendGrid with verified sender domain).
3. **Meta WhatsApp Cloud API:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_SYSTEM_USER_TOKEN`.
4. **Cloud Object Storage:** AWS S3 Bucket / Cloudflare R2 Bucket credentials with CORS configuration.
5. **OpenAI / Google Gemini API Keys:** `GEMINI_API_KEY` for long-context chapter text ingestion.
