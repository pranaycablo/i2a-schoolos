# i2A SchoolOS — Attendance Module Architecture & Specifications

## 1. Overview
The Attendance Engine in i2A SchoolOS provides server-authoritative, multi-tenant daily and period-wise attendance tracking for students, teachers, and non-teaching workforce.

## 2. Status Engine & Policies
Configurable status codes:
- `PRESENT` (weight: 1.0)
- `ABSENT` (weight: 0.0)
- `LATE` (weight: 1.0 or configurable)
- `EXCUSED` (weight: 1.0)
- `LEAVE` (weight: 0.0, excluded or included in working day denominator)
- `HALF_DAY` (weight: 0.5)

## 3. Scope Hierarchy
```text
School → Academic Session → Campus → Class → Section → Date → Student
```

## 4. Attendance Locking & Corrections
- Sessions automatically or manually change from `SUBMITTED` to `LOCKED`.
- Locked attendance requires formal `AttendanceCorrection` request with `reason` and authorized approval by `PRINCIPAL` or `ADMIN`.

## 5. Calculation Formula
```text
Attendance % = ((Present + Late + HalfDay * 0.5) / TotalWorkingDays) * 100
```
- Alert Thresholds:
  - Critical Alert: < 75%
  - Warning Alert: < 80%
  - Info Alert: < 85%
