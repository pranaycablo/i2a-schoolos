# 📅 i2A SchoolOS — Teacher Assignment Model Specification
> **Relational Assignment Matrix & Inactive Validation**

---

## 📌 Relational Model

```
Teacher ➔ Academic Session ➔ Class ➔ Section ➔ Subject
```

- **Conflict Prevention**: Validation checks active session, section capacity, and inactive teacher status.
