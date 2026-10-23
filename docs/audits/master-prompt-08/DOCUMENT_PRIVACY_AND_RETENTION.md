# Document Privacy, Security & Retention Policy
**i2A SchoolOS | Phase 08 — Institution Onboarding Security & Compliance**
*Document Version:* 1.0.0  
*Audit Scope:* Document Submission Pipeline, Metadata Sanitization, Access Control, and PII Protection

---

## 1. Document Architecture & Types

i2A SchoolOS supports institutional KYC and compliance verification documentation submitted during onboarding or correction cycles.

### Supported Document Types
1. `govtRegCert` — Society Registration / Trust Deed / Section 8 Company Incorporation Certificate.
2. `affiliationDoc` — Official Affiliation Letter (CBSE / ICSE / State Board Recognition / UGC Approval).
3. `principalIdDoc` — Government-issued photo identity proof of the authorized signatory / Principal.
4. `taxExemptionCert` — 12A / 80G / Income Tax Exemption certificate (for registered non-profit trusts).

---

## 2. Document Upload Security Controls

1. **File Extension & MIME Type Whitelist:**
   - Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`.
   - Disallowed executable formats: `.exe`, `.sh`, `.php`, `.js`, `.bat`, `.html`, `.svg`.

2. **File Size Clamping:**
   - Maximum upload size per file: **10 MB** (10,485,760 bytes).
   - Enforced at both client form validation and backend schema sanitization:
     ```javascript
     fileSizeBytes: Math.min(10485760, Number(val.fileSizeBytes) || 1024)
     ```

3. **Storage Key Normalization & Path Traversal Guard:**
   - User-supplied filenames are sanitized to strip directory traversal sequences (`../`, `..\`) and special characters:
     ```javascript
     const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
     storageKey: `docs/tenants/pending/${Date.now()}_${cleanFileName}`
     ```
   - Files are stored in isolated storage paths partitioned by state and timestamp.

---

## 3. Privacy, Anonymity & PII Protection

1. **Public Tracking Projection Guard:**
   When an applicant queries `GET /api/tenants/applications/status/:applicationNo`:
   - Document storage keys and reviewer inspection notes are **never** returned.
   - Internal reviewer IDs (`reviewerId`, `reviewedBy`) are stripped to protect SaaS operations personnel from targeted harassment or social engineering.
   - Public responses project only high-level status, institutional name, and applicant-facing correction notes.

2. **Zero Plaintext Password Exposure:**
   - Pre-tenant applications contain **no passwords**.
   - Upon approval, the initial administrator user is provisioned with a cryptographic single-use invitation token (`crypto.randomBytes(24).toString('hex')`) and `mustChangePassword: true`.
   - The user creates their password securely during portal activation.
   - Plaintext passwords never appear in audit logs, terminal output, or database records.

---

## 4. Document Retention & Purge Lifecycle

| State | Retention Period | Action Post-Retention |
|---|---|---|
| `APPROVED` | Permanent (Tenant Lifetime) | Migrated to tenant's private archive container. Accessible only by tenant Super Admin and Platform Operators. |
| `REJECTED` | 90 Days | Retained for dispute resolution and anti-fraud cross-referencing. Purged after 90 days with audit log entry. |
| `CANCELLED` | 30 Days | Retained for 30 days in case applicant requests reopening; securely deleted thereafter. |
| `NEEDS_CORRECTION` | 60 Days | If no resubmission occurs within 60 days, application auto-transitions to `EXPIRED`. |
