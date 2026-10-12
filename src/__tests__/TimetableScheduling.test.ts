import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableSchedulingService } from '../services/TimetableSchedulingService';
import { UserSession, TenantSecurityException } from '../services/TenantSecurityService';
import { TimetableCell } from '../types';

describe('i2A SchoolOS — Master Prompt 08 — Timetable & Scheduling Engine Verification', () => {
  let timetableService: TimetableSchedulingService;
  const schoolA = 'sch-001';
  const schoolB = 'sch-002';

  const principalSession: UserSession = {
    id: 'usr-principal',
    email: 'principal@school-a.com',
    tenantId: schoolA,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const schoolBSession: UserSession = {
    id: 'usr-school-b',
    email: 'principal@school-b.com',
    tenantId: schoolB,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  beforeEach(() => {
    timetableService = new TimetableSchedulingService();
  });

  it('1. Tenant Isolation: Rejects access to timetable data of another tenant', () => {
    expect(() => {
      timetableService.getTimetableForClass(schoolA, 'cls-10', 'sec-10-a', schoolBSession);
    }).toThrow(TenantSecurityException);

    expect(() => {
      timetableService.getAllSchoolTimetable(schoolA, schoolBSession);
    }).toThrow(TenantSecurityException);
  });

  it('2. Conflict Detection Engine: Flags Teacher Double Booking', () => {
    const baseCell: TimetableCell = {
      id: 'c1',
      schoolId: schoolA,
      classId: 'cls-10',
      className: 'Class X',
      sectionId: 'sec-a',
      sectionName: 'A',
      day: 'MONDAY',
      periodId: 'p1',
      subjectId: 'sub-math',
      subjectName: 'Maths',
      teacherId: 'emp-001',
      teacherName: 'Rajesh Sharma',
      roomId: 'rm-101'
    };

    const conflictingCell: TimetableCell = {
      id: 'c2',
      schoolId: schoolA,
      classId: 'cls-9',
      className: 'Class IX',
      sectionId: 'sec-b',
      sectionName: 'B',
      day: 'MONDAY',
      periodId: 'p1',
      subjectId: 'sub-math',
      subjectName: 'Maths',
      teacherId: 'emp-001', // SAME TEACHER SAME DAY SAME PERIOD
      teacherName: 'Rajesh Sharma',
      roomId: 'rm-102'
    };

    const conflicts = timetableService.detectConflicts([baseCell], conflictingCell);
    expect(conflicts.some(c => c.type === 'TEACHER_DOUBLE_BOOKING')).toBe(true);

    expect(() => {
      timetableService.saveTimetableCell(conflictingCell, principalSession);
    }).toThrow(/Schedule Conflict Detected/);
  });

  it('3. Conflict Detection Engine: Flags Room Double Booking', () => {
    const baseCell: TimetableCell = {
      id: 'c1',
      schoolId: schoolA,
      classId: 'cls-10',
      className: 'Class X',
      sectionId: 'sec-a',
      sectionName: 'A',
      day: 'MONDAY',
      periodId: 'p1',
      subjectId: 'sub-math',
      subjectName: 'Maths',
      teacherId: 'emp-001',
      teacherName: 'Rajesh Sharma',
      roomId: 'rm-lab1'
    };

    const conflictingCell: TimetableCell = {
      id: 'c3',
      schoolId: schoolA,
      classId: 'cls-11',
      className: 'Class XI',
      sectionId: 'sec-c',
      sectionName: 'C',
      day: 'MONDAY',
      periodId: 'p1',
      subjectId: 'sub-sci',
      subjectName: 'Physics',
      teacherId: 'emp-002',
      teacherName: 'Sunita Verma',
      roomId: 'rm-lab1' // SAME ROOM SAME DAY SAME PERIOD
    };

    const conflicts = timetableService.detectConflicts([baseCell], conflictingCell);
    expect(conflicts.some(c => c.type === 'ROOM_DOUBLE_BOOKING')).toBe(true);
  });

  it('4. Automatic Timetable Generator: Generates conflict-free timetable grid for class', () => {
    const autoGenResult = timetableService.autoGenerateClassTimetable(
      {
        schoolId: schoolA,
        classId: 'cls-8',
        className: 'Class VIII',
        sectionId: 'sec-8-a',
        sectionName: 'A',
        subjectAssignments: [
          { subjectId: 's1', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Teacher A', weeklyQuota: 6 },
          { subjectId: 's2', subjectName: 'Science', teacherId: 't2', teacherName: 'Teacher B', weeklyQuota: 6 },
          { subjectId: 's3', subjectName: 'English', teacherId: 't3', teacherName: 'Teacher C', weeklyQuota: 5 },
          { subjectId: 's4', subjectName: 'Social Studies', teacherId: 't4', teacherName: 'Teacher D', weeklyQuota: 5 }
        ]
      },
      principalSession
    );

    expect(autoGenResult.generatedCells.length).toBe(22);
    expect(autoGenResult.unallocatedPeriods).toBe(20);

    // Verify no double booking within generated cells
    const generated = autoGenResult.generatedCells;
    generated.forEach((cell, idx) => {
      const rest = generated.filter((_, i) => i !== idx);
      const conflicts = timetableService.detectConflicts(rest, cell);
      expect(conflicts.length).toBe(0);
    });
  });

  it('5. Substitution Finder & Creator: Correctly separates available free teachers from busy ones', () => {
    const allStaff = [
      { id: 'emp-001', name: 'Rajesh Sharma', role: 'TEACHER' }, // Busy in seed data MONDAY p1
      { id: 'emp-002', name: 'Sunita Verma', role: 'TEACHER' },  // Busy in seed data MONDAY p2
      { id: 'emp-003', name: 'Anita Gupta', role: 'TEACHER' }   // Free on MONDAY p1
    ];

    const substitutes = timetableService.findAvailableSubstitutes(
      schoolA,
      'MONDAY',
      'p1',
      'emp-001',
      principalSession,
      allStaff
    );

    const anita = substitutes.find(s => s.teacherId === 'emp-003');
    expect(anita).toBeDefined();
    expect(anita?.isFreeThisPeriod).toBe(true);

    // Assign substitution
    const subRecord = timetableService.assignSubstitution(
      {
        schoolId: schoolA,
        date: '2026-10-08',
        day: 'MONDAY',
        periodId: 'p1',
        periodLabel: 'Period 1',
        classId: 'cls-10',
        className: 'Class X',
        sectionId: 'sec-10-a',
        sectionName: 'A',
        subjectName: 'Mathematics',
        originalTeacherId: 'emp-001',
        originalTeacherName: 'Rajesh Sharma',
        substituteTeacherId: 'emp-003',
        substituteTeacherName: 'Anita Gupta',
        reason: 'Medical Sick Leave'
      },
      principalSession
    );

    expect(subRecord.id).toBeDefined();
    expect(subRecord.status).toBe('APPROVED');

    const list = timetableService.getSubstitutions(schoolA, '2026-10-08', principalSession);
    expect(list.length).toBe(1);
    expect(list[0].substituteTeacherName).toBe('Anita Gupta');
  });
});
