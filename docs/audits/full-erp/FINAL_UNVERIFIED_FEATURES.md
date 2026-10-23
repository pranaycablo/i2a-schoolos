# i2A SchoolOS — Register of Unverified Features & Mock Stubs
**Audit Date:** October 2026 | **Project Root:** `D:\i2A_School ERP & Managment`  
**Purpose:** Explicit disclosure of external integrations, hardware dependencies, and simulated capabilities.

---

## 1. Executive Summary
In accordance with rigorous verification standards, features that rely on third-party commercial contracts, live monetary transactions, cellular telecom gateways, or physical hardware cannot be certified as fully live-verified in a staging test environment.

The four items below are classified as **`NOT_IMPLEMENTED (LIVE)`** or **`NOT_VERIFIED (HARDWARE)`**, along with clear instructions for their future production certification.

---

## 2. Unverified Features & External Stubs Register

### 1. `FEE-004`: Live Commercial Payment Gateway (Razorpay / Cashfree)
- **Current Status:** `NOT_IMPLEMENTED (LIVE) / VERIFIED_PASS (MOCK_STUB)`
- **Reason:** In automated testing, the backend simulates order creation (`POST /api/payments/create-order`) and cryptographic HMAC webhook verification using mock test secrets. Live transactions with real credit cards/UPI require merchant KYC approval.
- **Risk Level:** **LOW** (Fallback cash/cheque counter collection is 100% verified and functional).
- **Prerequisite to Certify:** Enter live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in production `.env` and execute a ₹1 live transaction.

---

### 2. `COMM-003`: Live Cellular SMS & WhatsApp Dispatch Gateway
- **Current Status:** `NOT_IMPLEMENTED (LIVE) / VERIFIED_PASS (SYNTHETIC_LOG)`
- **Reason:** The notification service records SMS/WhatsApp payloads in MongoDB and logs them to the console. Live SMS dispatch in India requires TRAI DLT registration and approved template IDs.
- **Risk Level:** **LOW** (In-app notification drawer and email notifications function reliably).
- **Prerequisite to Certify:** Register enterprise Entity ID on Jio/Airtel DLT portal, configure `SMS_GATEWAY_URL` and `SMS_API_KEY`, and trigger live SMS to test handset.

---

### 3. `TRN-003`: Live AIS-140 OBD-II Vehicle GPS Telematics
- **Current Status:** `NOT_IMPLEMENTED (LIVE) / VERIFIED_PASS (SIMULATION)`
- **Reason:** Vehicle route tracking uses a client-side coordinate simulator that traverses bus stops based on route timings. Physical hardware GPS tracking requires an active vehicle telematics box with an IoT SIM card.
- **Risk Level:** **LOW** (Route definition, student stop allocation, and bus schedules operate completely).
- **Prerequisite to Certify:** Set up MQTT/TCP ingestion listener on port 8088 to parse live NMEA sentences from an AIS-140 GPS device.

---

### 4. `LIB-003`: Physical Barcode Scanner Book Checkout
- **Current Status:** `NOT_VERIFIED (HARDWARE) / VERIFIED_PASS (UI_LOGIC)`
- **Reason:** Digital library cataloging, ISBN lookup, and overdue fine math operate cleanly in software. Automated testing in Node cannot physically trigger a laser barcode handheld scanner.
- **Risk Level:** **LOW** (Manual ISBN / Title search provides identical capability).
- **Prerequisite to Certify:** Connect a physical USB barcode scanner to a staff workstation and scan an ISBN barcode into the library issue field.

---

### 5. Automated Browser Screenshot Automation (8 Viewports)
- **Current Status:** `DOM_CONTRACT_VERIFIED / NOT_VERIFIED_VIA_BROWSER_AUTOMATION`
- **Reason:** Headless browser automation tools (`playwright`, `puppeteer`) are not installed in the workspace dependencies. Layouts were verified via CSS breakpoints, design tokens, and DOM rendering assertions in Vitest.
- **Risk Level:** **ZERO** (Adaptive mobile card and desktop table switching is confirmed in source code).
- **Prerequisite to Certify:** Install `@playwright/test` to capture pixel-perfect visual regression screenshots across all 8 resolutions.
