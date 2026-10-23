# 🔐 i2A SchoolOS — Role-Based Access Control (RBAC) Permission Matrix
> **Centralized Granular Permission Matrix Specification**

---

## 📌 Role Permissions Mapping

For the full 15-role enterprise specification, see [docs/strategy/ROLE_PERMISSION_MATRIX.md](file:///D:/i2A_School%20ERP%20&%20Managment/docs/strategy/ROLE_PERMISSION_MATRIX.md).

| Module / Action | Super Admin | Principal | Accountant | Teacher | Parent | Student | Transport / Lib | Staff |
|---|---|---|---|---|---|---|---|---|
| `school_setup.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `school_setup.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `students.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (Basic) | ✅ (Basic) |
| `students.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `admissions.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `fees.collect` | ✅ | ✅ | ✅ | ❌ | ✅ (Own) | ❌ | ❌ | ❌ |
| `fees.structure_create`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ai_test.generate` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `ai_test.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `exams.online_take` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `exams.grade_subjective`| ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `payroll.disburse` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ai_assistant.query` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

