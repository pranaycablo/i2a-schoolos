# 💰 i2A SchoolOS — Fee & Finance Core Engine Specification
> **Server-Side Financial Truth & Calculation Principles**

---

## 📌 1. Operational Chain

```
CONFIGURE ONCE ➔ CALCULATE ➔ COLLECT ➔ VERIFY ➔ RECEIPT ➔ NOTIFY ➔ LEDGER ➔ DASHBOARD
```

- **Custom Fee Types ("Other Fee" Mandate)**: Preserves exact school custom fee names ("Smart Class Fee", "Annual Function Fee", "Educational Tour Fee") across all receipts, ledgers, invoices, and reports.
- **Server Balance Truth**: Net Payable = `Max(0, Base + Fine - Discount - Scholarship)`. Balance = `Max(0, Net Payable - Paid)`.
