import { describe, it, expect, beforeEach } from 'vitest';
import { AuxiliaryOperationsService } from '../services/AuxiliaryOperationsService';
import type { UserSession } from '../services/TenantSecurityService';

describe('FOV-06R: Auxiliary Operations Real Workflow Verifications', () => {
  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';

  const teacherSession: UserSession = {
    id: 'emp-001',
    email: 'rajesh.sharma@school.com',
    tenantId: schoolA,
    role: 'TEACHER',
    status: 'ACTIVE'
  };

  const adminSession: UserSession = {
    id: 'admin-01',
    email: 'principal@school.com',
    tenantId: schoolA,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const rogueSessionSchoolB: UserSession = {
    id: 'hacker-01',
    email: 'rogue@schoolb.com',
    tenantId: schoolB,
    role: 'ADMIN',
    status: 'ACTIVE'
  };

  let service: AuxiliaryOperationsService;

  beforeEach(() => {
    service = AuxiliaryOperationsService.getInstance();
  });

  describe('1. Teacher Classroom Session Delivery Workflow', () => {
    it('successfully starts a class session and sets status to IN_PROGRESS', () => {
      const session = service.startClassSession(
        {
          schoolId: schoolA,
          teacherId: 'emp-001',
          teacherName: 'Rajesh Sharma',
          classId: 'cls-10',
          className: 'Class X',
          sectionName: 'A',
          subjectName: 'Mathematics',
          periodId: 'p1',
          periodLabel: 'Period 1 (08:00 - 08:45 AM)',
          roomName: 'Room 101',
          date: '2026-10-11',
          totalStudentsCount: 35
        },
        teacherSession
      );

      expect(session).toBeDefined();
      expect(session.status).toBe('IN_PROGRESS');
      expect(session.subjectName).toBe('Mathematics');
      expect(session.teacherName).toBe('Rajesh Sharma');
    });

    it('records lesson, notes, attendance and marks class as COMPLETED', () => {
      const started = service.startClassSession(
        {
          schoolId: schoolA,
          teacherId: 'emp-001',
          teacherName: 'Rajesh Sharma',
          classId: 'cls-10',
          className: 'Class X',
          sectionName: 'A',
          subjectName: 'Mathematics',
          periodId: 'p1',
          periodLabel: 'Period 1 (08:00 - 08:45 AM)',
          roomName: 'Room 101',
          date: '2026-10-11',
          totalStudentsCount: 35
        },
        teacherSession
      );

      const completed = service.completeClassSession(
        started.id,
        {
          chapterTitle: 'Chapter 4: Linear Equations in Two Variables',
          lessonTaught: 'Solved elimination method and graphed equations.',
          completionNotes: 'Students solved textbook examples 4.1 to 4.3.',
          homeworkAssigned: 'Exercise 4.2 Questions 1 through 8.',
          presentCount: 34
        },
        teacherSession
      );

      expect(completed.status).toBe('COMPLETED');
      expect(completed.chapterTitle).toBe('Chapter 4: Linear Equations in Two Variables');
      expect(completed.presentCount).toBe(34);
      expect(completed.attendanceMarked).toBe(true);

      // Verify retrieval from persisted store
      const allSessions = service.getClassroomSessions(schoolA, 'emp-001', '2026-10-11');
      expect(allSessions.length).toBeGreaterThanOrEqual(1);
      expect(allSessions.find((s) => s.id === started.id)?.status).toBe('COMPLETED');
    });

    it('blocks cross-tenant access to classroom sessions', () => {
      expect(() => {
        service.completeClassSession(
          'cls-sess-2026-10-11-p1-emp-001',
          {
            chapterTitle: 'Rogue Edit',
            lessonTaught: 'Hacked',
            completionNotes: 'Unauthorized',
            presentCount: 0
          },
          rogueSessionSchoolB
        );
      }).toThrow(/Cross-tenant access violation/);
    });
  });

  describe('2. Physical Library Circulation & Duplicate Prevention', () => {
    it('issues an available physical book copy to an authorized student', () => {
      const tx = service.issueBookCopy(
        schoolA,
        'LIB-901-C01',
        {
          id: 'std-101',
          name: 'Aarav Sharma',
          type: 'STUDENT'
        },
        '2026-10-25',
        adminSession
      );

      expect(tx).toBeDefined();
      expect(tx.status).toBe('ACTIVE');
      expect(tx.copyId).toBe('LIB-901-C01');
      expect(tx.memberName).toBe('Aarav Sharma');
    });

    it('STRICT PREVENT: throws error when attempting to issue an already issued copy', () => {
      expect(() => {
        service.issueBookCopy(
          schoolA,
          'LIB-901-C01', // Already issued in previous test!
          {
            id: 'std-103',
            name: 'Rohan Gupta',
            type: 'STUDENT'
          },
          '2026-10-30',
          adminSession
        );
      }).toThrow(/DUPLICATE_ISSUE_PREVENTED/);
    });

    it('successfully returns a copy, sets status back to AVAILABLE, and records transaction', () => {
      const retTx = service.returnBookCopy(schoolA, 'LIB-901-C01', adminSession);
      expect(retTx.status).toBe('RETURNED');

      // Now copy LIB-901-C01 should be AVAILABLE again
      const books = service.getBookMasters(schoolA);
      const physicsBook = books.find((b) => b.code === 'LIB-901');
      const copy = physicsBook?.copies.find((c) => c.id === 'LIB-901-C01');
      expect(copy?.status).toBe('AVAILABLE');
    });
  });

  describe('3. Transport Fleet, Capacity Limit & Data Isolation', () => {
    it('successfully assigns an authorized student to a route with seat reservation', () => {
      const assignment = service.assignStudentToRoute(
        schoolA,
        'route-02',
        {
          id: 'std-201',
          name: 'Pooja Verma',
          className: 'Class IX',
          section: 'Section B',
          parentPhone: '9811223344'
        },
        'Boring Canal Road',
        adminSession
      );

      expect(assignment).toBeDefined();
      expect(assignment.routeNumber).toBe('Route 02');
      expect(assignment.studentName).toBe('Pooja Verma');
      expect(assignment.status).toBe('ACTIVE');
    });

    it('STRICT PREVENT: throws error when student is already assigned to a route', () => {
      expect(() => {
        service.assignStudentToRoute(
          schoolA,
          'route-01',
          {
            id: 'std-201', // Already assigned in previous test!
            name: 'Pooja Verma',
            className: 'Class IX',
            section: 'Section B',
            parentPhone: '9811223344'
          },
          'Kankarbagh Colony Mor',
          adminSession
        );
      }).toThrow(/DUPLICATE_ASSIGNMENT/);
    });

    it('STRICT CAPACITY: blocks assignment when vehicle reaches max capacity', () => {
      // Find route-02 and temporarily simulate capacity reached
      const routes = service.getTransportRoutes();
      const r2 = routes.find((r) => r.id === 'route-02');
      if (r2) {
        r2.assignedStudentsCount = r2.capacity; // Maxed out!
      }

      expect(() => {
        service.assignStudentToRoute(
          schoolA,
          'route-02',
          {
            id: 'std-999',
            name: 'Extra Passenger',
            className: 'Class VII',
            section: 'A',
            parentPhone: '9988776655'
          },
          'Bailey Road Pillar 45',
          adminSession
        );
      }).toThrow(/CAPACITY_EXCEEDED/);

      // Restore
      if (r2) {
        r2.assignedStudentsCount = 1;
      }
    });

    it('Parent Data Isolation: Parent only receives their own child route details', () => {
      const parentView = service.getParentTransportView(schoolA, '9811223344', adminSession);
      expect(parentView.length).toBe(1);
      expect(parentView[0].studentName).toBe('Pooja Verma');

      // Parent with unknown phone gets empty list (no data leak)
      const strangerView = service.getParentTransportView(schoolA, '9999999999', adminSession);
      expect(strangerView.length).toBe(0);
    });

    it('blocks unauthorized cross-tenant queries for transport data', () => {
      expect(() => {
        service.getParentTransportView(schoolA, '9811223344', rogueSessionSchoolB);
      }).toThrow(/Cross-tenant access violation/);
    });
  });
});
