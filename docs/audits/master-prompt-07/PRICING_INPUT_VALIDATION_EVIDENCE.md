# i2A SchoolOS — Pricing Engine Input Validation & Security Evidence

**Audit Timestamp:** October 19, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Quantitative QA Auditor  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Input Validation Architecture & Defect Remediation

### Defect Identified:
Previous iterations silently rounded fractional student counts (e.g. `450.85` was rounded to `451`) and clamped out-of-bounds tenure. This violated strict enterprise input contracts, which demand explicit client errors for malformed, fractional, or non-integral data.

### Remediation Applied in `server/routes/pricing.js`:
The pricing calculator was updated with strict, fail-closed validation:
1. **Alias Consistency:** Accepts both `studentCount` and `students` aliases with identical precedence:
   ```javascript
   const rawStudentInput = req.body.studentCount !== undefined ? req.body.studentCount : req.body.students;
   ```
2. **Missing Input Check:** If missing or empty, returns HTTP 400 with `MISSING_STUDENT_COUNT`.
3. **Finite Number Check:** Rejects `NaN`, `Infinity`, and unparseable strings with HTTP 400 `INVALID_STUDENT_COUNT`.
4. **Fractional Rejection (No Silent Rounding):** Rejects non-integer values with HTTP 400 `FRACTIONAL_STUDENT_COUNT`.
5. **Approved Value Range:**
   - Student count must be an integer between $1$ and $25,000$. Values $< 1$ return `STUDENT_COUNT_BELOW_MINIMUM`; values $> 25,000$ return `STUDENT_COUNT_EXCEEDS_MAXIMUM`.
   - Duration must be a whole integer between $1$ and $5$ years. Non-integers return `FRACTIONAL_DURATION`; values outside $[1, 5]$ return `DURATION_OUT_OF_BOUNDS`.
6. **Plan & Billing Cycle Whitelist:** Rejects invalid `planId` with `INVALID_PLAN_ID` and invalid `billingCycle` with `INVALID_BILLING_CYCLE`.
7. **Anti-Tampering:** Any client-supplied `price`, `discountAmount`, `gstAmount`, or `grandTotalWithGst` in the request payload is strictly ignored. The server evaluates quotes authoritatively.
8. **Provisional Quote Disclosure:** Every quote response contains `isProvisional: true` and an explicit commercial disclaimer.

---

## 2. Test Vectors & Empirical Assertion Results

The expanded test suite in [`PublicWebsiteAndCategoryCms.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/PublicWebsiteAndCategoryCms.test.ts#L620-L665) validates all input boundary cases:

| Vector ID | Tested Scenario / Input | Expected HTTP Status | Expected Error Code | Observed Status | Status |
|---|---|---|---|---|---|
| **Vector 25.1** | `studentCount: 450.85` (Fractional) | HTTP 400 | `FRACTIONAL_STUDENT_COUNT` | HTTP 400 | **PASS** |
| **Vector 25.2** | `durationYears: 1.5` (Fractional) | HTTP 400 | `FRACTIONAL_DURATION` | HTTP 400 | **PASS** |
| **Vector 25.3** | `studentCount: -250` (Negative) | HTTP 400 | `STUDENT_COUNT_BELOW_MINIMUM` | HTTP 400 | **PASS** |
| **Vector 25.4** | Omitted `studentCount` | HTTP 400 | `MISSING_STUDENT_COUNT` | HTTP 400 | **PASS** |
| **Vector 25.5** | `studentCount: 35000` (Excessive) | HTTP 400 | `STUDENT_COUNT_EXCEEDS_MAXIMUM` | HTTP 400 | **PASS** |
| **Vector 25.6** | Using `students: 600` alias with forged `grandTotalWithGst: 100` | HTTP 200 | Authoritative price calculated; client forgery ignored | HTTP 200 | **PASS** |
| **Vector 26.1** | `durationYears: 10` (Exceeds 5 years) | HTTP 400 | `DURATION_OUT_OF_BOUNDS` | HTTP 400 | **PASS** |
| **Vector 26.2** | Maximum discount stacking: `5 years` + `5000 students` | HTTP 200 | Total discount strictly capped at 40% | HTTP 200 | **PASS** |

---

## 3. Frontend & Backend Consistency

- The frontend pricing calculator in [`PricingPage.tsx`](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/public/pages/PricingPage.tsx#L155-L180) restricts input via `Math.floor(Number(e.target.value))` and slider steps of 25.
- Both English and Hindi disclaimer paragraphs appear beneath the calculator explaining that quotes are provisional estimates subject to institutional SLA add-ons and 18% GST (eligible for Input Tax Credit).
- The pricing engine is mathematically deterministic, tamper-resistant, and aligned across frontend UI and backend API responses.
