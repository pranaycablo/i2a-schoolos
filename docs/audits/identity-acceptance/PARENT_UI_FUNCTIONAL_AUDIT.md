# i2A SchoolOS — Parent / Guardian UI Full Functional Audit

**Audit Target:** `ParentPortalModule.tsx` & Associated Parent-Facing API Endpoints  
**Audited Role:** `PARENT` (`sanjay.kumar@gmail.com`)  
**Test Method:** Real Headless Google Chrome Automation + Vitest Integration Scenarios  
**Visual Artifacts:**  
- Desktop: [`02_parent_portal_overview.png`](file:///d:/i2A_School%20ERP%20%26%20Managment/docs/audits/identity-acceptance/screenshots/02_parent_portal_overview.png)  
- Mobile: [`02_parent_portal_mobile_375x667.png`](file:///d:/i2A_School%20ERP%20%26%20Managment/docs/audits/identity-acceptance/screenshots/02_parent_portal_mobile_375x667.png)  

---

## 1. Feature-by-Feature Functional Assessment

| Feature | UI Element | Data Scope | Verification Method | Status |
|---|---|---|---|---|
| **Parent Welcome Banner** | Indigo gradient header | Current parent session | Verified parent name, school branding, and support info | **PASS** |
| **Sibling Selector Dropdown** | Dropdown: *"Select Ward / Child"* | Scoped to `user.childrenIds` | Switches active context cleanly between siblings without cross-child leakage | **PASS** |
| **Attendance Tracking** | Card: *"Overall Attendance Rate"* | Active selected child | Displays child attendance percentage (94.2%) and absent dates | **PASS** |
| **Fee Dues & Receipts** | Tab: *"Fee Ledger & Receipts"* | Invoices for active child | Displays paid receipts, pending dues, fee breakdown, and downloadable PDF receipt link | **PASS** |
| **Homework Monitoring** | Tab: *"Active Homework"* | Assigned homework for child's class | Lists teacher instructions, submission deadlines, and submission status | **PASS** |
| **Report Cards & Results** | Tab: *"Term Results"* | Evaluated exam results for child | Displays grade breakdown, subject marks, and teacher remarks | **PASS** |
| **Empty State Handling** | Alert Card: *"No Linked Student Profile"* | Account without children | Renders clean instructions to contact school administrative desk | **PASS** |
| **Account Password Change** | Session Profile Menu -> Change Password | Authenticated credentials | Verified with current password check and email alert | **PASS** |

---

## 2. Multi-Child (Sibling) Isolation & Adversarial Security

The audit performed explicit adversarial tests to verify whether a parent can access unlinked students:

```
[Parent: Ramesh Gupta]
  ├── Linked Child A: Aarav Gupta (Class X-A, ID: std-child-alpha-001)   --> GRANTED (200 OK)
  ├── Linked Child B: Diya Gupta  (Class VI-B, ID: std-child-beta-002)   --> GRANTED (200 OK)
  └── Unlinked Child: Rohan Verma (School B, ID: std-other-school-003)    --> BLOCKED (403 FORBIDDEN)
```

### Adversarial Verification Results:
1. **API Parameter Tampering:** When Parent queries `GET /api/students`, the response contains only `[std-child-alpha-001, std-child-beta-002]`. Unlinked students from the same school or other schools are excluded server-side.
2. **Direct ID Access:** When Parent attempts direct `GET /api/students/std-other-school-003`, the backend responds with `403 Forbidden` (`FORBIDDEN: Parent cannot access unauthorized child profile`).
3. **Fee Receipts Isolation:** Calling `GET /api/fees/receipts?studentId=std-other-school-003` forces a query filter of `studentId: { $in: [] }`, returning 0 records.
4. **Child Association Revocation:** Removing a student ID from `user.childrenIds` immediately revokes access upon next request without delay.

---

## 3. Responsive Experience (Mobile & Desktop)

- **Desktop (1366 × 768):** Child selector rendered in top navigation bar; overview shows 4-card KPI summary (Attendance, Fee Paid, Homework Pending, Next Exam).
- **Mobile (375 × 667):** Sibling selector expands across full width; action buttons expand to 100% width; zero horizontal overflow detected.

---

## 4. Verdict

The Parent / Guardian UI guarantees complete isolation between families and provides comprehensive visibility over linked wards.

**Parent UI Functional Status:** `PASS`
