# 👥 i2A SchoolOS — Staff & Workforce Management Architecture
> **Staff Master & Employee vs User Account Distinction Specification**

---

## 📌 Architectural Distinction

- **`Employee / Staff`**: Physical business & HR record (`employeeId`, `joiningDate`, `department`, `designation`).
- **`User`**: System authentication identity. An employee does NOT require a user login account to exist.
- **Account Disablement**: Disabling user access updates `status: 'INACTIVE'` without deleting historical employment data.
