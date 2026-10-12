# 🏫 i2A SchoolOS — Academic Master Data Architecture
> **Hierarchical Academic Structure & Readiness Checker Specification**

---

## 📌 1. Academic Master Hierarchy

```
School (Tenant)
 └── Academic Session (Active Session Scope)
      └── Campus / Branch (Patna, Gaya, Ranchi)
           └── Class (Nursery to Class 12, Configurable)
                └── Section (A, B, C with Capacity & Room Allocation)
                     └── Stream (Science, Commerce, Arts, Vocational)
                          └── Subject (Theory, Practical & Internal Marks)
                               └── Teacher Assignment (Class + Section + Subject + Teacher)
                                    └── Student Enrollment
```

- **School Types Supported**: CBSE, ICSE, State Board, IB, Pre-Primary, Primary, Middle, Secondary, Senior Secondary, English & Hindi Mediums.
- **Readiness Engine**: `checkAcademicReadiness(tenantId)` returns `READY` or `NOT_READY` with percentage breakdown.
