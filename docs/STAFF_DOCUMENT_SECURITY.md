# 🔒 i2A SchoolOS — Staff HR Document Security & Privacy Architecture
> **HR Record Isolation & Access Levels**

---

## 📌 Document Security & Privacy Levels

- **Storage Keys**: `schools/{tenantId}/staff/{staffId}/documents/...`.
- **Privacy Scopes**: `PRIVATE`, `DEPARTMENT_ONLY`, `AUTHORIZED_ADMIN_ONLY`. Teachers cannot read other employees' salary/HR documents.
