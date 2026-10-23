# i2A SchoolOS — Pricing Presentation, Economics & Calculator Audit
**Audit Reference:** Master Prompt 07 — Public SaaS Website, Category CMS & Advertising Foundation  
**Deliverable:** 05 / 11  
**Timestamp:** 2026-10-18T18:00:00+05:30  
**Scope:** Pricing API (`server/routes/pricing.js`), Interactive Calculator & Ethical SaaS Presentation  

---

## 1. Executive Summary & Philosophy

In contrast to predatory educational software practices prevalent in the Indian market—which feature hidden implementation surcharges, mandatory proprietary hardware lock-ins, and artificial "limited time countdown timers"—i2A SchoolOS enforces a transparent, predictable per-student economic model.

All calculations are executed deterministically on the server side (`POST /api/pricing/quote`), ensuring that client-side manipulation cannot alter financial quotes or bypass statutory GST calculations.

---

## 2. Subscription Tiers & Unit Economics

| Tier Parameter | Starter Plan | Professional Plan (Flagship) | Enterprise Plan |
|---|---|---|---|
| **Target Institution** | Preschools, Tuition Hubs, Micro-Schools | Mainstream K-12 CBSE / ICSE Schools | Multi-Branch Trusts & Colleges |
| **Annual Base Cost** | ₹20,000 / year (₹2,000 / month) | ₹40,000 / year (₹4,000 / month) | ₹80,000 / year (₹8,000 / month) |
| **Per-Student Rate** | ₹120 / year (~₹10 / month) | ₹100 / year (~₹8.33 / month) | ₹80 / year (~₹6.66 / month) |
| **Capacity Limits** | Up to 300 students • 25 staff | Up to 1,500 students • 100 staff | Up to 10,000 students • Unlimited staff |
| **Hardware Biometrics** | Mobile Attendance only | ZKTeco / eSSL Direct Network Sync | Campus Turnstiles & Multi-Node Sync |
| **Fleet GPS Tracking** | Excluded | Full Driver App & Live Geofencing | Group-wide Fleet Telematics |
| **AI Question Bank & CBT** | Excluded | Automated CBSE Question Papers | Custom College Exam Bank & Rubrics |
| **Multi-Branch Trust Hub** | Single Campus only | Single Campus only | Centralized Group Treasury Dashboard |
| **Support SLA** | Standard Email & Knowledge Base | Priority WhatsApp & Phone Desk | Dedicated Success Architect (99.9% SLA) |

---

## 3. Mathematical Quoting Engine (`POST /api/pricing/quote`)

The quoting engine follows a deterministic financial formula:

$$\text{Gross Total} = \left(\text{BaseCost} + (\text{StudentCount} \times \text{PerStudentCost})\right) \times \text{DurationYears}$$

### A. Volume Discount Brackets
Volume discounts encourage multi-campus scale while maintaining fiscal transparency:
- 400 to 800 students: **5% volume discount**
- 801 to 1,500 students: **10% volume discount**
- 1,501 to 3,000 students: **15% volume discount**
- 3,001+ students: **20% volume discount**

### B. Multi-Year Commitment Discounts
- 2 Years: **10% discount**
- 3 Years: **15% discount**
- 5 Years: **20% discount**

### C. Strict Server-Side Discount Cap
To guarantee company solvency and fair contracting:
$$\text{Total Discount Percent} = \min(40, \text{VolumeDiscount} + \text{MultiYearDiscount})$$
Under no circumstances can cumulative discounts exceed **40%**.

### D. Statutory Tax Calculation
GST is calculated at exactly 18% of the net taxable amount with full input tax credit eligibility:
$$\text{GST Amount} = \text{round}(\text{NetTaxableAmount} \times 0.18)$$
$$\text{Grand Total} = \text{NetTaxableAmount} + \text{GST Amount}$$

---

## 4. Ethical Presentation Audit Checklist

| Presentation Standard | Verification Criterion | Codebase Finding | Compliance Status |
|---|---|---|---|
| **No Fabricated Urgency** | Zero artificial countdown timers (e.g. "Sale ends in 10 mins"). | No timer components exist on `/pricing` or marketing pages. | **PASS_VERIFIED** |
| **No Fabricated Testimonials** | All customer quotes must represent verified case studies. | No fake school names or fabricated review metrics exist. | **PASS_VERIFIED** |
| **No Hidden Setup Fees** | Implementation, data import, and software updates are included. | Confirmed: Free CSV migration support documented. | **PASS_VERIFIED** |
| **No Exit Penalties** | Schools can export complete database in CSV/JSON anytime. | Confirmed in Terms of Service (30-day export grace period). | **PASS_VERIFIED** |
| **No Credit Card Lock** | 14-day trial entry requires zero payment instrument. | Confirmed in `RegisterTrialPage.tsx`. | **PASS_VERIFIED** |

---

## 5. Verification Test Evidence
Executed under `src/__tests__/PublicWebsiteAndCategoryCms.test.ts`:
```
✓ Vector 13: GET /api/pricing/plans returns 3 published tiers without secret leaks (PASS)
✓ Vector 14: POST /api/pricing/quote calculates exact mathematical breakdown with GST & volume cap (PASS)
✓ Vector 15: POST /api/pricing/quote caps total discount strictly at 40% maximum (PASS)
```

**Verdict:** `PASS_VERIFIED` — Pricing API and frontend estimator provide accurate, transparent, and legally defensible economics.
