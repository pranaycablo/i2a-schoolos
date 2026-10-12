# i2A SchoolOS — Leave Management Engine

## 1. Overview
The Leave Management Engine supports student and staff leave application, multi-level hierarchy approval, and automatic attendance synchronization.

## 2. Student Leave Workflow
```text
Parent/Guardian applies leave
        ↓
Class Teacher / Principal reviews
        ↓
Upon Approval:
Attendance status automatically updated to 'LEAVE' for all dates in [startDate, endDate]
```

## 3. Staff Leave Workflow
```text
Teacher / Staff applies leave
        ↓
Department Head / Principal reviews
        ↓
Upon Approval:
Staff presence status updated to 'LEAVE'
Payroll working day calculations adjusted accordingly
```
