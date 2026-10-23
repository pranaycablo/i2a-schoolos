# API AND UI IMPLEMENTATION MATRIX
**i2A SchoolOS | Phase 09: Organization, Branch, Campus & Academic Configuration OS**
**Date:** 2026-10-20  
**Phase:** 09 — Full-Stack Interface & Endpoint Matrix  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Branch:** `phase-a-remediation`  
**Auditor:** Senior Full-Stack Engineer & Product Designer  

---

## 1. Executive Summary

This report maps the end-to-end full-stack integration implemented in Phase 09, linking backend REST endpoints, centralized client SDK methods, and frontend enterprise user interface components.

---

## 2. REST API Endpoint Matrix (`server/routes/hierarchy.js`)

All endpoints are mounted at `/api/hierarchy` in `server/index.js` and protected by `authenticateToken`.

| Endpoint | HTTP Method | Minimum Required Roles | Request Parameters / Body | Response Payload | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/hierarchy/tree` | `GET` | Authenticated | `query: { institutionId? }` | `{ success, institution, organization, activeSession, branches, stats }` | Resolves complete hierarchy tree; applies standalone fallback if no branches exist. |
| `/api/hierarchy/breadcrumbs` | `GET` | Authenticated | `query: { entityType, entityId }` | `{ success, breadcrumbs: [] }` | Resolves upstream breadcrumb trail (Org $\to$ Inst $\to$ Branch $\to$ Campus). |
| `/api/hierarchy/branches` | `GET` | Authenticated | `query: { institutionId?, status?, includeArchived? }` | `{ success, branches: [] }` | Lists branches scoped to caller's role and institution. |
| `/api/hierarchy/branches/:id` | `GET` | Authenticated | `params: { id }` | `{ success, branch }` | Gets single branch details with boundary access check. |
| `/api/hierarchy/branches` | `POST` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN` | `body: { branchCode, name, displayName, isMainBranch, capacity, address, contact }` | `{ success, branch }` | Creates a new branch under the authorized institution; validates code uniqueness. |
| `/api/hierarchy/branches/:id` | `PUT` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN`, `BRANCH_ADMIN` | `body: { name, capacity, address, contact, ... }` | `{ success, branch }` | Updates branch details; Branch Admins restricted from altering school or main status. |
| `/api/hierarchy/branches/:id` | `DELETE` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL` | `params: { id }` | `{ success, branchId, archivedCampusesCount }` | Soft archives branch and cascades `status: 'ARCHIVED'` to child campuses. |
| `/api/hierarchy/campuses` | `GET` | Authenticated | `query: { branchId?, institutionId?, status? }` | `{ success, campuses: [] }` | Lists campuses scoped to caller's branch and institution. |
| `/api/hierarchy/campuses/:id` | `GET` | Authenticated | `params: { id }` | `{ success, campus }` | Gets single campus details with boundary check. |
| `/api/hierarchy/campuses` | `POST` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN`, `BRANCH_ADMIN` | `body: { branchId, campusCode, name, campusType, facilities, capacity }` | `{ success, campus }` | Creates campus under a branch; validates unique code within branch. |
| `/api/hierarchy/campuses/:id` | `PUT` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN`, `BRANCH_ADMIN`, `CAMPUS_ADMIN` | `body: { name, facilities, capacity, ... }` | `{ success, campus }` | Updates campus details; Campus Admins cannot alter parent branch. |
| `/api/hierarchy/campuses/:id` | `DELETE` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN`, `BRANCH_ADMIN` | `params: { id }` | `{ success, campusId }` | Soft archives campus. |
| `/api/hierarchy/academic-sessions` | `GET` | Authenticated | `query: { institutionId? }` | `{ success, sessions: [] }` | Lists academic sessions sorted by startDate descending. |
| `/api/hierarchy/academic-sessions` | `POST` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN` | `body: { sessionName, startDate, endDate, termType, isCurrent }` | `{ success, session }` | Creates new session; enforces startDate < endDate and code uniqueness. |
| `/api/hierarchy/academic-sessions/:id` | `PUT` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN` | `body: { sessionName, startDate, endDate, ... }` | `{ success, session }` | Updates session fields. |
| `/api/hierarchy/academic-sessions/:id/activate` | `POST` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN` | `body: { institutionId }` | `{ success, activatedSession }` | Enforces atomic session switch; concludes existing active sessions. |
| `/api/hierarchy/academic-sessions/:id` | `DELETE` | `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL`, `ADMIN` | `params: { id }` | `{ success, sessionId }` | Soft archives session; strictly blocks archiving the active session. |
| `/api/hierarchy/onboard-application/:appId` | `POST` | `SUPER_ADMIN` | `params: { appId }` | `{ success, defaultBranchCreated, defaultCampusCreated, sessionEnsured }` | Idempotently onboards approved Phase 08 application into hierarchy. |

---

## 3. Centralized Frontend API Client (`src/services/apiClient.ts`)

Exported as `hierarchyApi` matching all backend contracts with TypeScript interfaces:
- `hierarchyApi.getTree(institutionId?)`
- `hierarchyApi.getBreadcrumbs(entityType, entityId)`
- `hierarchyApi.listBranches(params?)`
- `hierarchyApi.getBranch(id)`
- `hierarchyApi.createBranch(data)`
- `hierarchyApi.updateBranch(id, data)`
- `hierarchyApi.archiveBranch(id)`
- `hierarchyApi.listCampuses(params?)`
- `hierarchyApi.getCampus(id)`
- `hierarchyApi.createCampus(data)`
- `hierarchyApi.updateCampus(id, data)`
- `hierarchyApi.archiveCampus(id)`
- `hierarchyApi.listSessions(institutionId?)`
- `hierarchyApi.createSession(data)`
- `hierarchyApi.updateSession(id, data)`
- `hierarchyApi.activateSession(id, institutionId?)`
- `hierarchyApi.archiveSession(id)`
- `hierarchyApi.onboardApplication(appId)`

---

## 4. Frontend UI Module (`src/components/modules/InstitutionalHierarchyModule.tsx`)

### Feature Breakdown:
1. **Interactive KPI Stat Bar:**
   - Operational Branches count
   - Physical Campuses count
   - Total Student Enrollment Capacity
   - Live Academic Term with pulsating green status indicator
2. **Tabbed Navigation:**
   - **Hierarchy Tree & Overview (`TREE`):** Visual hierarchy diagram illustrating Trust $\to$ Institution $\to$ Operating Branches $\to$ Campuses. Features clear Standalone School Zero-Overhead Guarantee alert.
   - **Branches (`BRANCHES`):** Complete branch directory with designations (Headquarters / Regional), student capacities, and archive controls.
   - **Campuses (`CAMPUSES`):** Facility tags, capacity limits, and site categorizations (Main, Satellite, Sports Complex, Hostel, Research).
   - **Academic Sessions (`SESSIONS`):** Term dates, atomic switch activation controls, and date validation.
3. **Modals & User Feedback:**
   - Create Branch Modal (code, name, address, contact, main branch toggle)
   - Create Campus Modal (parent branch selector, facility tags, capacity)
   - Create Academic Session Modal (date pickers, immediate activation option)
   - Toast feedback integrated with `useToast` provider for immediate user feedback.

---

## 5. Navigation & Shell Integration
- **`AppShell.tsx`:** Mounted `institutional_hierarchy` route rendering `<InstitutionalHierarchyModule />`.
- **`ShellSidebar.tsx`:** Added `Hierarchy & Branches` nav item under the `CORE` category, equipped with the `Network` icon and `NEW` badge for `SUPER_ADMIN`, `ADMIN`, and `PRINCIPAL` roles.
