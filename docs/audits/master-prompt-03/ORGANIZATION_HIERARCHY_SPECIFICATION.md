# i2A SchoolOS — Master Prompt 03: Organization Hierarchy Specification
**Document ID:** `DOC-MP03-ORG-HIERARCHY-002`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Architect:** Principal Software Architect, Enterprise Systems Architect  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Architectural Tree Specification

i2A SchoolOS supports a recursive, directed acyclic graph (DAG) representing the full institutional hierarchy from global SaaS root down to student cohorts.

```text
Level 0: Platform Core (Global SaaS Root - "I2A-PLATFORM")
  │
  └── Level 1: Organization / Educational Trust / Corporate Group / Govt Dept
        │      (e.g., "Delhi Public School Society" - ID: org-dps-group)
        │
        ├── [Level 1.1: Optional Administrative Jurisdiction Units]
        │     ├── Zone / Region (e.g., "North Zone")
        │     │     └── State (e.g., "Delhi NCR")
        │     │           └── District (e.g., "South Delhi District")
        │     │                 └── Block / Cluster
        │     └── [Direct assignment to branch without regional units]
        │
        └── Level 2: Branch / Campus / Operating School
              │      (e.g., "DPS R.K. Puram" - ID: I2A-SCH-000101)
              │
              ├── Level 3: Academic Session (e.g., "2026-2027" - ID: sess-2026)
              │     │
              │     └── Level 4: Program / Course (e.g., "Senior Secondary Science")
              │           │
              │           └── Level 5: Class / Grade (e.g., "Class XI" - numericOrder: 11)
              │                 │
              │                 └── Level 6: Section / Batch (e.g., "Section A")
              │                       ├── Student Enrollments & Roll Numbers
              │                       └── Assigned Class Teacher & Roster
              │
              └── Auxiliary Campus Facilities (Transport, Library, Inventory Counter)
```

---

## 2. Institutional Identification Invariants

### 2.1 Immutable Primary Keys
- **Organization ID:** Immutable string key (e.g., `org-synth-dps` or UUID).
- **Organization Code:** Unique uppercase alphanumeric slug (e.g., `DPS-SYNTH`).
- **School / Branch ID:** Immutable system identifier matching the regex `^I2A-SCH-[0-9]{6}$` (e.g., `I2A-SCH-000001`).
- **Branch Code:** Unique per tenant code (e.g., `ABC-SYNTH`).

### 2.2 Name Non-Uniqueness & Disambiguation
- **Rule:** Institutional name (e.g. *"ABC Public School"* or *"St. Xavier's High School"*) is **never** used as a database primary key or unique index.
- Multiple independent schools bearing identical names coexist in the system with distinct IDs and isolated databases:
  - School A: `id: "I2A-SCH-000001"`, `orgId: "org-synth-dps"`, `name: "ABC Public School (Synthetic Test)"`
  - School B: `id: "I2A-SCH-000004"`, `orgId: null` (Independent), `name: "ABC Public School (Synthetic Test)"`
- Query filtering strictly uses `schoolId` / `tenantFilter`, guaranteeing zero cross-school data leakage despite identical names.

### 2.3 Official External Identifiers (UDISE+ / Affiliation)
- Government codes (such as India's 11-digit **UDISE+ Code**) are stored as optional attributes in `officialIdentifiers.udiseCode`.
- **Validation Rule:** Regex `^[0-9]{11}$` strictly enforced.
- **Prohibition:** i2A SchoolOS **never** auto-generates or fabricates official government affiliation codes.

---

## 3. Standalone School Mode (Zero Overhead)

When deployed for an independent school or private academy:
1. `orgId = null` (no parent organization required).
2. `administrativeUnitId = null` (no zone/district/block required).
3. The school operates as its own top-level tenant where `tenantId = schoolId`.
4. All academic masters, classes, sections, students, and fees function directly under `schoolId` with zero performance or schema overhead.

---

## 4. Hierarchy Tree Integrity & Anti-Cycle Engine

To maintain mathematical tree properties and prevent infinite traversal loops in recursive queries, `server/services/hierarchyService.js` implements two foundational checks:

### 4.1 Valid Parent Check (`validateOrganizationLink`)
- When creating or updating an organization with `parentOrgId`:
  - The parent organization must exist in the database.
  - An organization cannot set itself as its own parent (`parentId === childId` -> `SELF_HIERARCHY_VIOLATION`).

### 4.2 Anti-Cycle Graph Traversal (`detectHierarchyCycle`)
```javascript
export async function detectHierarchyCycle(childId, candidateParentId, database) {
  if (childId === candidateParentId) return true;
  let currentId = candidateParentId;
  const visited = new Set([childId]);

  while (currentId) {
    if (visited.has(currentId)) return true; // Cycle detected!
    visited.add(currentId);
    const parentDoc = await database.collection('organizations').findOne({ id: currentId });
    if (!parentDoc || !parentDoc.parentOrgId) break;
    currentId = parentDoc.parentOrgId;
  }
  return false;
}
```
- **Error Codes:**
  - `SELF_HIERARCHY_VIOLATION`: Organization attempts to parent itself.
  - `INVALID_PARENT_ORGANIZATION`: Referenced parent does not exist.
  - `CIRCULAR_HIERARCHY_DETECTED`: Recursive ancestor loop detected.

---

## 5. Multi-Branch Governance & Authorization Scope

| Role | Organization Scope | Branch Scope | Permitted Access |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | All Organizations | All Branches (`schoolId: "ALL"`) | Global SaaS Administration, Plan Management, Audit Logs |
| **`ORG_DIRECTOR`** | Own Organization (`orgId`) | All child branches under `orgId` | Aggregated Multi-School Analytics, Trust Policies, Inter-Branch Reporting |
| **`PRINCIPAL`** | Scoped to own Branch | Single Branch (`schoolId`) | Full Campus Operations, Academic Session Activation, Staff Allocation |
| **`ADMIN`** | Scoped to own Branch | Single Branch (`schoolId`) | Day-to-Day Operations, Student Admissions, Fee Collection |
| **`TEACHER`** | Scoped to own Branch | Single Branch (`schoolId`) | Assigned Classes & Sections Only |
| **`PARENT`** | Scoped to own Branch | Single Branch (`schoolId`) | Linked Children Profiles, Fee Receipts, Attendance Roster |
| **`STUDENT`** | Scoped to own Branch | Single Branch (`schoolId`) | Own Academic Profile, Homework, Report Card Only |
