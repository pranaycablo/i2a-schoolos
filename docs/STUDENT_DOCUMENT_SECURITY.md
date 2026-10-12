# 🔒 i2A SchoolOS — Student Document Security & Storage Architecture
> **Private Storage, Versioning & Access Control Specification**

---

## 📌 Document Security Mandates

- **Private Storage**: Documents (Birth Cert, TC, Marksheets) stored with `tenant:{tenantId}:student:{studentId}:doc:{version}` keys.
- **Signed Download Links**: Direct public storage URLs prohibited. Downloads require authenticated token verification.
