# 🔐 i2A SchoolOS — Role-Based Access Control (RBAC) Permission Matrix
> **Centralized Granular Permission Matrix Specification**

---

## 📌 Role Permissions Mapping

| Module / Action | Super Admin | Principal | Accountant | Teacher | Parent | Student |
|---|---|---|---|---|---|---|
| `school_setup.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `school_setup.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `students.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `students.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admissions.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `fees.collect` | ✅ | ✅ | ✅ | ❌ | ✅ (Own) | ❌ |
| `fees.structure_create`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `ai_test.generate` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `ai_test.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `exams.online_take` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `exams.grade_subjective`| ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `payroll.disburse` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `audit.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `ai_assistant.query` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
