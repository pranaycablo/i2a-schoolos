# 🏫 i2A SchoolOS — Class & Section Master Model
> **Class Ordering, Section Capacity & Room Assignment Specification**

---

## 📌 Model Specification

- **Class Master**: `id`, `tenantId`, `sessionId`, `name`, `numericOrder`, `academicLevel`.
- **Section Master**: `id`, `tenantId`, `classId`, `name`, `capacity`, `currentEnrolled`, `roomNumber`, `classTeacherId`.
- **Section Capacity Enforcement**: Admissions pipeline checks section capacity (`currentEnrolled >= capacity`). Returns `SECTION_FULL` unless overridden by authorized administrator.
