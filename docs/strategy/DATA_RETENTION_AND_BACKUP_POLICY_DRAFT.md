# Data Retention, Purging & Backup Recovery Policy Draft
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-015 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Statutory Retention Schedules by Data Category

Educational institutions are legally obligated by national tax laws, education boards, and child protection statutes to preserve specific records while strictly purging ephemeral data. i2A SchoolOS enforces the following retention lifecycle:

| Data Category | Specific Entity / Collection | Mandated Retention Period | Legal / Operational Basis | Archival / Purging Action |
| :--- | :--- | :--- | :--- | :--- |
| **Academic Transcripts & Diplomas** | `students`, `exams`, `report_cards` | **Permanent (Indefinite)** | National Board Verification, Alumni Transcripts | Cold-tier archival upon student graduation. |
| **Financial Records & Receipts** | `fee_receipts`, `payroll`, `expenses` | **8 Years Minimum** | India Income Tax Act 1961, Companies Act | Read-only ledger archive; immutable against deletion. |
| **Withdrawn Student Records** | `students` (Status: `WITHDRAWN`) | **7 Years Post-Withdrawal** | Statute of Limitations, Transfer Verification | PII masked after 7 years; academic grades retained. |
| **Security & Operational Audit Logs**| `audit_logs` | **5 Years Minimum** | IT Act 2000, Regulatory Cyber Audits | Append-only cold storage; zero truncation permitted. |
| **Trial Expired School Tenants** | `schools`, `users` | **60 Calendar Days** | i2A Commercial Grace Period Policy | Read-only for 60 days; soft-archived on Day 61. |
| **Revision Videos (₹40 Plan)** | `revision_videos` | **Exactly 30 Calendar Days** | Owner-Specified ₹40 Plan SLA | Automated cron purges stream access on Day 31. |
| **Revision Videos (₹50 Plan)** | `revision_videos` | **Exactly 365 Calendar Days** | Owner-Specified ₹50 Plan SLA | Automated cron archives video after 1 academic year. |
| **Transient OTP Tokens** | `password_resets` | **15 Minutes** | NIST SP 800-63B Password Recovery | Hard deleted immediately upon single use or expiry. |

---

## 2. Automated Purging & Soft-Delete Standards

1. **Soft-Delete Architecture (`deletedAt` Pattern):**
   - No primary entity (Student, Teacher, Fee Structure, Product) is ever destroyed via immediate SQL/NoSQL `DELETE` in production.
   - Deleted entities update their status to `ARCHIVED` or set a timestamp `deletedAt: "2026-10-17T11:00:00Z"`.
   - All standard queries automatically filter `{ deletedAt: null }`.
2. **Automated Video Retention Purge Job:**
   - A scheduled background job runs daily at 02:00 AM UTC.
   - Identifies videos where `recordedDate + retentionDays < CurrentDate`.
   - Deletes video chunks from the high-cost streaming CDN / Cloudflare R2 bucket while preserving the textual metadata and lesson title for academic record completeness.

---

## 3. Backup & Disaster Recovery Architecture (DRP)

### 3.1 Backup Cadence
- **Continuous Point-in-Time Recovery (PITR):** MongoDB oplog streaming enabled, capturing every transaction with maximum 15-minute recovery granularity.
- **Daily Automated Full Snapshots:** Daily snapshots captured at 01:00 AM Indian Standard Time (IST), compressed, encrypted with AES-256, and pushed to off-site cloud storage.
- **Weekly Cold Archival:** Full database dumps mirrored to a secondary geographic cloud region (e.g. Primary in AWS Mumbai `ap-south-1`; Backup in AWS Hyderabad `ap-south-2`).

### 3.2 Recovery Targets (RTO & RPO)
- **Recovery Point Objective (RPO):** $< 15\text{ minutes}$ (Maximum possible data loss in a catastrophic datacenter outage).
- **Recovery Time Objective (RTO):** $< 2\text{ hours}$ (Full system restoration and DNS failover to standby replica).

### 3.3 Annual Disaster Recovery Drill
Every 6 months, platform engineers execute a simulated disaster recovery drill on a staging cluster: restoring the latest snapshot, verifying SHA256 integrity, checking tenant boundary isolation, and verifying that test transactions succeed.
