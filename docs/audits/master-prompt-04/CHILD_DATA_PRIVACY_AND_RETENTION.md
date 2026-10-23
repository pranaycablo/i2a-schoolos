# i2A SchoolOS — Child Data Privacy, Protection & DPDP Readiness Audit
**Document Reference:** `docs/audits/master-prompt-04/CHILD_DATA_PRIVACY_AND_RETENTION.md`  
**Phase:** Master Prompt 04 — Enterprise Security, Privacy, RBAC & Tenant Isolation  
**Date:** October 18, 2026  
**Status:** IMPLEMENTED & FACTUALLY VERIFIED  

---

## 1. Privacy-by-Design Architecture for Minors

Because SchoolOS processes educational, biometric, demographic, and contact information of minors (< 18 years old), the platform adheres to privacy-by-design principles: **Data Minimization**, **Purpose Limitation**, **Role-Based Access Control**, and **Field Redaction**.

```mermaid
flowchart TD
    subgraph INCOMING_REQUEST["Incoming Student Record Request"]
        Req["GET /api/students/:id"]
    end

    subgraph REDACTION_ENGINE["Privacy Redaction Engine (redactStudentPii)"]
        Req --> CheckRole{"Requester Role / Ownership"}
        CheckRole -->|Super Admin / Principal / Admin| FullData["Full Administrative Profile<br/>(Full Contact, Address, Academic)"]
        CheckRole -->|Verified Parent (Own Child)| ParentData["Parent Ward Profile<br/>(Full Contact, Fee History, Reports)"]
        CheckRole -->|Enrolled Student (Own Record)| StudentData["Student Profile<br/>(Own Grades, Homework, Timetable)"]
        CheckRole -->|Teacher / Staff / Accountant| RedactedData["Redacted Profile<br/>• Parent Mobile: ******3210<br/>• Parent Email: s**********r@domain.com<br/>• Aadhaar / National ID: XXXX-XXXX-9012<br/>• Stripped: Income, Bank Details, Private Medical Notes"]
    end
```

---

## 2. Dynamic Field Redaction Specifications

Source File: [`server/services/privacyService.js:1-125`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/privacyService.js#L1-L125)

### 2.1 Masking Algorithms
1. **Phone Number Masking (`maskPhone`):**
   - Preserves only the final 4 digits for contact verification.
   - Example: `+91 98765 43210` $\rightarrow$ `******3210`.
2. **Email Address Masking (`maskEmail`):**
   - Preserves the initial character and the domain name; masks local username.
   - Example: `sanjay.kumar@gmail.com` $\rightarrow$ `s**********r@gmail.com`.
3. **National ID / Aadhaar Masking (`maskNationalId`):**
   - Replaces the first 8 digits with `XXXX-XXXX-` and displays only the last 4 digits.
   - Example: `1234-5678-9012` $\rightarrow$ `XXXX-XXXX-9012`.

### 2.2 Strip-on-Read Fields
When records are requested by faculty, accountants, or non-administrative staff, the following sensitive attributes are stripped completely from memory prior to serialization:
- `annualIncome` / `parentIncome` (Financial privacy)
- `bankAccountNumber` / `ifscCode` (Financial account security)
- `medicalNotes` / `specialNeeds` (Sensitive health information)

---

## 3. Statutory Assessment: Indian DPDP Act & Rules Status

### 3.1 Factual Commencement Status
- **Statutory Enactment:** The *Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)* was passed by the Parliament of India and received Presidential assent on August 11, 2023.
- **Rules Status:** As of October 2026, the subordinate implementation rules under the DPDP Act remain in the consultation / drafting stage and have not been formally notified with effective enforcement dates.
- **Accurate Legal Claim:**
  > [!IMPORTANT]
  > i2A SchoolOS **does not assert unconditional statutory legal compliance**, as statutory enforcement mechanisms and rules under the DPDP Act are pending official gazette notification.  
  > However, SchoolOS has architecturally implemented the **Data Fiduciary technical safeguards** mandated by the Act in preparation for enforcement.

### 3.2 Implemented Technical Safeguards
1. **Data Fiduciary Obligations:** Educational institutions operate as Data Fiduciaries; i2A SchoolOS acts as Data Processor.
2. **Parental Consent Architecture:** Unenrolled minor profiles require verified parent/guardian email or phone authorization before activation.
3. **Zero Raw Aadhaar Policy:** The platform strictly prohibits collecting raw, unencrypted 12-digit Aadhaar numbers. The database schema stores only synthetic identifiers or masked representations (`XXXX-XXXX-1234`).
4. **Data Subject Rights Workflow (`/api/privacy/requests`):**
   - Right to Correction (`CORRECTION`)
   - Right to Erasure (`ERASURE`)
   - Consent Revocation (`REVOCATION`)
   - Right to Access (`ACCESS`)
   - Handled via dedicated endpoints in [`server/routes/privacy.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/privacy.js).
5. **Grievance Redressal Integration:** Institutional setup profile provides fields for designated Data Protection Officer (DPO) and institutional grievance contacts.
