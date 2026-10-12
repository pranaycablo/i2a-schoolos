# 🗄️ i2A SchoolOS — Database Architecture & Entity Relationship Schema
> **PostgreSQL Multi-Tenant Schema Specification**

---

## 📌 1. Primary Relational Schema Design

Every tenant table explicitly enforces tenant isolation through a mandatory `school_id` foreign key.

```sql
-- 1. Multi-Tenant School Master
CREATE TABLE schools (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    stamp_url TEXT,
    principal_signature_url TEXT,
    primary_color VARCHAR(16) DEFAULT '#4F46E5',
    secondary_color VARCHAR(16) DEFAULT '#06B6D4',
    address TEXT,
    phone VARCHAR(32),
    email VARCHAR(128),
    whatsapp_number VARCHAR(32),
    website VARCHAR(128),
    principal_name VARCHAR(128),
    reg_number VARCHAR(64),
    board VARCHAR(32) CHECK (board IN ('CBSE', 'ICSE', 'STATE_BOARD', 'IB')),
    academic_session VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Master
CREATE TABLE students (
    id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    admission_no VARCHAR(32) NOT NULL,
    roll_no VARCHAR(16),
    name VARCHAR(128) NOT NULL,
    photo_url TEXT,
    dob DATE,
    gender VARCHAR(16),
    class_name VARCHAR(32) NOT NULL,
    section VARCHAR(16) NOT NULL,
    father_name VARCHAR(128),
    mother_name VARCHAR(128),
    parent_mobile VARCHAR(32) NOT NULL,
    parent_whatsapp VARCHAR(32),
    parent_email VARCHAR(128),
    address TEXT,
    admission_date DATE,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    attendance_rate NUMERIC(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idx_student_school_adm UNIQUE (school_id, admission_no)
);

-- 3. Fee Receipts Table
CREATE TABLE fee_receipts (
    id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    receipt_no VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id),
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL,
    balance_amount NUMERIC(10,2) DEFAULT 0.00,
    payment_mode VARCHAR(32) CHECK (payment_mode IN ('UPI', 'NET_BANKING', 'CREDIT_CARD', 'CASH', 'CHEQUE')),
    transaction_id VARCHAR(128),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'SUCCESS',
    email_sent BOOLEAN DEFAULT TRUE,
    whatsapp_sent BOOLEAN DEFAULT TRUE,
    CONSTRAINT idx_receipt_school_no UNIQUE (school_id, receipt_no)
);

-- 4. Question Bank Table
CREATE TABLE question_bank (
    id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_name VARCHAR(32) NOT NULL,
    subject VARCHAR(64) NOT NULL,
    chapter_id VARCHAR(64),
    chapter_title VARCHAR(128),
    question_text TEXT NOT NULL,
    type VARCHAR(32) CHECK (type IN ('MCQ', 'TRUE_FALSE', 'FILL_BLANKS', 'SHORT', 'LONG', 'NUMERICAL')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    difficulty VARCHAR(16) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    marks INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Immutable Forensic Audit Log
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    module VARCHAR(64) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📌 2. Indexing Strategy

- `idx_student_school_adm` on `(school_id, admission_no)`
- `idx_receipt_school_no` on `(school_id, receipt_no)`
- `idx_audit_school_time` on `(school_id, created_at DESC)`
