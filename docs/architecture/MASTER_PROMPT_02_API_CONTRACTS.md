# i2A SchoolOS — Master Prompt 02: API Contract Specification
**Document ID:** `ARCH-MP02-SPEC-003`  
**Phase:** Master Prompt 02 — Architecture Hardening & API Contracts  
**Auditor / Architect:** Principal Software Architect, Senior Backend Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Specification Overview & Standard Conventions

This document specifies the authoritative HTTP REST API contracts for i2A SchoolOS.

### 1.1 Base URL
- Local Development / Testing: `http://localhost:5000/api`
- Egress Client: `src/services/apiClient.ts`

### 1.2 Global Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (for all authenticated endpoints)
- Injected Correlation ID: Every response carries `requestId: "req-<timestamp>-<random>"` for diagnostic tracing.

### 1.3 Standard Error Contract
Every non-2xx HTTP response conforms to this unified contract:

```json
{
  "success": false,
  "error": "Human readable safe error message",
  "code": "MACHINE_READABLE_CODE",
  "details": [
    "Optional specific field validation error"
  ],
  "requestId": "req-1729150000000-123"
}
```

---

## 2. API Contract Specifications

### 2.1 System Health Check

#### `GET /api/health`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** None (Public)
- **Response `200 OK`:**
  ```json
  {
    "status": "ONLINE",
    "database": "CONNECTED",
    "uptimeSeconds": 1420,
    "environment": "development",
    "timestamp": "2026-10-17T08:00:00.000Z"
  }
  ```
- **Error `500 Internal Error`:**
  ```json
  {
    "status": "ERROR",
    "database": "UNREACHABLE",
    "error": "connect ECONNREFUSED 127.0.0.1:27017"
  }
  ```

---

### 2.2 Authentication & Identity

#### `POST /api/auth/login`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** None (Public)
- **Request Body:**
  ```json
  {
    "email": "principal@abcpublicschool.edu.in",
    "password": "Principal@2026#",
    "role": "PRINCIPAL"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-002",
      "email": "principal@abcpublicschool.edu.in",
      "name": "Dr. Ramesh Chandra Sharma",
      "role": "PRINCIPAL",
      "schoolId": "I2A-SCH-000001"
    },
    "tenant": {
      "id": "I2A-SCH-000001",
      "name": "ABC Public School"
    }
  }
  ```
- **Error `401 Unauthorized`:**
  ```json
  {
    "success": false,
    "error": "Invalid credentials. User not found.",
    "code": "INVALID_CREDENTIALS",
    "requestId": "req-1729150000000-101"
  }
  ```

#### `GET /api/auth/me`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-002",
      "email": "principal@abcpublicschool.edu.in",
      "name": "Dr. Ramesh Chandra Sharma",
      "role": "PRINCIPAL",
      "schoolId": "I2A-SCH-000001"
    },
    "tenant": {
      "id": "I2A-SCH-000001",
      "name": "ABC Public School"
    }
  }
  ```

---

### 2.3 Student Information System (SIS)

#### `GET /api/students`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT
- **Access Scope:** Scoped by `req.tenantFilter` (School A cannot view School B). Parents see only linked children; students see only their own record.
- **Query Parameters:** `schoolId` (optional), `className` (optional)
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "std-101",
      "schoolId": "I2A-SCH-000001",
      "admissionNo": "1024",
      "rollNo": "01",
      "name": "Rahul Kumar",
      "className": "Class VIII",
      "section": "A",
      "status": "ACTIVE"
    }
  ]
  ```

#### `GET /api/students/:id`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT
- **Response `200 OK`:** Student Profile Record
- **Error `404 Not Found` (Cross-Tenant IDOR Protection):**
  ```json
  {
    "success": false,
    "error": "Student record not found in authorized school.",
    "code": "RESOURCE_NOT_FOUND",
    "requestId": "req-1729150000000-202"
  }
  ```

#### `POST /api/students`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT (`SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `STAFF`)
- **Validation Rules:** `name`, `className`, and `section` are required non-empty strings.
- **Request Body:**
  ```json
  {
    "name": "Aryan Sharma",
    "className": "Class IX",
    "section": "A",
    "parentMobile": "9876543210",
    "gender": "MALE"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "student": {
      "id": "std-1729150000000-481",
      "schoolId": "I2A-SCH-000001",
      "admissionNo": "1026",
      "name": "Aryan Sharma",
      "className": "Class IX",
      "section": "A",
      "status": "ACTIVE",
      "createdAt": "2026-10-17T08:00:00.000Z"
    }
  }
  ```
- **Error `400 Bad Request`:**
  ```json
  {
    "success": false,
    "error": "Validation failed: Student name, className, and section are required fields.",
    "code": "VALIDATION_ERROR",
    "details": ["Field \"name\" is required."],
    "requestId": "req-1729150000000-203"
  }
  ```

