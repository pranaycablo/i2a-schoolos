# 📅 i2A SchoolOS — Academic Session Lifecycle Architecture
> **Single Active Session Rule & Historic Session Preservation**

---

## 📌 Session Lifecycle & Rules

```
DRAFT ➔ UPCOMING ➔ ACTIVE ➔ COMPLETED ➔ ARCHIVED
```

- **Single Active Session Constraint**: Exactly one session can have `status: 'ACTIVE'` and `isCurrent: true` per tenant at any point in time.
- **Historic Data Preservation**: Previous session records (2025-26, 2024-25) are never overwritten or deleted.
- **Session Transition Validation**: Session closure validates pending fees, exams, and promotions before archiving.
