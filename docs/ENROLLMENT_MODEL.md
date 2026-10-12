# 🎓 i2A SchoolOS — Student Enrollment Foundation Model
> **Relational Enrollment Matrix & Status Lifecycle**

---

## 📌 Relational Model & Statuses

- **Relationships**: `Student -> Academic Session -> Class -> Section -> Subjects -> Stream`.
- **Enrollment Statuses**: `ACTIVE`, `PROMOTED`, `TRANSFERRED`, `WITHDRAWN`, `SUSPENDED`, `GRADUATED`, `ALUMNI`.
- **Historic Tracking**: Historical enrollments are archived per session without overwriting previous records.
