# 🛡️ i2A SchoolOS — Security Architecture & Data Protection Specification
> **Enterprise Data Security, Multi-Tenant Isolation & Encryption Standards**

---

## 🔐 1. Core Security Mandates

1. **Multi-Tenant Isolation**: Server-side filtering enforces `WHERE school_id = :active_tenant` on all SQL queries and API routes.
2. **Input Sanitation & XSS Prevention**: All text inputs (student notes, question text, remarks) are sanitized prior to rendering.
3. **No Secrets Exposure**: API keys, credentials, and private tokens are isolated via `.env` files.
4. **Idempotent Webhooks**: Payment gateways and WhatsApp webhooks process events with unique transaction hash verification to prevent duplicate receipts.

---

## 🔒 2. Data Encryption & Audit Policies

- **Data in Transit**: Enforced TLS 1.3 / HTTPS for all web communication.
- **Data at Rest**: Database column-level encryption for PII (Parent Mobile, Email, Address).
- **Forensic Audit Log**: Immutable log table (`audit_logs`) tracking action timestamp, user ID, role, action code, payload delta, and client IP address.
