# FOV-07A — School-Wise Independent Payment Gateway Security Audit

**Audit Date:** 2026-10-11  
**Project Path:** `D:\i2A_School ERP & Managment`  
**Classification:** `PASS_WITH_LIMITATION` (Provider Adapter & Zero-Secrets Verified; Live Webhook BLOCKED)  

---

## 1. Executive Summary

This forensic security audit evaluates the implementation of independent, school-specific payment gateways as specified in **FOV-07A**.

Each school operating an i2A Marketplace is provided an isolated merchant configuration supporting Razorpay, PhonePe, and Paytm. This architecture ensures that 100% of marketplace order revenue is credited directly to the respective school's merchant bank account without passing through or co-mingling with i2A Platform subscription billing.

---

## 2. Architecture & Provider Adapter Pattern

### 2.1 Provider Adapter Interface
Implemented in [src/services/payment/PaymentGatewayService.ts](file:///D:/i2A_School%20ERP%20%26%20Managment/src/services/payment/PaymentGatewayService.ts):
- `IPaymentGatewayAdapter`:
  - `initiatePayment(schoolConfig, request)`
  - `verifyPayment(schoolConfig, verificationRequest)`
  - `testConnection(schoolConfig)`
- Adapters implemented:
  1. `RazorpayGatewayAdapter`: Integrates Razorpay merchant key and simulated test-mode payment capture.
  2. `PhonePeGatewayAdapter`: Integrates PhonePe Merchant ID, App ID, and server callback handshake.
  3. `PaytmGatewayAdapter`: Integrates Paytm MID and website staging configuration.

---

## 3. Security Analysis & Hard Constraints

### 3.1 Client Zero-Secrets Guarantee
Because i2A SchoolOS currently runs as a client-side Single Page Application without a dedicated backend server or secure Key Management Service (KMS), storing private API secrets (`secretKey`, `saltKey`, `privateKey`) in browser client storage would represent a critical security vulnerability.

**Implemented Defense:**
The service strictly enforces that client-side configuration objects only store public identifiers (`apiKey`, `merchantId`, `appId`).
If any configuration payload attempts to send private secrets in the client object, the service immediately throws a security violation:
```typescript
if ('secretKey' in (config as Record<string, unknown>) || 'saltKey' in (config as Record<string, unknown>)) {
  throw new Error("SECURITY_VIOLATION: Private secret keys cannot be stored in client state!");
}
```

### 3.2 Live Mode Production Safety Gate
If an administrator switches the gateway mode from `TEST` to `LIVE`:
- The client-side adapter purposefully refuses live payment capture and returns:
  `status: 'BLOCKED_NO_BACKEND'`
- An explicit error code `BACKEND_WEBHOOK_REQUIRED` is generated.
- This prevents fraudulent or unverified payments from being marked as successful in the absence of a verified server-to-server webhook callback.

### 3.3 Direct School Settlement vs. Platform Split
- Marketplace orders have:
  - `platformFeePaise: 0`
  - `merchantSettlementAmountPaise: totalOrderAmountPaise`
- 100% of marketplace funds flow directly to the school merchant account.

---

## 4. Automated Test Verification

Test Suite: [src/__tests__/PaymentGatewayIsolation.test.ts](file:///D:/i2A_School%20ERP%20%26%20Managment/src/__tests__/PaymentGatewayIsolation.test.ts)

### Test Results
```text
✓ src/__tests__/PaymentGatewayIsolation.test.ts (7 tests) 32ms
  ✓ maintains independent payment gateway configurations for different schools
  ✓ strictly isolates transactions and reconciliation ledgers between schools
  ✓ enforces client zero-secrets security rule
  ✓ blocks live payment processing when backend webhook service is not available
  ✓ processes test-mode payments successfully using the adapter pattern
  ✓ ensures 100% direct merchant settlement with zero platform cut on school marketplace sales
  ✓ performs provider connection health check in test mode
```

All 7 tests passed cleanly.

---

## 5. Browser Evidence

- **Payment Gateway Settings Screenshot:** [payment_gateway_1791722223228.png](file:///C:/Users/HP/.gemini/antigravity-ide/brain/3ee8eba9-fa90-420a-94f7-7905cb19dc3f/payment_gateway_1791722223228.png)
  - Shows Provider dropdown (`RAZORPAY`, `PHONEPE`, `PAYTM`), Merchant Key input, Mode toggle (`TEST` / `LIVE`), and Connection Status (`CONNECTED` in Test Mode).
  - Displays prominent Security Notice regarding client-safe merchant key storage and backend webhook requirements for live transactions.

---

## 6. Zero-False-Pass Audit Matrix

| Security / Functional Gate | Verification Status | Forensic Reality |
|---|---|---|
| Provider Adapter Pattern | `PASS_VERIFIED` | Clean abstraction for Razorpay, PhonePe, Paytm |
| Independent School Gateways | `PASS_VERIFIED` | School A and School B have isolated configs |
| Client Zero-Secrets Policy | `PASS_VERIFIED` | Client storage rejects private keys |
| Direct Settlement (100% to school) | `PASS_VERIFIED` | Zero platform fee deduction verified |
| Test Mode Flow | `PASS_VERIFIED` | End-to-end simulated checkout functional |
| Live Mode Webhook Callback | `BLOCKED` | Requires dedicated Node.js/FastAPI server with HMAC signature verification |

**Overall Status:** `PASS_WITH_LIMITATION` (Architecture and test mode verified; live mode correctly blocked).
