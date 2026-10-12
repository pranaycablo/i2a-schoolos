# 🔌 i2A SchoolOS — API Authorization & Middleware Specification
> **Server-Side Authorization Middleware & Error Format Specification**

---

## 📌 Middleware Execution Pipeline

```
Incoming API Request ➔ Auth Token Verification ➔ Server Session Resolution ➔ Tenant Validation ➔ RBAC Check ➔ Object Authorization ➔ Controller Action
```

### Error Response Contract
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "DENIED: Cross-tenant access violation."
  },
  "requestId": "req-9842104"
}
```
