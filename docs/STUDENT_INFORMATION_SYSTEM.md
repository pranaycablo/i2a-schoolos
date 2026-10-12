# 👨‍🎓 i2A SchoolOS — Student Information System (SIS) Architecture
> **360° Digital Student Master Profile Specification**

---

## 📌 1. Student Identity Schema

```typescript
export interface StudentMasterProfile {
  id: string;
  tenantId: string;
  admissionNo: string; // Configurable Pattern e.g. ADM-2026-0001
  rollNo: string;
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  photoUrl: string;
  address: { line1: string; city: string; district: string; state: string; pincode: string };
  currentSession: string;
  currentClass: string;
  currentSection: string;
  status: 'APPLICANT' | 'ADMITTED' | 'ACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED' | 'ALUMNI';
  parentId: string;
}
```

- **Unique Identifiers**: System `studentId` (internal UUID) and `admissionNo` (school-configurable format).