---

### 2.4 Attendance Operations

#### `POST /api/attendance/mark`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT (`TEACHER`, `ADMIN`, `PRINCIPAL`, `STAFF`)
- **Request Body:**
  ```json
  {
    "date": "2026-10-17",
    "className": "Class VIII",
    "section": "A",
    "attendanceList": [
      { "entityId": "std-101", "status": "PRESENT" },
      { "entityId": "std-102", "status": "ABSENT", "remarks": "Sick leave" }
    ]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Attendance marked for 2 entries on 2026-10-17."
  }
  ```
- **Error `403 Forbidden` (Locked Attendance):**
  ```json
  {
    "success": false,
    "error": "Attendance for 2026-10-17 (Class VIII) is locked. Contact Principal for unlock permissions.",
    "code": "ATTENDANCE_LOCKED",
    "requestId": "req-1729150000000-301"
  }
  ```

#### `POST /api/attendance/lock`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT (`SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`)
- **Request Body:**
  ```json
  {
    "date": "2026-10-17",
    "className": "Class VIII",
    "isLocked": true,
    "reason": "Roster freeze after 2:00 PM"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Attendance for 2026-10-17 (Class VIII) has been LOCKED.",
    "lock": {
      "id": "lock-I2A-SCH-000001-2026-10-17-Class VIII",
      "schoolId": "I2A-SCH-000001",
      "date": "2026-10-17",
      "className": "Class VIII",
      "isLocked": true
    }
  }
  ```

---

### 2.5 Fee Collection & Financial Integrity

#### `POST /api/fees/types`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT (`SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `ACCOUNTANT`)
- **Validation Rules:** `name` is required, `amount` must be a non-negative number.
- **Request Body:**
  ```json
  {
    "name": "Science Laboratory Fee",
    "amount": 750,
    "frequency": "QUARTERLY",
    "category": "LAB"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "feeType": {
      "id": "fee-1729150000000-112",
      "schoolId": "I2A-SCH-000001",
      "name": "Science Laboratory Fee",
      "amount": 750,
      "frequency": "QUARTERLY",
      "category": "LAB",
      "createdAt": "2026-10-17T08:00:00.000Z"
    }
  }
  ```

#### `POST /api/fees/receipts/collect`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Bearer JWT (`ACCOUNTANT`, `ADMIN`, `PRINCIPAL`, `STAFF`)
- **Server Financial Rule:** Never trusts client-supplied fee amounts. Re-queries `fee_types` from MongoDB using `feeIds` and computes totals authoritatively on the server.
- **Request Body:**
  ```json
  {
    "studentId": "std-101",
    "feeIds": ["fee-1", "fee-2"],
    "paymentMode": "UPI",
    "transactionRef": "UPI-9842104821",
    "discountAmount": 0,
    "fineAmount": 0
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Payment verified and receipt generated.",
    "receipt": {
      "id": "rcp-1729150000000-721",
      "schoolId": "I2A-SCH-000001",
      "receiptNo": "INV-2026-948210",
      "studentName": "Rahul Kumar",
      "totalAmount": 2300,
      "paidAmount": 2300,
      "status": "PAID"
    }
  }
  ```

---

### 2.6 Payment Gateway Integration

#### `POST /api/payments/create-order`
- **Status:** **SANDBOX VERIFIED / LIVE BLOCKED (Zero False Pass)**
- **Authentication:** Bearer JWT
- **Request Body:**
  ```json
  {
    "amountInPaise": 250000,
    "orderType": "FEE_PAYMENT",
    "environment": "TEST"
  }
  ```
- **Response `200 OK` (Test Mode):**
  ```json
  {
    "success": true,
    "gatewayOrderId": "order_rzp_1729150000000_a1b2c3d4",
    "amountInPaise": 250000,
    "currency": "INR",
    "keyId": "rzp_test_mock_schoolos_2026",
    "verificationCaveat": "TEST/SANDBOX MODE: Simulated gateway order. Webhook verification enabled."
  }
  ```
- **Response `400 Bad Request` (Live Mode without credentials):**
  ```json
  {
    "success": false,
    "status": "BLOCKED_NO_CREDENTIALS",
    "error": "Live payment gateway calls are blocked: Server requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment configuration.",
    "verificationCaveat": "LIVE_CREDENTIALS_REQUIRED"
  }
  ```

#### `POST /api/payments/webhook`
- **Status:** **IMPLEMENTED & VERIFIED**
- **Authentication:** Cryptographic HMAC SHA-256 header `x-razorpay-signature`
- **Idempotency Rule:** Queries `processed_webhooks` by `eventId`. Replays return `200 OK` with `status: "IDEMPOTENT_SKIPPED"`.
