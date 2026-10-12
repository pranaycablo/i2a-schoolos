# 🔐 i2A SchoolOS — Authentication & Identity Architecture
> **Production Password Hashing, Session Security & Account Recovery Specification**

---

## 📌 1. Authentication Lifecycle

```
Client Login Request ➔ Rate Limiting & Brute-force Audit ➔ Password Hash Verification ➔ Server-Side Tenant Context Resolution ➔ Session Token Issuance
```

- **Password Hashing**: Bcrypt / Argon2 id with salt rounds. Plaintext password storage strictly prohibited.
- **Account Status**: `ACTIVE`, `INVITED`, `PENDING`, `SUSPENDED`, `LOCKED`.
- **Session Security**: Single-use token rotation, instant revocation upon logout or suspension.
