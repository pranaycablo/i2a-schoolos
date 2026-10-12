# 👨‍👩‍👧 i2A SchoolOS — Parent & Guardian Relationship Model
> **Multi-Children Linkage & Object-Level Authorization Specification**

---

## 📌 Relational Model

- **Parent Entity**: `id`, `name`, `relationship`, `phone`, `email`, `childrenIds: string[]`.
- **Multi-Children Support**: Single parent login can switch context between Child A, Child B, Child C.
- **Server Authorization**: Server validates `childrenIds.includes(targetStudentId)` on all profile and fee requests.
