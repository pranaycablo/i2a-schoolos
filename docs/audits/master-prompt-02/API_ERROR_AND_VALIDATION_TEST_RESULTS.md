# i2A SchoolOS — Master Prompt 02: API Error & Validation Test Results
**Document ID:** `DOC-MP02-ERR-VALIDATION-005`  
**Phase:** Master Prompt 02 — Architecture Hardening & API Contracts  
**Auditor:** QA Automation Lead, Senior Backend Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary

This report documents the empirical test results for input validation and standardized error contracts across the API gateway, verified using [`src/__tests__/ApiContractsAndValidation.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/ApiContractsAndValidation.test.ts).

All tests executed against the live HTTP Express server connected to `i2a_schoolos_test`.

---

## 2. Test Execution Breakdown

### Test 1: Unauthenticated Request Handling
- **Route:** `GET /api/students`
- **Request Headers:** None (No Authorization header)
- **Expected Status:** `401 Unauthorized`
- **Actual Status:** `401 Unauthorized`
- **Response Body Assertion:**
  ```json
  {
    "success": false,
    "error": "UNAUTHORIZED: Authentication token missing. Please log in.",
    "code": "AUTH_TOKEN_MISSING",
    "requestId": "req-1729150000000-1"
  }
  ```
- **Result:** **PASSED**

---

### Test 2: Invalid JWT Token Handling
- **Route:** `GET /api/students`
- **Request Headers:** `Authorization: Bearer invalid_signature_token_xyz`
- **Expected Status:** `403 Forbidden`
- **Actual Status:** `403 Forbidden`
- **Response Body Assertion:**
  ```json
  {
    "success": false,
    "error": "FORBIDDEN: Invalid authentication token.",
    "code": "INVALID_TOKEN",
    "requestId": "req-1729150000000-2"
  }
  ```
- **Result:** **PASSED**

---

### Test 3: Input Validation on Student Creation (`POST /api/students`)
- **Route:** `POST /api/students`
- **Auth Role:** Principal (`principal@abcpublicschool.edu.in`)
- **Request Body (Invalid):**
  ```json
  {
    "admissionDate": "2026-10-17"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Actual Status:** `400 Bad Request`
- **Response Body Assertion:**
  ```json
  {
    "success": false,
    "error": "Validation failed: Student name, className, and section are required fields.",
    "code": "VALIDATION_ERROR",
    "details": [
      "Field \"name\" is required.",
      "Field \"className\" is required.",
      "Field \"section\" is required."
    ],
    "requestId": "req-1729150000000-5"
  }
  ```
- **Result:** **PASSED** (Rejects missing fields with specific field detail list).

---

### Test 4: Input Validation on Fee Type Creation (`POST /api/fees/types`)
- **Route:** `POST /api/fees/types`
- **Auth Role:** Principal (`principal@abcpublicschool.edu.in`)
- **Request Body (Invalid Negative Amount):**
  ```json
  {
    "name": "Invalid Negative Fee",
    "amount": -500
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Actual Status:** `400 Bad Request`
- **Response Body Assertion:**
  ```json
  {
    "success": false,
    "error": "Validation failed: Fee name is required and amount must be a non-negative number.",
    "code": "VALIDATION_ERROR",
    "requestId": "req-1729150000000-6"
  }
  ```
- **Result:** **PASSED**

---

### Test 5: Global 404 Route Not Found
- **Route:** `GET /api/non-existent-endpoint-xyz`
- **Expected Status:** `404 Not Found`
- **Actual Status:** `404 Not Found`
- **Response Body Assertion:**
  ```json
  {
    "success": false,
    "error": "API endpoint not found: GET /api/non-existent-endpoint-xyz",
    "code": "ROUTE_NOT_FOUND",
    "requestId": "req-1729150000000-8"
  }
  ```
- **Result:** **PASSED**

---

## 3. Compliance Summary

| Test Objective | Route | Verified Code | Status |
| :--- | :--- | :--- | :--- |
| Unauthenticated Guard | `GET /api/students` | `AUTH_TOKEN_MISSING` | **PASSED** |
| Malformed/Forged Token Guard | `GET /api/students` | `INVALID_TOKEN` | **PASSED** |
| Student Field Validation | `POST /api/students` | `VALIDATION_ERROR` | **PASSED** |
| Fee Range Validation | `POST /api/fees/types` | `VALIDATION_ERROR` | **PASSED** |
| Global 404 Route Interceptor | `ANY /api/*` | `ROUTE_NOT_FOUND` | **PASSED** |
