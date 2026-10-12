# ⚡ i2A SchoolOS — Centralized Event-Driven Automation Engine
> **Zero-Manual Workload Pipeline Specification**

---

## 📌 1. Event Trigger & Subscriber Matrix

```mermaid
graph TD
    E1["Event: student.admitted"] --> T1["Create Student Profile"]
    E1 --> T2["Generate Class Roll #"]
    E1 --> T3["Apply Fee Structure"]
    E1 --> T4["Create Parent Account"]

    E2["Event: fee.payment.success"] --> T5["Generate PDF Receipt"]
    E2 --> T6["Dispatch Email Receipt"]
    E2 --> T7["Send WhatsApp Business Template"]
    E2 --> T8["Update Student Ledger"]
    E2 --> T9["Update Principal KPI Dashboard"]
```

---

## 📌 2. Event Payload Contracts

### `fee.payment.success`
```json
{
  "eventId": "evt-894210",
  "eventType": "fee.payment.success",
  "tenantId": "sch-001",
  "timestamp": "2026-10-08T10:45:00Z",
  "payload": {
    "receiptNo": "INV-2026-001245",
    "studentId": "std-101",
    "studentName": "Rahul Kumar",
    "paidAmount": 2500,
    "paymentMode": "UPI"
  }
}
```
