# 🛡️ i2A SchoolOS — Security Model & Defense-In-Depth Architecture
> **Centralized Defense-In-Depth Security Architecture**

---

## 📌 Defense Layers

1. **Authentication Layer**: Hashed passwords, token rotation, failed login rate limits.
2. **Tenant Isolation Layer**: Server-side user session context verification rejecting client-side URL or payload tenant tampering.
3. **Role Permission Layer**: RBAC checks across domain permissions.
4. **Object-Level Authorization**: Parent restricted to own children, Student to own record, Teacher to assigned class.
5. **Audit Logging**: Immutable event log recording all sensitive actions.
