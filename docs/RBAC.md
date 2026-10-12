# 🔑 i2A SchoolOS — Role-Based Access Control (RBAC) & Object Authorization
> **Domain Permissions & Resource-Level Security Engine**

---

## 📌 1. Roles & Object-Level Scoping

- **`SCHOOL_OWNER` / `PRINCIPAL`**: School-wide access.
- **`TEACHER`**: Restrict `CLASS_ROSTER` access to assigned class/section.
- **`PARENT`**: Restrict `STUDENT_PROFILE` and `FEE_RECEIPT` access to assigned children (`childrenIds`).
- **`STUDENT`**: Restrict `EXAM_RESULT` and profile access to own user ID (`studentId === user.id`).
