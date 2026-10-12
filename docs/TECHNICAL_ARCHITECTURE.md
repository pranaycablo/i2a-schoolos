# 🏗️ i2A SchoolOS — Technical Architecture & System Infrastructure
> **Multi-Tenant Cloud SaaS Infrastructure Specification**

---

## 💻 1. Core Technical Stack

- **Frontend Framework**: Vite + React 19 + TypeScript 6.0
- **Styling & Design System**: Tailwind CSS v4 + Custom Glassmorphic Tokens + Inter / Outfit Fonts
- **Icons & Data Visualization**: Lucide React + Recharts
- **Document & PDF Generation Engine**: jsPDF + html2canvas + HTML Canvas Renderer
- **State Management & Persistence**: React Context API + LocalStorage Persistent Multi-Tenant Provider (with automatic fallback seed data engine)
- **Automated Testing Suite**: Vitest + Testing Library

---

## 🏛️ 2. High-Level Modular Monolith Architecture

```
                       ┌─────────────────────────────────────────┐
                       │        Client Application (Vite/React)  │
                       └────────────────────┬────────────────────┘
                                            │
                       ┌────────────────────▼────────────────────┐
                       │       Multi-Tenant Context & RBAC       │
                       └────────────────────┬────────────────────┘
                                            │
     ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
     │                  │                   │                   │                  │
┌────▼─────┐      ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐     ┌─────▼──────┐
│  School  │      │  Student & │      │   Fee &    │      │ AI Book &  │     │ Exam & Auto│
│  Setup   │      │ Admissions │      │ Accounting │      │  Question  │     │ Evaluation │
└──────────┘      └────────────┘      └────────────┘      └────────────┘     └────────────┘
```

---

## 🔁 3. Multi-Tenant Data Flow & Isolation Guarantee

Every data request and state update passes through the tenant layer:

```typescript
export interface TenantContext {
  schoolId: string;
  tenantName: string;
  subdomain: string;
  branding: SchoolBranding;
  userRole: UserRole;
  permissions: string[];
}
```

1. Data belonging to `schoolId: sch-001` cannot be accessed or mutated by another tenant session.
2. LocalStorage keys are segmented per tenant (`i2a_sch-001_students`, `i2a_sch-001_receipts`).
3. Audit log records retain immutable tenant context (`schoolId`, `userId`, `role`, `timestamp`, `ipAddress`).
