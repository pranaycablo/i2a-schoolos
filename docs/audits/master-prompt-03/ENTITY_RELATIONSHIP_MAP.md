# i2A SchoolOS — Master Prompt 03: Entity Relationship Map
**Document ID:** `DOC-MP03-ERD-MAP-004`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Architect:** Database Architect, Data Modeling Lead  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Global Multi-Tenant Entity Relationship Diagram

The following Mermaid diagram maps the complete relational architecture of i2A SchoolOS across governance, academic structures, student identity, and access control.

```mermaid
erDiagram
    ORGANIZATION ||--o{ BRANCH_CAMPUS : "governs and owns"
    ORGANIZATION ||--o{ ADMINISTRATIVE_UNIT : "structures jurisdictions"
    ADMINISTRATIVE_UNIT ||--o{ BRANCH_CAMPUS : "jurisdiction covers"

    BRANCH_CAMPUS ||--o{ ACADEMIC_SESSION : "operates"
    BRANCH_CAMPUS ||--o{ PROGRAM_COURSE : "offers"
    BRANCH_CAMPUS ||--o{ USER_ACCOUNT : "employs or enrolls"
    BRANCH_CAMPUS ||--o{ STUDENT_ENTITY : "holds admission records"
    BRANCH_CAMPUS ||--o{ FEE_TYPE : "configures"

    PROGRAM_COURSE ||--o{ CLASS_GRADE : "subdivides"
    CLASS_GRADE ||--o{ SECTION_BATCH : "splits into cohorts"

    ACADEMIC_SESSION ||--o{ STUDENT_ENROLLMENT : "schedules"
    SECTION_BATCH ||--o{ STUDENT_ENROLLMENT : "contains roster"
    STUDENT_ENTITY ||--o{ STUDENT_ENROLLMENT : "historical progression"

    STUDENT_ENTITY ||--o{ GUARDIAN_RELATIONSHIP : "linked to"
    USER_ACCOUNT ||--o{ GUARDIAN_RELATIONSHIP : "parent of"

    USER_ACCOUNT ||--o{ TEACHER_ASSIGNMENT : "assigned to"
    SECTION_BATCH ||--o{ TEACHER_ASSIGNMENT : "taught by"

    STUDENT_ENTITY ||--o{ FEE_RECEIPT : "billed to"
    FEE_TYPE ||--o{ FEE_RECEIPT : "itemized in"

    ORGANIZATION {
        string id PK "org-xxx"
        string orgCode UK "DPS-SYNTH"
        string legalName
        string orgType "PRIVATE_TRUST | GOVT_DEPARTMENT"
        string parentOrgId FK "Nullable"
        string status "ACTIVE | SUSPENDED"
    }

    BRANCH_CAMPUS {
        string id PK "I2A-SCH-XXXXXX"
        string orgId FK "Nullable"
        string code "ABC-SYNTH"
        string name "ABC Public School"
        string board "CBSE | ICSE | STATE_BOARD"
        string udiseCode "11 Digits Nullable"
        string planId "PROFESSIONAL"
        string status "ACTIVE | TRIAL"
    }

    ACADEMIC_SESSION {
        string id PK "sess-xxx"
        string schoolId FK
        string sessionName "2026-2027"
        date startDate
        date endDate
        boolean isCurrent "Single Active Session Rule"
        string status "ACTIVE | COMPLETED"
    }

    CLASS_GRADE {
        string id PK "cls-xxx"
        string schoolId FK
        string name "Class VIII"
        int numericOrder "-2..14"
        string status "ACTIVE"
    }

    SECTION_BATCH {
        string id PK "sec-xxx"
        string schoolId FK
        string classId FK
        string name "Section A"
        int capacity "40"
        int currentEnrolled "2"
        string classTeacherId FK
    }

    STUDENT_ENTITY {
        string id PK "std-xxx"
        string schoolId FK
        string admissionNo "1024"
        string name
        date dob
        string gender "MALE | FEMALE"
        string status "ACTIVE | GRADUATED"
    }

    STUDENT_ENROLLMENT {
        string id PK "enr-xxx"
        string schoolId FK
        string studentId FK
        string academicSessionId FK
        string classId FK
        string sectionId FK
        string rollNumber "01"
        string status "ENROLLED | PROMOTED"
    }

    GUARDIAN_RELATIONSHIP {
        string id PK "rel-xxx"
        string schoolId FK
        string studentId FK
        string guardianUserId FK
        string relationshipType "FATHER | MOTHER"
        boolean isPrimaryContact
        boolean canPickup
        boolean hasFinancialResponsibility
    }

    USER_ACCOUNT {
        string id PK "usr-xxx"
        string schoolId FK
        string orgId FK "Nullable"
        string email UK
        string role "PRINCIPAL | TEACHER | PARENT"
        string status "ACTIVE | SUSPENDED"
    }
```

---

## 2. Cardinality & Relational Invariants

| Parent Entity | Child Entity | Cardinality | Deletion Rule | Enforced Boundary |
| :--- | :--- | :--- | :--- | :--- |
| `ORGANIZATION` | `BRANCH_CAMPUS` | `1 : N` | `RESTRICT` | Cannot delete Organization while branches exist. |
| `BRANCH_CAMPUS` | `ACADEMIC_SESSION` | `1 : N` | `RESTRICT` | Cannot delete branch while sessions exist. |
| `ACADEMIC_SESSION` | `STUDENT_ENROLLMENT`| `1 : N` | `RESTRICT` | Sessions containing enrollments cannot be deleted. |
| `CLASS_GRADE` | `SECTION_BATCH` | `1 : N` | `RESTRICT` | Cannot drop class containing active sections. |
| `STUDENT_ENTITY` | `STUDENT_ENROLLMENT`| `1 : N` | `RESTRICT` | Student identity preserved across historical sessions. |
| `STUDENT_ENTITY` | `GUARDIAN_RELATIONSHIP`| `M : N` | `CASCADE` | Removing student removes guardian links. |
| `USER_ACCOUNT` | `GUARDIAN_RELATIONSHIP`| `M : N` | `CASCADE` | Removing parent user cleans up relationship links. |
| `SECTION_BATCH` | `STUDENT_ENROLLMENT`| `1 : N` | `RESTRICT` | Section capacity enforced; cannot exceed max capacity. |

---

## 3. Cross-Tenant Integrity Validation Rules

In accordance with strict multi-tenant isolation:
1. **Foreign Key Alignment:** A `STUDENT_ENROLLMENT` document must satisfy:
   $$\text{student.schoolId} = \text{session.schoolId} = \text{class.schoolId} = \text{section.schoolId} = \text{enrollment.schoolId}$$
2. If any foreign entity belongs to a different school or tenant, the transaction is rejected with `CROSS_TENANT_VIOLATION`.
3. **Primary Contact Rule:** For any student, exactly one guardian link in `guardian_relationships` can have `isPrimaryContact: true`. When a new primary contact is designated, previous primary flags are automatically updated to `false`.
