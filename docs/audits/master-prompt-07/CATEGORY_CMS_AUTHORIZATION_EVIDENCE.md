# i2A SchoolOS — Category CMS Authorization & Data Integrity Evidence

**Audit Timestamp:** October 18, 2026  
**Auditor Roles:** Principal Security Architect, Senior Backend Auditor  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Category Architecture & 7 Educational Verticals

The Category CMS powers specialized landing pages, onboarding journeys, and configuration profiles for 7 distinct educational institution types across India:

1. **`k12-schools`:** K-12 Private & CBSE/ICSE Schools (CBSE report cards, bus GPS, biometric attendance).
2. **`school-groups-trusts`:** Multi-Branch Educational Groups & Trusts (Centralized HQ treasury, consolidated ledger, campus switching).
3. **`colleges-higher-ed`:** Colleges & Higher Education (NEP 2020 semester CBCS credit matrix, departmental faculty workload).
4. **`coaching-test-prep`:** Coaching Institutes & Competitive Test Prep (Batch allocation, offline OMR + online CBT test series).
5. **`preschools-daycare`:** Preschools & Early Childhood Daycare (Activity milestones, immunization tracker, hourly daycare billing).
6. **`vocational-skill-centers`:** Vocational & Skill Development Centers (NSDC/PMKVY batch logging, modular certifications).
7. **`sports-arts-academies`:** Sports, Performing Arts & Activity Centers (Court reservations, belt assessments, tournament rosters).

---

## 2. API Authorization & Access Boundary Matrix

| Endpoint | Method | Required Scope / Role | Security Controls | Test Vector | Result |
|---|---|---|---|---|---|
| `/api/categories` | `GET` | **Public** | Returns strictly `status: 'PUBLISHED'` categories sorted by `displayOrder`. Ignores DRAFT and ARCHIVED documents. | Vector 01, 02 | **PASS (200 OK)** |
| `/api/categories/:slug` | `GET` | **Public** | Case-insensitive clean slug lookup. **Sealed Seed Fallback Leak:** If category exists in DB with `ARCHIVED` or `DRAFT` status, returns 404 immediately (`CATEGORY_NOT_FOUND`). Only consults static seeds if collection has 0 documents. | Vector 03, 04, 23 | **PASS (200 / 404)** |
| `/api/categories/admin/all` | `GET` | `SUPER_ADMIN` | Authenticated + role-gated. Returns entire inventory (PUBLISHED, DRAFT, ARCHIVED) with statistics. | Vector 05, 06, 07 | **PASS (200 OK)** |
| `/api/categories` | `POST` | `SUPER_ADMIN` | Mandatory field validation (name, slug format `^[a-z0-9]+(?:-[a-z0-9]+)*$`), duplicate slug rejection (409), HTML/XSS sanitization, immutable audit logging. | Vector 08, 09, 10, 11 | **PASS (201 Created)** |
| `/api/categories/:id` | `PUT` | `SUPER_ADMIN` | Mutation validation, slug uniqueness check, audit logging. | Vector 12 | **PASS (200 OK)** |
| `/api/categories/:id` | `DELETE` | `SUPER_ADMIN` | Soft-delete setting `status: 'ARCHIVED'`. Prevents accidental data destruction. Audit logged. | Vector 12 | **PASS (200 OK)** |

---

## 3. RBAC Enforcement Empirical Results

When mutating or accessing administrative category endpoints with non-privileged roles:

| Attempted Actor | Attempted Action | Expected Response | Observed Response | Audit Event Logged |
|---|---|---|---|---|
| Unauthenticated Client | `GET /api/categories/admin/all` | HTTP 401 Unauthorized | **HTTP 401 Unauthorized** | N/A (Rejected at Auth Gate) |
| Principal (`PRINCIPAL`) | `POST /api/categories` | HTTP 403 Forbidden | **HTTP 403 Forbidden** | Yes (`INSUFFICIENT_PERMISSIONS`) |
| Teacher (`TEACHER`) | `PUT /api/categories/CAT-001` | HTTP 403 Forbidden | **HTTP 403 Forbidden** | Yes (`INSUFFICIENT_PERMISSIONS`) |
| Parent (`PARENT`) | `DELETE /api/categories/CAT-001` | HTTP 403 Forbidden | **HTTP 403 Forbidden** | Yes (`INSUFFICIENT_PERMISSIONS`) |
| Super Admin (`SUPER_ADMIN`) | `POST /api/categories` | HTTP 201 Created | **HTTP 201 Created** | Yes (`CATEGORY_CREATED`) |

---

## 4. Remediation Evidence: Seed Fallback Leak Closure (Vector 23)

### The Defect (Before Remediation):
In early implementations, `GET /api/categories/:slug` queried:
```javascript
let category = await database.collection('institution_categories').findOne({
  $or: [{ slug: cleanSlug }, { id: cleanSlug }],
  status: 'PUBLISHED'
});
if (!category) {
  category = SEED_CATEGORIES.find(c => (c.slug === cleanSlug || c.id === cleanSlug) && c.status === 'PUBLISHED');
}
```
If an institution category was archived by a platform administrator, `findOne({ status: 'PUBLISHED' })` returned `null`. The code fell back to `SEED_CATEGORIES`, where standard categories have `status: 'PUBLISHED'`, exposing the supposedly archived category to the public!

### The Hard Fix Applied:
```javascript
// Check database first for the slug/id regardless of status
const categoryInDb = await database.collection('institution_categories').findOne({
  $or: [{ slug: cleanSlug }, { id: cleanSlug }]
});

if (categoryInDb) {
  // If it exists in DB but is not PUBLISHED (e.g. ARCHIVED or DRAFT), return 404 immediately
  if (categoryInDb.status !== 'PUBLISHED') {
    return res.status(404).json({
      success: false,
      error: `Category '${slug}' not found or not published.`,
      code: 'CATEGORY_NOT_FOUND'
    });
  }
  return res.json({ success: true, category: categoryInDb });
}

// Only if collection is completely unseeded/empty do we check static seeds
const totalCount = await database.collection('institution_categories').countDocuments();
if (totalCount === 0) {
  const seedCat = SEED_CATEGORIES.find(c => (c.slug === cleanSlug || c.id === cleanSlug) && c.status === 'PUBLISHED');
  if (seedCat) return res.json({ success: true, category: seedCat });
}

return res.status(404).json({
  success: false,
  error: `Category '${slug}' not found or not published.`,
  code: 'CATEGORY_NOT_FOUND'
});
```

### Empirical Test Vector 23 Result:
```bash
✓ Vector 23: Seed Fallback Leak Protection: Archived category in DB returns 404 and never leaks via static seeds (8ms)
```
Archived and draft categories in the database are guaranteed fail-closed with HTTP 404.
