# i2A SchoolOS — External Integration Limitations & Staging Prerequisite Guide
**Scope:** Third-Party Services, Gateways, Hardware Telematics & Cloud Storage  
**Audit Date:** October 2026 | **Target Environment:** Transition from Staging to Production  

---

## 1. Executive Summary
`i2A SchoolOS` includes production-ready client wrappers and backend webhook handlers for all critical third-party services. In local development and automated testing, external dependencies are safely simulated using synthetic adapters to eliminate external network fragility, rate limits, and financial risk.

Before activating commercial production for real schools, the following five external service integrations must have their production credentials configured.

---

## 2. Service-by-Service Integration Specification

### 1. Payment Gateway (Razorpay / Cashfree / PayU)
- **Current Mode:** Synthetic order generation and simulated signature verification (`server/routes/payments.js`).
- **Required Production Environment Variables:**
  - `RAZORPAY_KEY_ID`: Production API Key ID issued by Razorpay dashboard.
  - `RAZORPAY_KEY_SECRET`: Secret key used for HMAC-SHA256 signature verification.
  - `RAZORPAY_WEBHOOK_SECRET`: Secret key for validating incoming webhook events.
- **Webhook Handlers:**
  - Implemented in `server/routes/payments.js` under `POST /api/payments/webhook`.
  - Enforces duplicate webhook protection via `processed_webhooks` collection with idempotency TTL.

### 2. Cellular SMS & WhatsApp Messaging (Twilio / Gupshup / Kaleyra)
- **Current Mode:** Synthetic payload logging to in-memory/MongoDB notification records.
- **Required Production Environment Variables:**
  - `SMS_GATEWAY_URL`: Endpoint for sending DLT-approved SMS in India.
  - `SMS_API_KEY`: API authentication key.
  - `SMS_SENDER_ID`: Registered 6-character sender ID (e.g. `SCHLOS`).
  - `WHATSAPP_BUSINESS_TOKEN`: Meta WhatsApp Cloud API Bearer token.
  - `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Cloud API sending number ID.
- **Prerequisites for India (DLT Compliance):**
  - Registration on TRAI DLT portal with verified PE ID and approved SMS templates for Attendance, Fee Reminders, and OTP.

### 3. Biometric & RFID Hardware Integration (ZKTeco / eSSL / Realtime)
- **Current Mode:** Daily attendance marked via teacher/staff UI roster.
- **Integration Architecture:**
  - Standard HTTP Push protocol (`POST /api/attendance/mark` or dedicated biometric push listener).
  - Biometric device agent running in school local network posts punch events: `{ employeeId/studentId, timestamp, deviceId }`.
  - Auto-mapped to daily `attendance` records.

### 4. Vehicle GPS Telematics (AIS-140 Compliant Trackers)
- **Current Mode:** Mock route coordinate simulator providing realistic stop traversal for parent maps.
- **Production Integration:**
  - Ingestion endpoint via WebSocket or MQTT broker receiving AIS-140 standard NMEA / JSON telematics strings: `{ deviceImei, latitude, longitude, speed, timestamp }`.
  - Coordinates forwarded to `transport_routes` cache.

### 5. Cloud Object Storage (AWS S3 / Google Cloud Storage / Cloudinary)
- **Current Mode:** Image URLs stored directly as strings; documents uploaded as base64 or hosted links.
- **Required Production Environment Variables:**
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET_NAME`
  - `AWS_S3_REGION`
- **Recommended Upload Pattern:**
  - Direct presigned URL generation (`GET /api/operations/upload-url`) to upload files directly from client browser to S3, bypassing Node.js server memory.

---

## 3. Staging-to-Production Checklist

- [ ] Register School DLT Entity on Telecom Portal (India).
- [ ] Complete Razorpay Merchant KYC and activate Live Mode keys.
- [ ] Provision AWS S3 bucket with CORS restricted to school domain.
- [ ] Configure live SMTP credentials for transactional email dispatch (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- [ ] Run `npm test` on staging instance to verify environment variables before traffic switch.
