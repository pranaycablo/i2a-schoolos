# Registration API & Input Validation Audit
**i2A SchoolOS | Phase 08 — Institution Onboarding Security & Compliance**
*Document Version:* 1.0.0  
*Audit Scope:* Public Intake Gateway, Schema Validation, Anti-Tamper Whitelisting, and Sanitization

---

## 1. Intake Endpoint Specification

- **Path:** `POST /api/tenants/applications`
- **Authentication:** Public / Unauthenticated intake.
- **Throttling:** 10-minute cooldown on active applications for the same normalized email address.
- **Success Status:** `201 Created`
- **Output:** `{ success: true, message: string, application: PublicApplicationDossier }`

---

## 2. Field Whitelisting & Validation Matrix

| Field | Required | Type | Validation & Whitelisting Rules | Adversarial Behavior |
|---|---|---|---|---|
| `schoolName` | Yes | String | 3–150 characters, stripped of HTML/script tags. | Script tags `<script>` stripped; empty returns 400. |
| `category` | No | String | Whitelist: `k12-schools`, `school-groups-trusts`, `colleges-higher-ed`, `coaching-institutes`, `tuition-centres`, `preschools`, `sports-arts-academies`. Default: `k12-schools`. | Unlisted string falls back safely to `k12-schools`. |
| `board` | No | String | Whitelist: `CBSE`, `ICSE`, `STATE_BOARD`, `IB`, `CAMBRIDGE`, `UNIVERSITY`, `OTHER`. Default: `CBSE`. | Unlisted board falls back safely to `CBSE`. |
| `adminName` | Yes | String | 2–100 characters, stripped of HTML/script tags. | Tag injection stripped; empty returns 400. |
| `adminEmail` | Yes | String | RFC 5322 regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Lowercased. | Malformed or non-email strings return 400. |
| `adminPhone` | Yes | String | Stripped to digits. Strict 10-digit Indian standard: `^\d{10}$`. | Non-10-digit strings return 400. |
| `city` | No | String | Stripped of HTML/script tags. Default: `Patna`. | Safe fallback applied. |
| `state` | No | String | Stripped of HTML/script tags. Default: `Bihar`. | Safe fallback applied. |
| `estimatedStudents` | No | Number | Clamped to bounds: `Math.max(1, Math.min(50000, n))`. Default: 300. | Extreme / negative integers clamped safely. |
| `planInterest` | No | String | Whitelist: `STARTER`, `PROFESSIONAL`, `ENTERPRISE`. Default: `PROFESSIONAL`. | Invalid strings fall back to `PROFESSIONAL`. |
| `status` | Ignored | String | **Client-override blocked.** Server strictly forces `PENDING_VERIFICATION`. | Attempted `APPROVED` ignored. |
| `verified` | Ignored | Boolean | **Client-override blocked.** Server strictly forces `false`. | Attempted `true` ignored. |
| `tenantId` | Ignored | String | **Client-override blocked.** Field stripped at intake. | Attempted tenant injection dropped. |
| `role` / `permissions`| Ignored | Any | **Client-override blocked.** Fields stripped at intake. | Privilege escalation attempts neutralized. |

---

## 3. Anti-Tamper & Security Assertions

1. **Client-Supplied Status Neutralization:**
   Clients attempting to submit `{ status: 'APPROVED', verified: true }` receive a document strictly persisted with:
   ```javascript
   status: 'PENDING_VERIFICATION',
   verified: false
   ```
   *Verified via Vitest Test 2:* PASS.

2. **Privilege Escalation Neutralization:**
   Submitting `{ role: 'SUPER_ADMIN', isSuperAdmin: true, permissions: ['ALL'] }` results in an application where all three fields are completely absent from the MongoDB document.
   *Verified via Vitest Test 3:* PASS.

3. **XSS & NoSQL Object Injection Protection:**
   Input fields pass through a strict regex-based HTML tag sanitizer:
   ```javascript
   const sanitize = (val) => (typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim() : '');
   ```
   No raw `<script>`, `<img>`, `<svg>`, or `<iframe>` tags can be stored in the database.
   *Verified via Vitest Test 8:* PASS.

4. **Normalized Storage:**
   Emails are trimmed and lowercased (`normalizedEmail = adminEmail.toLowerCase().trim()`), ensuring case variations (`Principal@School.edu.in` vs `principal@school.edu.in`) do not bypass uniqueness or cooldown constraints.
