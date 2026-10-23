import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';
import { timetableApi } from './apiClient';
import type {
  DayOfWeek,
  PeriodSlot,
  TimetableCell,
  RoomMaster,
  TeacherWorkload,
  SubstitutionRecord,
  TimetableConflict
} from '../types';

export class TimetableSchedulingService {
  private cells: Map<string, TimetableCell> = new Map();
  private rooms: Map<string, RoomMaster> = new Map();
  private periodSlots: Map<string, PeriodSlot[]> = new Map(); // schoolId -> slots
  private substitutions: Map<string, SubstitutionRecord> = new Map();
  private defaultMaxWeeklyLoad: number = 30;

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const schoolId = 'sch-001';
    
    // Default Periods
    const defaultPeriods: PeriodSlot[] = [
      { id: 'p1', periodNumber: 1, label: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
      { id: 'p2', periodNumber: 2, label: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
      { id: 'p3', periodNumber: 3, label: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
      { id: 'break1', periodNumber: 4, label: 'Recess Break', startTime: '10:15', endTime: '10:30', isBreak: true },
      { id: 'p4', periodNumber: 5, label: 'Period 4', startTime: '10:30', endTime: '11:15', isBreak: false },
      { id: 'p5', periodNumber: 6, label: 'Period 5', startTime: '11:15', endTime: '12:00', isBreak: false },
      { id: 'break2', periodNumber: 7, label: 'Lunch Break', startTime: '12:00', endTime: '12:45', isBreak: true },
      { id: 'p6', periodNumber: 8, label: 'Period 6', startTime: '12:45', endTime: '01:30', isBreak: false },
      { id: 'p7', periodNumber: 9, label: 'Period 7', startTime: '01:30', endTime: '02:15', isBreak: false }
    ];
    this.periodSlots.set(schoolId, defaultPeriods);

    // Default Rooms
    const defaultRooms: RoomMaster[] = [
      { id: 'rm-101', schoolId, roomName: 'Room 101', roomNumber: '101', buildingName: 'Main Block', roomType: 'CLASSROOM', capacity: 40 },
      { id: 'rm-102', schoolId, roomName: 'Room 102', roomNumber: '102', buildingName: 'Main Block', roomType: 'CLASSROOM', capacity: 40 },
      { id: 'rm-lab1', schoolId, roomName: 'Physics Lab', roomNumber: 'L-01', buildingName: 'Science Wing', roomType: 'LAB', capacity: 30 },
      { id: 'rm-lab2', schoolId, roomName: 'Computer Lab', roomNumber: 'L-02', buildingName: 'IT Wing', roomType: 'COMPUTER_LAB', capacity: 35 }
    ];
    defaultRooms.forEach(r => this.rooms.set(r.id, r));

    // Default Seed Timetable Cells for Class X-A
    const seedCells: TimetableCell[] = [
      {
        id: 'cell-001',
        schoolId,
        classId: 'cls-10',
        className: 'Class X',
        sectionId: 'sec-10-a',
        sectionName: 'A',
        day: 'MONDAY',
        periodId: 'p1',
        subjectId: 'sub-math',
        subjectName: 'Mathematics',
        teacherId: 'emp-001',
        teacherName: 'Rajesh Sharma',
        roomId: 'rm-101',
        roomName: 'Room 101'
      },
      {
        id: 'cell-002',
        schoolId,
        classId: 'cls-10',
        className: 'Class X',
        sectionId: 'sec-10-a',
        sectionName: 'A',
        day: 'MONDAY',
        periodId: 'p2',
        subjectId: 'sub-sci',
        subjectName: 'Science',
        teacherId: 'emp-002',
        teacherName: 'Sunita Verma',
        roomId: 'rm-lab1',
        roomName: 'Physics Lab'
      },
      {
        id: 'cell-003',
        schoolId,
        classId: 'cls-10',
        className: 'Class X',
        sectionId: 'sec-10-a',
        sectionName: 'A',
        day: 'TUESDAY',
        periodId: 'p1',
        subjectId: 'sub-eng',
        subjectName: 'English',
        teacherId: 'emp-003',
        teacherName: 'Anita Gupta',
        roomId: 'rm-101',
        roomName: 'Room 101'
      }
    ];
    seedCells.forEach(c => this.cells.set(c.id, c));
  }

  // --- PERIOD & ROOM CONFIG ---

  public getPeriodSlots(schoolId: string, session: UserSession): PeriodSlot[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return this.periodSlots.get(schoolId) || [];
  }

  public getRooms(schoolId: string, session: UserSession): RoomMaster[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.rooms.values()).filter(r => r.schoolId === schoolId);
  }

  public addRoom(roomData: Omit<RoomMaster, 'id'>, session: UserSession): RoomMaster {
    TenantSecurityService.validateTenantAccess(session, roomData.schoolId);
    if (!['SUPER_ADMIN', 'PRINCIPAL'].includes(session.role)) {
      throw new TenantSecurityException('Only Principal or Admin can add rooms.', 403);
    }
    const newRoom: RoomMaster = {
      ...roomData,
      id: `rm-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.rooms.set(newRoom.id, newRoom);
    return newRoom;
  }

  // --- CONFLICT DETECTION ENGINE ---

  public detectConflicts(allCells: TimetableCell[], targetCell: TimetableCell): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    allCells.forEach(c => {
      // Ignore comparing targetCell with itself if updating
      if (c.id === targetCell.id) return;
      if (c.schoolId !== targetCell.schoolId) return;

      // Only evaluate cells occurring at the exact same Day and Period
      if (c.day === targetCell.day && c.periodId === targetCell.periodId) {
        // 1. Teacher Double Booking
        if (c.teacherId === targetCell.teacherId) {
          conflicts.push({
            type: 'TEACHER_DOUBLE_BOOKING',
            message: `Teacher ${targetCell.teacherName} is already assigned to ${c.className}-${c.sectionName} during ${c.day} period ${c.periodId}.`,
            day: targetCell.day,
            periodId: targetCell.periodId,
            affectedEntities: [targetCell.teacherId, c.id, targetCell.id]
          });
        }

        // 2. Room Double Booking
        if (targetCell.roomId && c.roomId === targetCell.roomId) {
          conflicts.push({
            type: 'ROOM_DOUBLE_BOOKING',
            message: `Room ${targetCell.roomName || targetCell.roomId} is already occupied by ${c.className}-${c.sectionName} during ${c.day} period ${c.periodId}.`,
            day: targetCell.day,
            periodId: targetCell.periodId,
            affectedEntities: [targetCell.roomId, c.id, targetCell.id]
          });
        }

        // 3. Class/Section Double Booking
        if (c.classId === targetCell.classId && c.sectionId === targetCell.sectionId) {
          conflicts.push({
            type: 'CLASS_DOUBLE_BOOKING',
            message: `Class ${targetCell.className}-${targetCell.sectionName} already has ${c.subjectName} scheduled during ${c.day} period ${c.periodId}.`,
            day: targetCell.day,
            periodId: targetCell.periodId,
            affectedEntities: [`${c.classId}_${c.sectionId}`, c.id, targetCell.id]
          });
        }
      }
    });

    // 4. Teacher Max Weekly Load Check
    const teacherWeeklyLoad = allCells.filter(
      c => c.schoolId === targetCell.schoolId && c.teacherId === targetCell.teacherId && c.id !== targetCell.id
    ).length + 1;

    if (teacherWeeklyLoad > this.defaultMaxWeeklyLoad) {
      conflicts.push({
        type: 'TEACHER_MAX_LOAD_EXCEEDED',
        message: `Teacher ${targetCell.teacherName} will exceed maximum weekly periods threshold (${this.defaultMaxWeeklyLoad}). Current: ${teacherWeeklyLoad}.`,
        day: targetCell.day,
        periodId: targetCell.periodId,
        affectedEntities: [targetCell.teacherId]
      });
    }

    return conflicts;
  }

  // --- TIMETABLE CRUD & VERIFICATION ---

  public getTimetableForClass(schoolId: string, classId: string, sectionId: string, session: UserSession): TimetableCell[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.cells.values()).filter(
      c => c.schoolId === schoolId && c.classId === classId && c.sectionId === sectionId
    );
  }

  public getTimetableForTeacher(schoolId: string, teacherId: string, session: UserSession): TimetableCell[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.cells.values()).filter(
      c => c.schoolId === schoolId && c.teacherId === teacherId
    );
  }

  public getAllSchoolTimetable(schoolId: string, session: UserSession): TimetableCell[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.cells.values()).filter(c => c.schoolId === schoolId);
  }

  public saveTimetableCell(cell: TimetableCell, session: UserSession, forceOverride = false): { cell: TimetableCell; conflicts: TimetableConflict[] } {
    TenantSecurityService.validateTenantAccess(session, cell.schoolId);

    if (!['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      throw new TenantSecurityException('User does not have permission to modify timetable.', 403);
    }

    const schoolCells = Array.from(this.cells.values()).filter(c => c.schoolId === cell.schoolId);
    const conflicts = this.detectConflicts(schoolCells, cell);

    const hasHardConflict = conflicts.some(c => c.type !== 'TEACHER_MAX_LOAD_EXCEEDED');

    if (hasHardConflict && !forceOverride) {
      throw new Error(`Schedule Conflict Detected: ${conflicts.map(c => c.message).join(' | ')}`);
    }

    if (!cell.id) {
      cell.id = `cell-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    this.cells.set(cell.id, cell);

    // Background sync to MongoDB API
    timetableApi.upsertCell(cell).catch(() => {});

    return { cell, conflicts };
  }

  public async syncFromBackend(schoolId: string, className?: string, sectionName?: string): Promise<TimetableCell[]> {
    try {
      const res = await timetableApi.list({ schoolId, className, sectionName });
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        const fetched = res.data as TimetableCell[];
        fetched.forEach((c) => this.cells.set(c.id, c));
        return fetched;
      }
    } catch {
      // Fallback
    }
    return Array.from(this.cells.values()).filter((c) => c.schoolId === schoolId);
  }

  public deleteTimetableCell(cellId: string, schoolId: string, session: UserSession): boolean {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    const existing = this.cells.get(cellId);
    if (!existing || existing.schoolId !== schoolId) return false;
    return this.cells.delete(cellId);
  }

  // --- AUTOMATIC TIMETABLE GENERATOR ENGINE ---

  public autoGenerateClassTimetable(
    params: {
      schoolId: string;
      classId: string;
      className: string;
      sectionId: string;
      sectionName: string;
      subjectAssignments: Array<{
        subjectId: string;
        subjectName: string;
        teacherId: string;
        teacherName: string;
        weeklyQuota: number;
        roomId?: string;
        roomName?: string;
      }>;
    },
    session: UserSession
  ): { generatedCells: TimetableCell[]; unallocatedPeriods: number } {
    TenantSecurityService.validateTenantAccess(session, params.schoolId);

    const periods = (this.periodSlots.get(params.schoolId) || []).filter(p => !p.isBreak);
    const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
    // Get all existing cells across school to prevent teacher/room double booking
    const existingSchoolCells = Array.from(this.cells.values()).filter(
      c => c.schoolId === params.schoolId && !(c.classId === params.classId && c.sectionId === params.sectionId)
    );

    const generatedCells: TimetableCell[] = [];
    
    // Prepare quota trackers
    const subjectQuotas = params.subjectAssignments.map(s => ({
      ...s,
      remaining: s.weeklyQuota
    }));

    let unallocatedPeriods = 0;

    for (const day of days) {
      // Track subject scheduled today to prevent >2 periods of same subject per day
      const dailySubjectCount: Record<string, number> = {};

      for (const period of periods) {
        // Find suitable subject
        const candidateIndex = subjectQuotas.findIndex(sub => {
          if (sub.remaining <= 0) return false;
          if ((dailySubjectCount[sub.subjectId] || 0) >= 2) return false;

          // Test target cell for conflicts against external school timetable
          const testCell: TimetableCell = {
            id: 'temp-test',
            schoolId: params.schoolId,
            classId: params.classId,
            className: params.className,
            sectionId: params.sectionId,
            sectionName: params.sectionName,
            day,
            periodId: period.id,
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            teacherId: sub.teacherId,
            teacherName: sub.teacherName,
            roomId: sub.roomId,
            roomName: sub.roomName
          };

          const conflicts = this.detectConflicts([...existingSchoolCells, ...generatedCells], testCell);
          return conflicts.length === 0;
        });

        if (candidateIndex >= 0) {
          const sub = subjectQuotas[candidateIndex];
          const newCell: TimetableCell = {
            id: `gen-${params.classId}-${day}-${period.id}`,
            schoolId: params.schoolId,
            classId: params.classId,
            className: params.className,
            sectionId: params.sectionId,
            sectionName: params.sectionName,
            day,
            periodId: period.id,
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            teacherId: sub.teacherId,
            teacherName: sub.teacherName,
            roomId: sub.roomId,
            roomName: sub.roomName
          };

          generatedCells.push(newCell);
          sub.remaining -= 1;
          dailySubjectCount[sub.subjectId] = (dailySubjectCount[sub.subjectId] || 0) + 1;
        } else {
          unallocatedPeriods++;
        }
      }
    }

    return { generatedCells, unallocatedPeriods };
  }

  // --- TEACHER WORKLOAD ANALYSIS ---

  public getTeacherWorkloadSummary(schoolId: string, session: UserSession): TeacherWorkload[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    
    const schoolCells = Array.from(this.cells.values()).filter(c => c.schoolId === schoolId);
    const teacherMap = new Map<string, TeacherWorkload>();

    schoolCells.forEach(cell => {
      if (!teacherMap.has(cell.teacherId)) {
        teacherMap.set(cell.teacherId, {
          teacherId: cell.teacherId,
          teacherName: cell.teacherName,
          maxWeeklyPeriods: this.defaultMaxWeeklyLoad,
          assignedWeeklyPeriods: 0,
          dailyLoad: { MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0, SATURDAY: 0 }
        });
      }

      const tw = teacherMap.get(cell.teacherId)!;
      tw.assignedWeeklyPeriods += 1;
      if (tw.dailyLoad[cell.day] !== undefined) {
        tw.dailyLoad[cell.day] += 1;
      }
    });

    return Array.from(teacherMap.values());
  }

  // --- SUBSTITUTION MANAGEMENT ENGINE ---

  public findAvailableSubstitutes(
    schoolId: string,
    day: DayOfWeek,
    periodId: string,
    absentTeacherId: string,
    session: UserSession,
    allStaffList: Array<{ id: string; name: string; role: string; assignedSubjects?: string[] }>
  ): Array<{ teacherId: string; teacherName: string; currentWeeklyLoad: number; isFreeThisPeriod: boolean }> {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const periodCells = Array.from(this.cells.values()).filter(
      c => c.schoolId === schoolId && c.day === day && c.periodId === periodId
    );
    const busyTeacherIds = new Set(periodCells.map(c => c.teacherId));

    const teachers = allStaffList.filter(s => s.role === 'TEACHER' && s.id !== absentTeacherId);
    const workloads = this.getTeacherWorkloadSummary(schoolId, session);
    const loadMap = new Map(workloads.map(w => [w.teacherId, w.assignedWeeklyPeriods]));

    return teachers.map(t => ({
      teacherId: t.id,
      teacherName: t.name,
      currentWeeklyLoad: loadMap.get(t.id) || 0,
      isFreeThisPeriod: !busyTeacherIds.has(t.id)
    })).sort((a, b) => (b.isFreeThisPeriod ? 1 : 0) - (a.isFreeThisPeriod ? 1 : 0) || a.currentWeeklyLoad - b.currentWeeklyLoad);
  }

  public assignSubstitution(
    subData: Omit<SubstitutionRecord, 'id' | 'status'>,
    session: UserSession
  ): SubstitutionRecord {
    TenantSecurityService.validateTenantAccess(session, subData.schoolId);

    if (!['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      throw new TenantSecurityException('Only authorized staff can assign substitutions.', 403);
    }

    const newSub: SubstitutionRecord = {
      ...subData,
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'APPROVED'
    };

    this.substitutions.set(newSub.id, newSub);
    return newSub;
  }

  public getSubstitutions(schoolId: string, date: string, session: UserSession): SubstitutionRecord[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.substitutions.values()).filter(
      s => s.schoolId === schoolId && s.date === date
    );
  }
}
