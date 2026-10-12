# FOV-08 — i2A SchoolOS Notification Scheduler Forensic Audit

**Audit Date:** 2026-10-11  
**Project Path:** `D:\i2A_School ERP & Managment`  
**Certification Status:** `PASS_WITH_LIMITATION` (Scheduler Logic Verified; Node/Redis Cron Worker Blocked)  

---

## 1. Executive Summary

This forensic audit evaluates the notification engine and reminder scheduler responsible for broadcasting subscription payment reminders across the 30-day free trial lifecycle as specified in **FOV-08 (Phase 2)**.

The audit verifies the implementation of idempotent deduplication keys, daily notification rate limits, immediate suppression upon successful billing settlement, and honest status logging for external providers.

---

## 2. Notification Dispatch & Idempotency Engine

Implemented in [src/services/subscription/SubscriptionBillingService.ts](file:///D:/i2A_School%20ERP%20%26%20Managment/src/services/subscription/SubscriptionBillingService.ts):

### 2.1 Deterministic Key Construction
To guarantee that background jobs or repeated invocations never generate duplicate notifications for the same event on the same day:
$$\text{NotificationKey} = \text{"REM\_TRIAL\_"} + \text{SchoolID} + \text{"\_D"} + \text{TrialDay} + \text{"\_"} + \text{YYYY-MM-DD}$$

Before appending any notification to the school inbox:
```typescript
const alreadySent = notifications.some(n => n.id === notificationId);
if (alreadySent) {
  return null; // Idempotent suppression: skip sending
}
```

### 2.2 Lifecycle Trigger Logic
| Lifecycle Day | Action | Notification Type | Trigger Condition |
|---|---|---|---|
| Day 1 | Welcome to i2A SchoolOS Trial | `TRIAL_WELCOME` | Activated trial profile |
| Day 20 | First Payment Reminder | `TRIAL_REMINDER` | Exactly 10 days remaining |
| Days 21–29 | Daily Trial Status Notice | `TRIAL_REMINDER` | Max 1 per calendar day |
| Day 30 | Final Day & Activation Alert | `TRIAL_FINAL_DAY` | Last trial day |
| Any day post-payment | Auto-Suppression | None | `subscriptionTier === 'PAID_ACTIVE'` |

---

## 3. Provider Integration Status & Limitations

### 3.1 In-App Notification Hub
- **Status:** `PASS_VERIFIED`
- Fully functional in the client application. Administrators can view, filter, dismiss, and click actionable links (`Open Billing Page`) directly from the notification inbox.

### 3.2 External Notification Channels (SMS, WhatsApp, Email)
- **Status:** `NOT_CONFIGURED`
- In strict adherence to the Zero-False-Pass policy:
  - No fake Twilio, Gupshup, or SendGrid API keys were fabricated.
  - Channels are logged with status `NOT_CONFIGURED` until production credentials and an authentic server environment are provisioned.

### 3.3 Server Background Scheduler (OS / Cron / Worker)
- **Status:** `PASS_WITH_LIMITATION`
- The application currently operates as a client-side Vite/React SPA. Daily evaluation of trial days is triggered on application bootstrap and admin login.
- A true persistent cron daemon (such as BullMQ on Redis or an AWS EventBridge rule) cannot execute purely in browser memory without an active browser tab.
- This is an architectural limitation of client-only SPAs.

---

## 4. Automated Verification Results

- Verified in [src/__tests__/SubscriptionBilling.test.ts](file:///D:/i2A_School%20ERP%20%26%20Managment/src/__tests__/SubscriptionBilling.test.ts):
  - Day 20 notification generation: Passed.
  - Day 21-29 daily rate limit (1 per day): Passed.
  - Day 30 final notice: Passed.
  - Deduplication on multiple runs: Passed.
  - Auto-suppression when paid: Passed.

**Verdict:** `PASS_WITH_LIMITATION`.
