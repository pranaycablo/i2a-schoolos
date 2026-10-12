# 📜 i2A SchoolOS — Architectural Decision Records (ADR)
> **Key Architecture Decisions & Rationales**

---

## 📌 ADR 001: Controlled Approval Architecture for AI & High-Impact Operations
- **Status**: APPROVED
- **Context**: Autonomous AI actions or auto-generated documents could create academic, legal, or financial liability if published without school sign-off.
- **Decision**: All high-impact workflows (AI Question Papers, Online Admissions, Fee Concessions, Exam Results, Payroll) enforce an explicit `Draft -> Review -> Approve -> Publish` state machine.

---

## 📌 ADR 002: Modular Monolith Repository Pattern
- **Status**: APPROVED
- **Context**: Premature microservices add deployment overhead and distributed state complexity for school ERP operations.
- **Decision**: Architect i2A SchoolOS as a clean modular monolith with decoupled domain modules (`school_setup`, `students`, `admissions`, `fees`, `ai_question_bank`, `examination`, `payroll`) isolated by strict interfaces.

---

## 📌 ADR 003: Multi-Tenant Data Isolation Strategy
- **Status**: APPROVED
- **Context**: SaaS multi-tenancy requires strict guarantees that School A data cannot bleed into School B.
- **Decision**: Mandate `school_id` tenant scoping across all database tables, state stores, file keys, and audit log records.
