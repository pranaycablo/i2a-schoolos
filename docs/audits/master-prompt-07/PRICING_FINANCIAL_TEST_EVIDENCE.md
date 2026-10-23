# i2A SchoolOS — Pricing Engine & Financial Verification Evidence

**Audit Timestamp:** October 18, 2026  
**Auditor Roles:** Senior Full-Stack Developer, Quantitative QA Specialist  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Mathematical Architecture & Business Rules

The subscription billing engine (`server/routes/pricing.js`) evaluates institutional quotes deterministically based on three variables:
1. **Plan Tier:** `STARTER` (Base ₹20k/yr + ₹120/student), `PROFESSIONAL` (Base ₹48k/yr + ₹240/student), `ENTERPRISE` (Base ₹120k/yr + ₹360/student).
2. **Enrolled Student Volume:** Clamped to integer range `[1, 25000]`.
3. **Commitment Duration:** Clamped to integer range `[1, 5]` years.

### Formulae:
$$ \text{Gross Total} = \left(\text{Base Yearly Price} + (\text{Student Count} \times \text{Per Student Price})\right) \times \text{Duration Years} $$
$$ \text{Volume Discount \%} = \begin{cases} 20\% & \text{if } S > 3000 \\ 15\% & \text{if } S > 1500 \\ 10\% & \text{if } S > 800 \\ 5\% & \text{if } S > 400 \\ 0\% & \text{otherwise} \end{cases} $$
$$ \text{Commitment Discount \%} = \begin{cases} 20\% & \text{if } Y \ge 5 \\ 15\% & \text{if } Y \ge 3 \\ 10\% & \text{if } Y \ge 2 \\ 0\% & \text{otherwise} \end{cases} $$
$$ \text{Total Discount \%} = \min(40\%, \text{Volume Discount \%} + \text{Commitment Discount \%}) $$
$$ \text{Discount Amount} = \text{round}\left(\frac{\text{Gross Total} \times \text{Total Discount \%}}{100}\right) $$
$$ \text{Net Taxable Amount} = \max(0, \text{Gross Total} - \text{Discount Amount}) $$
$$ \text{GST (18\%)} = \text{round}(\text{Net Taxable Amount} \times 0.18) $$
$$ \text{Grand Total (with GST)} = \text{Net Taxable Amount} + \text{GST} $$

---

## 2. Boundary Values & Sanitization Remediation (Vector 25 & 26)

### Defect Identified:
Previous iterations allowed raw floating-point numbers in `studentCount` and `durationYears` (e.g. `450.85` students or `-250` students), causing non-integer student values in JSON payloads.

### Remediation Applied in `server/routes/pricing.js`:
```javascript
const parsedStudents = Math.round(Number(studentCount));
const students = Math.max(1, Math.min(25000, Number.isFinite(parsedStudents) && parsedStudents > 0 ? parsedStudents : 1));
const parsedYears = Math.round(Number(durationYears));
const years = Math.max(1, Math.min(5, Number.isFinite(parsedYears) && parsedYears > 0 ? parsedYears : 1));
```

### Empirical Test Results:

| Scenario / Vector | Input Payload | Output Assertion | Status |
|---|---|---|---|
| **Standard Professional Tier (Vector 14)** | Plan: `PROFESSIONAL`, Students: 1000, Duration: 2 yrs | Gross: ₹5,76,000; Discount: 20% (₹1,15,200); Net: ₹4,60,800; GST: ₹82,944; Grand Total: ₹5,43,744 | **PASS** |
| **Discount Ceiling Cap (Vector 15)** | Plan: `ENTERPRISE`, Students: 5000 (20%), Duration: 5 yrs (20%) | Theoretical Sum: 40%; Cap Enforcement: $\le 40\%$ | **PASS** |
| **Float Sanitization (Vector 25)** | Students: `450.85`, Duration: `1.5` yrs | `studentCount`: 451 (Integer); Output is finite and strictly $> 0$ | **PASS** |
| **Negative Clamp (Vector 25)** | Students: `-250`, Duration: `-2` yrs | Clamped: Students = 1, Duration = 1 yr | **PASS** |
| **Extreme Duration Stress (Vector 26)** | Students: 5000, Duration: 10 yrs | Clamped: Duration = 5 yrs; Discount strictly capped at 40% | **PASS** |

---

## 3. Financial Test Evidence Summary

```bash
✓ Vector 13: GET /api/pricing/plans returns 3 published tiers without secret leaks (2ms)
✓ Vector 14: POST /api/pricing/quote calculates exact mathematical breakdown with GST & volume cap (2ms)
✓ Vector 15: POST /api/pricing/quote caps total discount strictly at 40% maximum (2ms)
✓ Vector 25: Financial Engine Boundaries: Non-integer, negative, and extreme inputs handled deterministically (2ms)
✓ Vector 26: Financial Engine Security: Discount percentage can never exceed 40% cap even with extreme duration (1ms)
```

The pricing calculation is 100% deterministic, robust against invalid inputs, and mathematically verified.
