import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';
import { type SectionMaster, AcademicMasterService } from './AcademicMasterService';

export interface AdmissionEnquiry {
  id: string;
  tenantId: string;
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  desiredClass: string;
  academicSession: string;
  source: 'WEBSITE' | 'WALK_IN' | 'PHONE' | 'REFERRAL' | 'WHATSAPP';
  status: 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'APPLIED' | 'ADMITTED' | 'CLOSED';
  followUpDate?: string;
  remarks?: string;
}

export interface StudentMasterProfile {
  id: string;
  tenantId: string;
  admissionNo: string;
  rollNo: string;
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  photoUrl: string;
  bloodGroup?: string;
  email: string;
  mobile: string;
  address: {
    line1: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  currentSession: string;
  currentClass: string;
  currentSection: string;
  house?: string;
  admissionDate: string;
  status: 'APPLICANT' | 'ADMITTED' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED' | 'ALUMNI';
  parentId: string;
  parentName: string;
  parentPhone: string;
}

export interface ParentProfile {
  id: string;
  tenantId: string;
  name: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  phone: string;
  whatsapp: string;
  email: string;
  occupation: string;
  childrenIds: string[];
}

export class StudentAdmissionService {
  /**
   * Generates custom formatted admission number based on school pattern.
   * e.g. "ADM-2026-0001", "2026-001", "ABC/26/001"
   */
  public static generateAdmissionNumber(pattern: string, sequence: number, year: string = '2026'): string {
    const paddedSeq = String(sequence).padStart(4, '0');
    return pattern
      .replace('{YEAR}', year)
      .replace('{SEQ}', paddedSeq);
  }

  /**
   * Duplicate Protection Checker
   */
  public static checkDuplicateStudent(
    students: StudentMasterProfile[],
    admissionNo: string,
    email: string,
    mobile: string
  ): { isDuplicate: boolean; reason?: string } {
    const existing = students.find(
      (s) => s.admissionNo === admissionNo || (email && s.email === email) || (mobile && s.mobile === mobile)
    );
    if (existing) {
      return { isDuplicate: true, reason: `Possible duplicate student found: ${existing.fullName} (Adm #${existing.admissionNo})` };
    }
    return { isDuplicate: false };
  }

  /**
   * Transactional Admission Confirmation & Enrollment Execution
   */
  public static confirmAdmissionAndEnroll(
    user: UserSession,
    tenantId: string,
    applicationData: { studentName: string; applyingClass: string; parentName: string; phone: string; email: string },
    targetSection: SectionMaster,
    existingStudents: StudentMasterProfile[],
    pattern: string = 'ADM-{YEAR}-{SEQ}'
  ): { student: StudentMasterProfile; parent: ParentProfile } {
    // 1. Validate Tenant Access
    TenantSecurityService.validateTenantAccess(user, tenantId);

    // 2. Check Section Capacity
    const capCheck = AcademicMasterService.checkSectionCapacity(targetSection);
    if (!capCheck.canEnroll) {
      throw new TenantSecurityException(`DENIED: Section ${targetSection.className}-${targetSection.name} is SECTION_FULL. Enrollment rejected.`, 400);
    }

    // 3. Generate Unique Admission Number
    const seq = existingStudents.length + 1;
    const admissionNo = this.generateAdmissionNumber(pattern, seq);

    // 4. Duplicate Protection
    const dupCheck = this.checkDuplicateStudent(existingStudents, admissionNo, applicationData.email, applicationData.phone);
    if (dupCheck.isDuplicate) {
      throw new TenantSecurityException(`DENIED: ${dupCheck.reason}`, 400);
    }

    // 5. Create Parent Profile
    const parentId = `prt-${Date.now()}`;
    const studentId = `std-${Date.now()}`;

    const newParent: ParentProfile = {
      id: parentId,
      tenantId,
      name: applicationData.parentName,
      relationship: 'FATHER',
      phone: applicationData.phone,
      whatsapp: applicationData.phone,
      email: applicationData.email,
      occupation: 'Business / Service',
      childrenIds: [studentId]
    };

    // 6. Create Student Profile
    const newStudent: StudentMasterProfile = {
      id: studentId,
      tenantId,
      admissionNo,
      rollNo: String(targetSection.currentEnrolled + 1),
      fullName: applicationData.studentName,
      dob: '2012-05-15',
      gender: 'MALE',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      email: applicationData.email,
      mobile: applicationData.phone,
      address: {
        line1: 'Baily Road',
        city: 'Patna',
        district: 'Patna',
        state: 'Bihar',
        pincode: '800001'
      },
      currentSession: '2026-2027',
      currentClass: applicationData.applyingClass,
      currentSection: targetSection.name,
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      parentId,
      parentName: applicationData.parentName,
      parentPhone: applicationData.phone
    };

    return { student: newStudent, parent: newParent };
  }
}
