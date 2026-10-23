/**
 * i2A SchoolOS — Institution Hierarchy & Academic Configuration OS Service
 * Master Prompt 09: Organization, Branch, Campus & Academic Configuration OS
 *
 * Core capabilities:
 * - Multi-tier Institutional Hierarchy Engine:
 *   Platform -> Trust/Group -> (Optional Region) -> Institution -> Branch -> Campus -> Academic Session -> Program/Class -> Section/Batch
 * - Zero-Overhead Standalone School support (automatic single-tier fallback)
 * - Strict Cross-Tenant and Role-Boundary Isolation
 * - Single Active Academic Session Invariant (Atomic session switcher)
 * - Non-Destructive Soft Archival Cascading
 * - Idempotent Approved Institution Onboarding Bridge
 * - Structured Forensic Audit Logging
 */

import { recordAuditEvent } from './auditService.js';
import { calculateAcademicSessionPolicy } from './academicCalendarService.js';
import { validateBranchCampus, validateAcademicSession, validateClassGrade, validateSectionBatch } from './domainValidation.js';
import { detectHierarchyCycle, acquireHierarchyLock, releaseHierarchyLock } from './hierarchyService.js';

// ============================================================================
// AUTHORIZATION & TENANT SCOPING HELPERS
// ============================================================================

/**
 * Validates whether the caller has authority over the given organization/institution/branch/campus
 */
export async function assertHierarchyAccess({
  user,
  institutionId,
  orgId,
  branchId,
  campusId,
  requiredMinRole = 'CAMPUS_ADMIN',
  db
}) {
  if (!user) {
    const err = new Error('UNAUTHORIZED: Authentication is required.');
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    throw err;
  }

  // Super Admin has global authority across all tenants and hierarchies
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  const userRole = user.role;
  const userOrgId = user.orgId;
  const userSchoolId = user.schoolId || user.tenantId;
  const userBranchId = user.branchId;
  const userCampusId = user.campusId;

  // 1. If institutionId is provided, check if it matches caller's school or organization
  if (institutionId) {
    if (userSchoolId && userSchoolId === institutionId) {
      // Direct institution match (Principal / Admin / Staff / Student)
      if (requiredMinRole === 'ORG_DIRECTOR' && userRole !== 'SUPER_ADMIN') {
        const err = new Error('FORBIDDEN: Operation requires Organization Director or Super Admin privileges.');
        err.code = 'FORBIDDEN';
        err.status = 403;
        throw err;
      }
      return true;
    }

    // Check if institution belongs to user's organization
    if (userOrgId && db) {
      const instTenant = await db.collection('tenants').findOne({ id: institutionId });
      const instOrg = await db.collection('organizations').findOne({ id: institutionId });

      const matchesOrg = (instTenant && instTenant.orgId === userOrgId) ||
                         (instOrg && (instOrg.id === userOrgId || instOrg.parentOrgId === userOrgId));

      if (matchesOrg && ['ORG_DIRECTOR', 'ORG_AUDITOR'].includes(userRole)) {
        return true;
      }
    }

    // If caller is Branch Admin or Campus Admin, verify their branch/campus belongs to this institution
    if (branchId && userBranchId && userBranchId === branchId) {
      return true;
    }

    const err = new Error(`FORBIDDEN: Access denied for institution [${institutionId}]. Cross-tenant access prohibited.`);
    err.code = 'CROSS_TENANT_ACCESS_DENIED';
    err.status = 403;
    throw err;
  }

  // 2. If orgId is provided, verify against user's org
  if (orgId) {
    if (userOrgId && userOrgId === orgId && ['ORG_DIRECTOR', 'ORG_AUDITOR'].includes(userRole)) {
      return true;
    }
    const err = new Error(`FORBIDDEN: Access denied for organization [${orgId}].`);
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  // 3. If branchId is provided, verify against user's branch
  if (branchId) {
    if (userBranchId && userBranchId === branchId) {
      return true;
    }
    // Check if user's school owns the branch
    if (userSchoolId && db) {
      const branch = await db.collection('branches').findOne({ id: branchId });
      if (branch && branch.institutionId === userSchoolId) {
        return true;
      }
    }
    const err = new Error(`FORBIDDEN: Access denied for branch [${branchId}].`);
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  // 4. If campusId is provided, verify against user's campus
  if (campusId) {
    if (userCampusId && userCampusId === campusId) {
      return true;
    }
    if (db) {
      const campus = await db.collection('campuses').findOne({ id: campusId });
      if (campus && (campus.institutionId === userSchoolId || campus.branchId === userBranchId)) {
        return true;
      }
    }
    const err = new Error(`FORBIDDEN: Access denied for campus [${campusId}].`);
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  return true;
}

// ============================================================================
// 1. BRANCH MANAGEMENT
// ============================================================================

/**
 * Creates a new branch under an institution
 */
export async function createBranch(branchData, db, user) {
  const {
    institutionId,
    orgId,
    branchCode,
    name,
    displayName,
    isMainBranch = false,
    address = {},
    contact = {},
    capacity = 1000,
    institutionType = 'K12_SCHOOL',
    boardAffiliation = 'CBSE',
    officialIdentifiers = {}
  } = branchData;

  if (!institutionId || typeof institutionId !== 'string' || !institutionId.trim()) {
    const err = new Error('VALIDATION_ERROR: "institutionId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  if (!branchCode || typeof branchCode !== 'string' || !/^[A-Z0-9_-]{2,20}$/i.test(branchCode.trim())) {
    const err = new Error('VALIDATION_ERROR: "branchCode" must be 2-20 alphanumeric characters.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('VALIDATION_ERROR: Branch "name" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  // Authorization check: Only SUPER_ADMIN, ORG_DIRECTOR, or PRINCIPAL/ADMIN of this institution
  await assertHierarchyAccess({ user, institutionId, requiredMinRole: 'PRINCIPAL', db });
  if (!['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'].includes(user.role)) {
    const err = new Error('FORBIDDEN: Insufficient privileges to create a branch.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  // Ensure institution exists and is active (not archived)
  const institution = await db.collection('tenants').findOne({ id: institutionId, status: { $ne: 'ARCHIVED' } }) ||
                      await db.collection('organizations').findOne({ id: institutionId, status: { $ne: 'ARCHIVED' } });
  if (!institution) {
    const err = new Error(`INSTITUTION_NOT_FOUND: Active institution [${institutionId}] does not exist.`);
    err.code = 'INSTITUTION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const normalizedCode = branchCode.trim().toUpperCase();

  // Coordinate & Location Validation
  if (address.latitude !== undefined && address.latitude !== null && address.latitude !== '') {
    const lat = Number(address.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      const err = new Error('VALIDATION_ERROR: Latitude must be a valid number between -90 and +90.');
      err.code = 'INVALID_COORDINATES';
      err.status = 400;
      throw err;
    }
  }
  if (address.longitude !== undefined && address.longitude !== null && address.longitude !== '') {
    const lng = Number(address.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      const err = new Error('VALIDATION_ERROR: Longitude must be a valid number between -180 and +180.');
      err.code = 'INVALID_COORDINATES';
      err.status = 400;
      throw err;
    }
  }

  const lockKey = `branch_create_${institutionId}_${normalizedCode}`;
  const lock = await acquireHierarchyLock(lockKey, db, { leaseMs: 5000, maxRetries: 60, retryDelayMs: 25 });

  try {
    // Check duplicate branch code within this institution
    const existingWithCode = await db.collection('branches').findOne({
      institutionId,
      branchCode: normalizedCode,
      status: { $ne: 'ARCHIVED' }
    });
    if (existingWithCode) {
      const err = new Error(`DUPLICATE_BRANCH_CODE: A branch with code [${normalizedCode}] already exists for institution [${institutionId}].`);
      err.code = 'DUPLICATE_BRANCH_CODE';
      err.status = 409;
      throw err;
    }

    // Check if this is the first active branch for this institution
    const existingBranchCount = await db.collection('branches').countDocuments({
      institutionId,
      status: { $ne: 'ARCHIVED' }
    });
    const effectiveIsMain = existingBranchCount === 0 ? true : Boolean(isMainBranch);

    const nowIso = new Date().toISOString();
    const branchId = `BR-${institutionId}-${normalizedCode}-${Date.now().toString(36)}`;

    // If setting this branch as main, atomically demote existing main branches
    if (effectiveIsMain) {
      await db.collection('branches').updateMany(
        { institutionId, isMainBranch: true },
        { $set: { isMainBranch: false, updatedAt: nowIso } }
      );
    }

    const effectiveOrgId = orgId || institution.orgId || null;

    const branchDoc = {
      id: branchId,
      institutionId,
      orgId: effectiveOrgId,
      branchCode: normalizedCode,
      name: name.trim(),
      displayName: displayName ? displayName.trim() : name.trim(),
      isMainBranch: effectiveIsMain,
      institutionType,
      boardAffiliation,
      officialIdentifiers: {
        udiseCode: officialIdentifiers.udiseCode || undefined,
        panNumber: officialIdentifiers.panNumber || undefined,
        gstin: officialIdentifiers.gstin || undefined
      },
      address: {
        street: address.street || '',
        locality: address.locality || '',
        city: address.city || '',
        district: address.district || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'IN',
        latitude: (address.latitude !== undefined && address.latitude !== null && address.latitude !== '') ? Number(address.latitude) : null,
        longitude: (address.longitude !== undefined && address.longitude !== null && address.longitude !== '') ? Number(address.longitude) : null,
        isGeocoded: Boolean(address.latitude && address.longitude)
      },
      contact: {
        email: contact.email || '',
        phone: contact.phone || '',
        principalName: contact.principalName || ''
      },
      capacity: Number(capacity) || 1000,
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: user.id || 'SYSTEM'
    };

    await db.collection('branches').insertOne(branchDoc);

    await recordAuditEvent({
      schoolId: institutionId,
      orgId: effectiveOrgId,
      userId: user.id,
      userName: user.name || user.email,
      role: user.role,
      action: 'CREATE_BRANCH',
      module: 'HIERARCHY_OS',
      resourceType: 'BRANCH',
      resourceId: branchId,
      details: { branchCode: normalizedCode, name: branchDoc.name, isMainBranch: effectiveIsMain }
    });

    return branchDoc;
  } finally {
    await releaseHierarchyLock(lockKey, lock.owner, db);
  }
}

/**
 * Updates an existing branch
 */
export async function updateBranch(branchId, updateData, db, user) {
  if (!branchId) {
    const err = new Error('VALIDATION_ERROR: "branchId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const branch = await db.collection('branches').findOne({ id: branchId });
  if (!branch) {
    const err = new Error(`BRANCH_NOT_FOUND: Branch [${branchId}] does not exist.`);
    err.code = 'BRANCH_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Authorization check
  await assertHierarchyAccess({ user, institutionId: branch.institutionId, branchId, db });

  // Role constraint: BRANCH_ADMIN can only update contact, address, displayName (not isMainBranch, status, code, institutionId)
  if (user.role === 'BRANCH_ADMIN') {
    if (updateData.institutionId && updateData.institutionId !== branch.institutionId) {
      const err = new Error('FORBIDDEN: Branch Admin cannot reassign institution.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
    if (updateData.isMainBranch !== undefined && updateData.isMainBranch !== branch.isMainBranch) {
      const err = new Error('FORBIDDEN: Branch Admin cannot alter main branch designation.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
  }

  const nowIso = new Date().toISOString();
  const updates = { updatedAt: nowIso };

  // Code change validation
  if (updateData.branchCode && updateData.branchCode.trim().toUpperCase() !== branch.branchCode) {
    if (user.role === 'BRANCH_ADMIN') {
      const err = new Error('FORBIDDEN: Branch Admin cannot alter branchCode.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
    const newCode = updateData.branchCode.trim().toUpperCase();
    const existingWithCode = await db.collection('branches').findOne({
      institutionId: branch.institutionId,
      branchCode: newCode,
      id: { $ne: branchId },
      status: { $ne: 'ARCHIVED' }
    });
    if (existingWithCode) {
      const err = new Error(`DUPLICATE_BRANCH_CODE: Branch code [${newCode}] is already in use in institution [${branch.institutionId}].`);
      err.code = 'DUPLICATE_BRANCH_CODE';
      err.status = 409;
      throw err;
    }
    updates.branchCode = newCode;
  }

  if (updateData.name) updates.name = updateData.name.trim();
  if (updateData.displayName) updates.displayName = updateData.displayName.trim();
  if (updateData.status && ['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(updateData.status)) {
    updates.status = updateData.status;
  }
  if (updateData.address) {
    const addr = updateData.address;
    if (addr.latitude !== undefined && addr.latitude !== null && addr.latitude !== '') {
      const lat = Number(addr.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        const err = new Error('VALIDATION_ERROR: Latitude must be a valid number between -90 and +90.');
        err.code = 'INVALID_COORDINATES';
        err.status = 400;
        throw err;
      }
    }
    if (addr.longitude !== undefined && addr.longitude !== null && addr.longitude !== '') {
      const lng = Number(addr.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        const err = new Error('VALIDATION_ERROR: Longitude must be a valid number between -180 and +180.');
        err.code = 'INVALID_COORDINATES';
        err.status = 400;
        throw err;
      }
    }
    const mergedLat = (addr.latitude !== undefined && addr.latitude !== null && addr.latitude !== '') 
      ? Number(addr.latitude) 
      : (branch.address?.latitude ?? null);
    const mergedLng = (addr.longitude !== undefined && addr.longitude !== null && addr.longitude !== '') 
      ? Number(addr.longitude) 
      : (branch.address?.longitude ?? null);

    updates.address = {
      ...branch.address,
      ...addr,
      latitude: mergedLat,
      longitude: mergedLng,
      isGeocoded: Boolean(mergedLat && mergedLng)
    };
  }
  if (updateData.contact) updates.contact = { ...branch.contact, ...updateData.contact };
  if (updateData.capacity !== undefined) updates.capacity = Number(updateData.capacity);
  if (updateData.officialIdentifiers) updates.officialIdentifiers = { ...branch.officialIdentifiers, ...updateData.officialIdentifiers };

  if (updateData.isMainBranch && !branch.isMainBranch) {
    // Demote other branches
    await db.collection('branches').updateMany(
      { institutionId: branch.institutionId, isMainBranch: true },
      { $set: { isMainBranch: false, updatedAt: nowIso } }
    );
    updates.isMainBranch = true;
  } else if (updateData.isMainBranch === false && branch.isMainBranch) {
    updates.isMainBranch = false;
  }

  await db.collection('branches').updateOne({ id: branchId }, { $set: updates });
  const updatedDoc = await db.collection('branches').findOne({ id: branchId });

  await recordAuditEvent({
    schoolId: branch.institutionId,
    orgId: branch.orgId,
    userId: user.id,
    userName: user.name || user.email,
    role: user.role,
    action: 'UPDATE_BRANCH',
    module: 'HIERARCHY_OS',
    resourceType: 'BRANCH',
    resourceId: branchId,
    details: { updatedFields: Object.keys(updates) }
  });

  return updatedDoc;
}

/**
 * Soft archives a branch (non-destructive cascading archival)
 */
export async function archiveBranch(branchId, db, user) {
  if (!branchId) {
    const err = new Error('VALIDATION_ERROR: "branchId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const branch = await db.collection('branches').findOne({ id: branchId });
  if (!branch) {
    const err = new Error(`BRANCH_NOT_FOUND: Branch [${branchId}] does not exist.`);
    err.code = 'BRANCH_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Branch Admins cannot archive their own branch; requires Principal, Org Director, or Super Admin
  await assertHierarchyAccess({ user, institutionId: branch.institutionId, requiredMinRole: 'PRINCIPAL', db });
  if (!['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL'].includes(user.role)) {
    const err = new Error('FORBIDDEN: Insufficient privileges to archive a branch.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const nowIso = new Date().toISOString();

  // 1. Soft archive the branch itself
  await db.collection('branches').updateOne(
    { id: branchId },
    { $set: { status: 'ARCHIVED', isMainBranch: false, updatedAt: nowIso, archivedAt: nowIso, archivedBy: user.id } }
  );

  // 2. Cascade soft archive all campuses belonging to this branch
  const cascadeRes = await db.collection('campuses').updateMany(
    { branchId, status: { $ne: 'ARCHIVED' } },
    { $set: { status: 'ARCHIVED', updatedAt: nowIso, archivedAt: nowIso, archivedBy: user.id } }
  );

  await recordAuditEvent({
    schoolId: branch.institutionId,
    orgId: branch.orgId,
    userId: user.id,
    userName: user.name || user.email,
    role: user.role,
    action: 'ARCHIVE_BRANCH',
    module: 'HIERARCHY_OS',
    resourceType: 'BRANCH',
    resourceId: branchId,
    details: { archivedCampusesCount: cascadeRes.modifiedCount }
  });

  return {
    success: true,
    branchId,
    archivedCampusesCount: cascadeRes.modifiedCount,
    archivedAt: nowIso
  };
}

/**
 * Lists branches with multi-tenant and role scoping
 */
export async function listBranches(filter = {}, db, user) {
  const query = { status: { $ne: 'ARCHIVED' } };
  if (filter.includeArchived) {
    delete query.status;
  } else if (filter.status) {
    query.status = filter.status;
  }

  // Super Admin can filter by anything
  if (user.role === 'SUPER_ADMIN') {
    if (filter.institutionId) query.institutionId = filter.institutionId;
    if (filter.orgId) query.orgId = filter.orgId;
  } else if (user.role === 'ORG_DIRECTOR') {
    // Org Director can see branches across all institutions in their org
    const orgInstitutions = await db.collection('tenants').find({ orgId: user.orgId }).project({ id: 1 }).toArray();
    const instIds = orgInstitutions.map(i => i.id);
    instIds.push(user.orgId); // In case org is also an institution
    query.institutionId = filter.institutionId && instIds.includes(filter.institutionId)
      ? filter.institutionId
      : { $in: instIds };
  } else if (['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STUDENT', 'PARENT'].includes(user.role)) {
    // Scoped strictly to user's schoolId / tenantId
    const schoolId = user.schoolId || user.tenantId;
    query.institutionId = schoolId;
  } else if (user.role === 'BRANCH_ADMIN') {
    query.id = user.branchId;
  } else if (user.role === 'CAMPUS_ADMIN') {
    const campus = await db.collection('campuses').findOne({ id: user.campusId });
    if (campus && campus.branchId) {
      query.id = campus.branchId;
    } else {
      return [];
    }
  }

  return await db.collection('branches').find(query).sort({ isMainBranch: -1, createdAt: 1 }).toArray();
}

/**
 * Gets a single branch
 */
export async function getBranch(branchId, db, user) {
  const branch = await db.collection('branches').findOne({ id: branchId });
  if (!branch) {
    const err = new Error(`BRANCH_NOT_FOUND: Branch [${branchId}] does not exist.`);
    err.code = 'BRANCH_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId: branch.institutionId, branchId, db });
  return branch;
}

// ============================================================================
// 2. CAMPUS MANAGEMENT
// ============================================================================

/**
 * Creates a new campus under a branch
 */
export async function createCampus(campusData, db, user) {
  const {
    branchId,
    institutionId,
    campusCode,
    name,
    campusType = 'MAIN_CAMPUS',
    facilities = [],
    capacity = 500,
    address = {}
  } = campusData;

  if (!branchId || typeof branchId !== 'string' || !branchId.trim()) {
    const err = new Error('VALIDATION_ERROR: "branchId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  if (!campusCode || typeof campusCode !== 'string' || !/^[A-Z0-9_-]{2,20}$/i.test(campusCode.trim())) {
    const err = new Error('VALIDATION_ERROR: "campusCode" must be 2-20 alphanumeric characters.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('VALIDATION_ERROR: Campus "name" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  // Verify branch exists and is active
  const branch = await db.collection('branches').findOne({ id: branchId });
  if (!branch || branch.status === 'ARCHIVED') {
    const err = new Error(`BRANCH_NOT_FOUND: Active branch [${branchId}] does not exist.`);
    err.code = 'BRANCH_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Cross-tenant mismatch validation
  if (institutionId && branch.institutionId !== institutionId) {
    const err = new Error(`CROSS_TENANT_MISMATCH: Branch [${branchId}] belongs to institution [${branch.institutionId}], not [${institutionId}].`);
    err.code = 'CROSS_TENANT_MISMATCH';
    err.status = 400;
    throw err;
  }

  const effectiveInstitutionId = branch.institutionId;

  // Authorization check
  await assertHierarchyAccess({ user, institutionId: effectiveInstitutionId, branchId, db });
  if (!['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN'].includes(user.role)) {
    const err = new Error('FORBIDDEN: Insufficient privileges to create a campus.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const normalizedCampusCode = campusCode.trim().toUpperCase();
  const lockKey = `campus_create_${branchId}_${normalizedCampusCode}`;
  const lock = await acquireHierarchyLock(lockKey, db, { leaseMs: 5000, maxRetries: 60, retryDelayMs: 25 });

  try {
    // Verify unique campusCode within this branch
    const existingCampus = await db.collection('campuses').findOne({
      branchId,
      campusCode: normalizedCampusCode,
      status: { $ne: 'ARCHIVED' }
    });
    if (existingCampus) {
      const err = new Error(`DUPLICATE_CAMPUS_CODE: Campus code [${normalizedCampusCode}] already exists for branch [${branchId}].`);
      err.code = 'DUPLICATE_CAMPUS_CODE';
      err.status = 409;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const campusId = `CMP-${branchId}-${normalizedCampusCode}-${Date.now().toString(36)}`;

    const campusDoc = {
      id: campusId,
      branchId,
      institutionId: effectiveInstitutionId,
      orgId: branch.orgId || null,
      campusCode: normalizedCampusCode,
      name: name.trim(),
      campusType,
      facilities: Array.isArray(facilities) ? facilities : [],
      capacity: Number(capacity) || 500,
      address: {
        street: address.street || branch.address?.street || '',
        city: address.city || branch.address?.city || '',
        state: address.state || branch.address?.state || '',
        postalCode: address.postalCode || branch.address?.postalCode || '',
        country: address.country || branch.address?.country || 'IN'
      },
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: user.id || 'SYSTEM'
    };

    await db.collection('campuses').insertOne(campusDoc);

    await recordAuditEvent({
      schoolId: effectiveInstitutionId,
      orgId: branch.orgId,
      userId: user.id,
      userName: user.name || user.email,
      role: user.role,
      action: 'CREATE_CAMPUS',
      module: 'HIERARCHY_OS',
      resourceType: 'CAMPUS',
      resourceId: campusId,
      details: { campusCode: normalizedCampusCode, name: campusDoc.name, campusType }
    });

    return campusDoc;
  } finally {
    await releaseHierarchyLock(lockKey, lock.owner, db);
  }
}

/**
 * Updates an existing campus
 */
export async function updateCampus(campusId, updateData, db, user) {
  if (!campusId) {
    const err = new Error('VALIDATION_ERROR: "campusId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const campus = await db.collection('campuses').findOne({ id: campusId });
  if (!campus) {
    const err = new Error(`CAMPUS_NOT_FOUND: Campus [${campusId}] does not exist.`);
    err.code = 'CAMPUS_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId: campus.institutionId, branchId: campus.branchId, campusId, db });

  // Campus Admin cannot alter branchId, institutionId, or status
  if (user.role === 'CAMPUS_ADMIN') {
    if (updateData.branchId && updateData.branchId !== campus.branchId) {
      const err = new Error('FORBIDDEN: Campus Admin cannot reassign branch.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
  }

  const nowIso = new Date().toISOString();
  const updates = { updatedAt: nowIso };

  if (updateData.campusCode && updateData.campusCode.trim().toUpperCase() !== campus.campusCode) {
    if (user.role === 'CAMPUS_ADMIN') {
      const err = new Error('FORBIDDEN: Campus Admin cannot alter campusCode.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
    const newCode = updateData.campusCode.trim().toUpperCase();
    const existing = await db.collection('campuses').findOne({
      branchId: campus.branchId,
      campusCode: newCode,
      id: { $ne: campusId },
      status: { $ne: 'ARCHIVED' }
    });
    if (existing) {
      const err = new Error(`DUPLICATE_CAMPUS_CODE: Campus code [${newCode}] already exists in branch [${campus.branchId}].`);
      err.code = 'DUPLICATE_CAMPUS_CODE';
      err.status = 409;
      throw err;
    }
    updates.campusCode = newCode;
  }

  if (updateData.name) updates.name = updateData.name.trim();
  if (updateData.campusType) updates.campusType = updateData.campusType;
  if (Array.isArray(updateData.facilities)) updates.facilities = updateData.facilities;
  if (updateData.capacity !== undefined) updates.capacity = Number(updateData.capacity);
  if (updateData.address) updates.address = { ...campus.address, ...updateData.address };

  await db.collection('campuses').updateOne({ id: campusId }, { $set: updates });
  const updatedDoc = await db.collection('campuses').findOne({ id: campusId });

  await recordAuditEvent({
    schoolId: campus.institutionId,
    orgId: campus.orgId,
    userId: user.id,
    userName: user.name || user.email,
    role: user.role,
    action: 'UPDATE_CAMPUS',
    module: 'HIERARCHY_OS',
    resourceType: 'CAMPUS',
    resourceId: campusId,
    details: { updatedFields: Object.keys(updates) }
  });

  return updatedDoc;
}

/**
 * Soft archives a campus
 */
export async function archiveCampus(campusId, db, user) {
  if (!campusId) {
    const err = new Error('VALIDATION_ERROR: "campusId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const campus = await db.collection('campuses').findOne({ id: campusId });
  if (!campus) {
    const err = new Error(`CAMPUS_NOT_FOUND: Campus [${campusId}] does not exist.`);
    err.code = 'CAMPUS_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Campus Admin cannot archive; requires Branch Admin, Principal, Org Director, or Super Admin
  await assertHierarchyAccess({ user, institutionId: campus.institutionId, branchId: campus.branchId, requiredMinRole: 'BRANCH_ADMIN', db });
  if (!['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN'].includes(user.role)) {
    const err = new Error('FORBIDDEN: Insufficient privileges to archive a campus.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const nowIso = new Date().toISOString();
  await db.collection('campuses').updateOne(
    { id: campusId },
    { $set: { status: 'ARCHIVED', updatedAt: nowIso, archivedAt: nowIso, archivedBy: user.id } }
  );

  await recordAuditEvent({
    schoolId: campus.institutionId,
    orgId: campus.orgId,
    userId: user.id,
    userName: user.name || user.email,
    role: user.role,
    action: 'ARCHIVE_CAMPUS',
    module: 'HIERARCHY_OS',
    resourceType: 'CAMPUS',
    resourceId: campusId,
    details: { name: campus.name }
  });

  return { success: true, campusId, archivedAt: nowIso };
}

/**
 * Lists campuses with scoping
 */
export async function listCampuses(filter = {}, db, user) {
  const query = { status: { $ne: 'ARCHIVED' } };
  if (filter.includeArchived) {
    delete query.status;
  } else if (filter.status) {
    query.status = filter.status;
  }

  if (filter.branchId) query.branchId = filter.branchId;

  if (user.role === 'SUPER_ADMIN') {
    if (filter.institutionId) query.institutionId = filter.institutionId;
  } else if (user.role === 'ORG_DIRECTOR') {
    const orgInstitutions = await db.collection('tenants').find({ orgId: user.orgId }).project({ id: 1 }).toArray();
    const instIds = orgInstitutions.map(i => i.id);
    query.institutionId = { $in: instIds };
  } else if (['PRINCIPAL', 'ADMIN'].includes(user.role)) {
    query.institutionId = user.schoolId || user.tenantId;
  } else if (user.role === 'BRANCH_ADMIN') {
    query.branchId = user.branchId;
  } else if (user.role === 'CAMPUS_ADMIN') {
    query.id = user.campusId;
  }

  return await db.collection('campuses').find(query).sort({ campusType: 1, createdAt: 1 }).toArray();
}

/**
 * Gets a single campus
 */
export async function getCampus(campusId, db, user) {
  const campus = await db.collection('campuses').findOne({ id: campusId });
  if (!campus) {
    const err = new Error(`CAMPUS_NOT_FOUND: Campus [${campusId}] does not exist.`);
    err.code = 'CAMPUS_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId: campus.institutionId, branchId: campus.branchId, campusId, db });
  return campus;
}

// ============================================================================
// 3. ACADEMIC SESSION MANAGEMENT & SINGLE ACTIVE SESSION INVARIANT
// ============================================================================

/**
 * Creates an academic session
 */
export async function createAcademicSession(sessionData, db, user) {
  const {
    institutionId,
    sessionName,
    startDate,
    endDate,
    termType = 'ANNUAL',
    category = 'k12-schools',
    isCurrent = false
  } = sessionData;

  if (!institutionId || typeof institutionId !== 'string' || !institutionId.trim()) {
    const err = new Error('VALIDATION_ERROR: "institutionId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  if (!sessionName || typeof sessionName !== 'string' || !sessionName.trim()) {
    const err = new Error('VALIDATION_ERROR: "sessionName" is required (e.g. "2026-2027").');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  if (!startDate || !endDate || new Date(startDate) >= new Date(endDate)) {
    const err = new Error('VALIDATION_ERROR: "startDate" must be strictly earlier than "endDate".');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId, requiredMinRole: 'PRINCIPAL', db });
  if (!['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'].includes(user.role)) {
    const err = new Error('FORBIDDEN: Insufficient privileges to create an academic session.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const cleanSessionName = sessionName.trim();
  const lockKey = `session_lock_${institutionId}`;
  const lock = await acquireHierarchyLock(lockKey, db, { leaseMs: 15000, maxRetries: 250, retryDelayMs: 20 });

  try {
    // Check duplicate sessionName in this institution
    const existingSession = await db.collection('academic_sessions').findOne({
      institutionId,
      sessionName: cleanSessionName,
      status: { $ne: 'ARCHIVED' }
    });
    if (existingSession) {
      const err = new Error(`DUPLICATE_SESSION: Academic session [${cleanSessionName}] already exists for institution [${institutionId}].`);
      err.code = 'DUPLICATE_SESSION';
      err.status = 409;
      throw err;
    }

    // Check if institution already has an active session
    const currentActive = await db.collection('academic_sessions').findOne({
      institutionId,
      isCurrent: true,
      status: { $ne: 'ARCHIVED' }
    });

    // If requested isCurrent=true OR there is no existing active session, make this one active
    const shouldBeCurrent = Boolean(isCurrent) || !currentActive;
    const nowIso = new Date().toISOString();
    const sessionId = `SESS-${institutionId}-${cleanSessionName.replace(/[^A-Za-z0-9_-]/g, '_')}`;

    if (shouldBeCurrent && currentActive) {
      // Demote current session atomically
      await db.collection('academic_sessions').updateMany(
        { institutionId, isCurrent: true },
        { $set: { isCurrent: false, status: 'CONCLUDED', updatedAt: nowIso } }
      );
    }

    const sessionDoc = {
      id: sessionId,
      schoolId: institutionId, // Backwards compatibility with older routes
      institutionId,
      sessionName: cleanSessionName,
      startDate,
      endDate,
      termType,
      category,
      isCurrent: shouldBeCurrent,
      status: shouldBeCurrent ? 'ACTIVE' : 'UPCOMING',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: user.id || 'SYSTEM'
    };

    await db.collection('academic_sessions').insertOne(sessionDoc);

    // Sync tenant branding if current
    if (shouldBeCurrent) {
      await db.collection('tenants').updateOne(
        { id: institutionId },
        { $set: { 'branding.academicSession': cleanSessionName, updatedAt: nowIso } }
      );
    }

    await recordAuditEvent({
      schoolId: institutionId,
      userId: user.id,
      userName: user.name || user.email,
      role: user.role,
      action: 'CREATE_ACADEMIC_SESSION',
      module: 'HIERARCHY_OS',
      resourceType: 'ACADEMIC_SESSION',
      resourceId: sessionId,
      details: { sessionName: cleanSessionName, isCurrent: shouldBeCurrent, startDate, endDate }
    });

    return sessionDoc;
  } finally {
    await releaseHierarchyLock(lockKey, lock.owner, db);
  }
}

/**
 * Activates an academic session, enforcing the strict single-active-session invariant
 */
export async function activateAcademicSession(sessionId, institutionId, db, user) {
  if (!sessionId || !institutionId) {
    const err = new Error('VALIDATION_ERROR: "sessionId" and "institutionId" are required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId, requiredMinRole: 'PRINCIPAL', db });
  if (!['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'].includes(user.role)) {
    const err = new Error('FORBIDDEN: Insufficient privileges to activate academic session.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  // SERIALIZED CONCURRENCY GUARD: Acquire distributed mutex lease lock for this institution's sessions
  const lockKey = `session_lock_${institutionId}`;
  const lock = await acquireHierarchyLock(lockKey, db, { leaseMs: 15000, maxRetries: 250, retryDelayMs: 20 });

  try {
    const targetSession = await db.collection('academic_sessions').findOne({ id: sessionId, institutionId });
    if (!targetSession) {
      const err = new Error(`SESSION_NOT_FOUND: Academic session [${sessionId}] does not exist for institution [${institutionId}].`);
      err.code = 'SESSION_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (targetSession.status === 'ARCHIVED') {
      const err = new Error('INVALID_SESSION_STATE: Cannot activate an archived academic session.');
      err.code = 'INVALID_SESSION_STATE';
      err.status = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();

    // ATOMIC SINGLE ACTIVE SESSION SWITCH (MUTEX SERIALIZED):
    // Step 1: Conclude all currently active sessions for this institution
    await db.collection('academic_sessions').updateMany(
      { institutionId, isCurrent: true, id: { $ne: sessionId } },
      { $set: { isCurrent: false, status: 'CONCLUDED', updatedAt: nowIso } }
    );

    // Step 2: Set the target session as the single current active session
    await db.collection('academic_sessions').updateOne(
      { id: sessionId },
      { $set: { isCurrent: true, status: 'ACTIVE', updatedAt: nowIso } }
    );

    // Step 3: Update tenant branding
    await db.collection('tenants').updateOne(
      { id: institutionId },
      { $set: { 'branding.academicSession': targetSession.sessionName, updatedAt: nowIso } }
    );

    const activatedDoc = await db.collection('academic_sessions').findOne({ id: sessionId });

    await recordAuditEvent({
      schoolId: institutionId,
      userId: user.id,
      userName: user.name || user.email,
      role: user.role,
      action: 'ACTIVATE_ACADEMIC_SESSION',
      module: 'HIERARCHY_OS',
      resourceType: 'ACADEMIC_SESSION',
      resourceId: sessionId,
      details: { sessionName: targetSession.sessionName }
    });

    return {
      success: true,
      activatedSession: activatedDoc
    };
  } finally {
    await releaseHierarchyLock(lockKey, lock.owner, db);
  }
}

/**
 * Updates an academic session
 */
export async function updateAcademicSession(sessionId, updateData, db, user) {
  const session = await db.collection('academic_sessions').findOne({ id: sessionId });
  if (!session) {
    const err = new Error(`SESSION_NOT_FOUND: Academic session [${sessionId}] does not exist.`);
    err.code = 'SESSION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId: session.institutionId, requiredMinRole: 'PRINCIPAL', db });

  // If activating via update, delegate to atomic activator
  if (updateData.isCurrent === true && !session.isCurrent) {
    return await activateAcademicSession(sessionId, session.institutionId, db, user);
  }

  const nowIso = new Date().toISOString();
  const updates = { updatedAt: nowIso };

  if (updateData.sessionName) updates.sessionName = updateData.sessionName.trim();
  if (updateData.startDate) updates.startDate = updateData.startDate;
  if (updateData.endDate) updates.endDate = updateData.endDate;
  if (updateData.termType) updates.termType = updateData.termType;
  if (updateData.status && ['UPCOMING', 'ACTIVE', 'CONCLUDED', 'ARCHIVED'].includes(updateData.status)) {
    updates.status = updateData.status;
  }

  // Validate dates
  const effectiveStart = updates.startDate || session.startDate;
  const effectiveEnd = updates.endDate || session.endDate;
  if (new Date(effectiveStart) >= new Date(effectiveEnd)) {
    const err = new Error('VALIDATION_ERROR: "startDate" must be strictly earlier than "endDate".');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  await db.collection('academic_sessions').updateOne({ id: sessionId }, { $set: updates });
  const updatedDoc = await db.collection('academic_sessions').findOne({ id: sessionId });

  await recordAuditEvent({
    schoolId: session.institutionId,
    userId: user.id,
    userName: user.name || user.email,
    role: user.role,
    action: 'UPDATE_ACADEMIC_SESSION',
    module: 'HIERARCHY_OS',
    resourceType: 'ACADEMIC_SESSION',
    resourceId: sessionId,
    details: { updatedFields: Object.keys(updates) }
  });

  return updatedDoc;
}

/**
 * Soft archives an academic session
 */
export async function archiveAcademicSession(sessionId, db, user) {
  const session = await db.collection('academic_sessions').findOne({ id: sessionId });
  if (!session) {
    const err = new Error(`SESSION_NOT_FOUND: Academic session [${sessionId}] does not exist.`);
    err.code = 'SESSION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId: session.institutionId, requiredMinRole: 'PRINCIPAL', db });

  // Invariant: Cannot archive the currently active session
  if (session.isCurrent) {
    const err = new Error('INVALID_SESSION_STATE: Cannot archive the currently active session. Activate another session first.');
    err.code = 'ACTIVE_SESSION_ARCHIVAL_FORBIDDEN';
    err.status = 400;
    throw err;
  }

  const nowIso = new Date().toISOString();
  await db.collection('academic_sessions').updateOne(
    { id: sessionId },
    { $set: { status: 'ARCHIVED', updatedAt: nowIso, archivedAt: nowIso, archivedBy: user.id } }
  );

  await recordAuditEvent({
    schoolId: session.institutionId,
    userId: user.id,
    userName: user.name || user.email,
    role: user.role,
    action: 'ARCHIVE_ACADEMIC_SESSION',
    module: 'HIERARCHY_OS',
    resourceType: 'ACADEMIC_SESSION',
    resourceId: sessionId,
    details: { sessionName: session.sessionName }
  });

  return { success: true, sessionId, archivedAt: nowIso };
}

/**
 * Lists academic sessions for an institution
 */
export async function listAcademicSessions(institutionId, db, user) {
  if (!institutionId) {
    const err = new Error('VALIDATION_ERROR: "institutionId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId, db });

  return await db.collection('academic_sessions')
    .find({
      $or: [{ institutionId }, { schoolId: institutionId }],
      status: { $ne: 'ARCHIVED' }
    })
    .sort({ startDate: -1 })
    .toArray();
}

/**
 * Retrieves the single active session for an institution
 */
export async function getActiveAcademicSession(institutionId, db) {
  if (!institutionId) return null;
  return await db.collection('academic_sessions').findOne({
    $or: [{ institutionId }, { schoolId: institutionId }],
    isCurrent: true,
    status: { $ne: 'ARCHIVED' }
  });
}

// ============================================================================
// 4. HIERARCHY TREE RESOLUTION & BREADCRUMBS
// ============================================================================

/**
 * Resolves the full hierarchical tree for an institution
 * Platform -> Organization/Trust -> Institution -> Branches -> Campuses
 * Provides zero-overhead fallback for standalone institutions.
 */
export async function resolveHierarchyTree(institutionId, db, user) {
  if (!institutionId) {
    const err = new Error('VALIDATION_ERROR: "institutionId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  await assertHierarchyAccess({ user, institutionId, db });

  // 1. Fetch institution tenant
  let tenant = await db.collection('tenants').findOne({ id: institutionId });
  let orgDoc = await db.collection('organizations').findOne({ id: institutionId });

  if (!tenant && !orgDoc) {
    const err = new Error(`INSTITUTION_NOT_FOUND: Institution [${institutionId}] does not exist.`);
    err.code = 'INSTITUTION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const institutionName = tenant?.name || orgDoc?.name || orgDoc?.legalName || 'Educational Institution';
  const parentOrgId = tenant?.orgId || orgDoc?.parentOrgId || null;

  // 2. Resolve Parent Organization if present
  let organization = null;
  if (parentOrgId) {
    organization = await db.collection('organizations').findOne({ id: parentOrgId });
  }

  // 3. Fetch active academic session
  const activeSession = await getActiveAcademicSession(institutionId, db);

  // 4. Fetch all active branches
  let branches = await db.collection('branches')
    .find({ institutionId, status: { $ne: 'ARCHIVED' } })
    .sort({ isMainBranch: -1, createdAt: 1 })
    .toArray();

  // ZERO-OVERHEAD STANDALONE FALLBACK:
  // If no branch exists in DB, provide a synthetic standalone branch representation
  if (branches.length === 0) {
    const defaultBranch = {
      id: `BR-${institutionId}-MAIN`,
      institutionId,
      branchCode: 'MAIN',
      name: `${institutionName} (Main Branch)`,
      displayName: 'Main Branch',
      isMainBranch: true,
      status: 'ACTIVE',
      capacity: tenant?.studentLimit || 1000,
      address: tenant?.branding?.address ? { city: tenant.branding.address, country: 'IN' } : { country: 'IN' },
      isSyntheticDefault: true,
      campuses: [
        {
          id: `CMP-${institutionId}-MAIN-1`,
          branchId: `BR-${institutionId}-MAIN`,
          institutionId,
          campusCode: 'CAMPUS-1',
          name: 'Main Campus',
          campusType: 'MAIN_CAMPUS',
          status: 'ACTIVE',
          capacity: tenant?.studentLimit || 1000,
          isSyntheticDefault: true
        }
      ]
    };
    branches = [defaultBranch];
  } else {
    // 5. Fetch campuses for each branch
    const branchIds = branches.map(b => b.id);
    const campuses = await db.collection('campuses')
      .find({ branchId: { $in: branchIds }, status: { $ne: 'ARCHIVED' } })
      .sort({ campusType: 1, createdAt: 1 })
      .toArray();

    branches = branches.map(branch => ({
      ...branch,
      campuses: campuses.filter(c => c.branchId === branch.id)
    }));
  }

  const totalCampuses = branches.reduce((acc, b) => acc + (b.campuses ? b.campuses.length : 0), 0);
  const totalCapacity = branches.reduce((acc, b) => acc + (Number(b.capacity) || 0), 0);

  return {
    institution: {
      id: institutionId,
      name: institutionName,
      code: tenant?.code || orgDoc?.orgCode || institutionId,
      category: tenant?.category || 'k12-schools',
      board: tenant?.board || 'CBSE',
      isStandalone: !parentOrgId
    },
    organization: organization ? {
      id: organization.id,
      name: organization.name || organization.legalName,
      orgCode: organization.orgCode,
      orgType: organization.orgType || organization.type
    } : null,
    activeSession: activeSession ? {
      id: activeSession.id,
      sessionName: activeSession.sessionName,
      startDate: activeSession.startDate,
      endDate: activeSession.endDate,
      termType: activeSession.termType,
      isCurrent: true
    } : null,
    branches,
    stats: {
      branchCount: branches.length,
      campusCount: totalCampuses,
      totalCapacity,
      hasActiveSession: Boolean(activeSession)
    }
  };
}

/**
 * Resolves breadcrumb hierarchy for any node in the tree
 */
export async function getHierarchyBreadcrumbs(entityType, entityId, db, user) {
  if (!entityType || !entityId) return [];

  const breadcrumbs = [];

  if (entityType === 'CAMPUS') {
    const campus = await db.collection('campuses').findOne({ id: entityId });
    if (campus) {
      const branch = await db.collection('branches').findOne({ id: campus.branchId });
      const institution = branch ? await db.collection('tenants').findOne({ id: branch.institutionId }) : null;
      const org = institution?.orgId ? await db.collection('organizations').findOne({ id: institution.orgId }) : null;

      if (org) breadcrumbs.push({ type: 'ORGANIZATION', id: org.id, name: org.name || org.legalName });
      if (institution) breadcrumbs.push({ type: 'INSTITUTION', id: institution.id, name: institution.name });
      if (branch) breadcrumbs.push({ type: 'BRANCH', id: branch.id, name: branch.name, code: branch.branchCode });
      breadcrumbs.push({ type: 'CAMPUS', id: campus.id, name: campus.name, code: campus.campusCode });
    }
  } else if (entityType === 'BRANCH') {
    const branch = await db.collection('branches').findOne({ id: entityId });
    if (branch) {
      const institution = await db.collection('tenants').findOne({ id: branch.institutionId });
      const org = institution?.orgId ? await db.collection('organizations').findOne({ id: institution.orgId }) : null;

      if (org) breadcrumbs.push({ type: 'ORGANIZATION', id: org.id, name: org.name || org.legalName });
      if (institution) breadcrumbs.push({ type: 'INSTITUTION', id: institution.id, name: institution.name });
      breadcrumbs.push({ type: 'BRANCH', id: branch.id, name: branch.name, code: branch.branchCode });
    }
  } else if (entityType === 'INSTITUTION') {
    const institution = await db.collection('tenants').findOne({ id: entityId }) ||
                        await db.collection('organizations').findOne({ id: entityId });
    if (institution) {
      const org = institution.orgId ? await db.collection('organizations').findOne({ id: institution.orgId }) : null;
      if (org) breadcrumbs.push({ type: 'ORGANIZATION', id: org.id, name: org.name || org.legalName });
      breadcrumbs.push({ type: 'INSTITUTION', id: institution.id, name: institution.name });
    }
  } else if (entityType === 'ORGANIZATION') {
    const org = await db.collection('organizations').findOne({ id: entityId });
    if (org) {
      breadcrumbs.push({ type: 'ORGANIZATION', id: org.id, name: org.name || org.legalName });
    }
  }

  return breadcrumbs;
}

// ============================================================================
// 5. IDEMPOTENT APPROVED INSTITUTION ONBOARDING BRIDGE
// ============================================================================

/**
 * Idempotently onboards an approved Phase 08 registration application into the full hierarchy
 * Ensuring default branch, main campus, and active academic session exist without duplicate creation.
 */
export async function onboardApprovedInstitution(applicationId, db) {
  if (!applicationId) {
    const err = new Error('VALIDATION_ERROR: "applicationId" is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  // 1. Fetch registration application
  const app = await db.collection('tenant_registrations').findOne({ id: applicationId });
  if (!app) {
    const err = new Error(`REGISTRATION_NOT_FOUND: Application [${applicationId}] does not exist.`);
    err.code = 'REGISTRATION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (app.status !== 'APPROVED') {
    const err = new Error(`INVALID_REGISTRATION_STATUS: Application [${applicationId}] has status [${app.status}], expected 'APPROVED'.`);
    err.code = 'INVALID_REGISTRATION_STATUS';
    err.status = 400;
    throw err;
  }

  const tenantId = app.tenantId;
  if (!tenantId) {
    const err = new Error('INVALID_APPLICATION_DATA: Application has no associated tenantId.');
    err.code = 'INVALID_APPLICATION_DATA';
    err.status = 400;
    throw err;
  }

  const tenant = await db.collection('tenants').findOne({ id: tenantId });
  if (!tenant) {
    const err = new Error(`TENANT_NOT_FOUND: Provisioned tenant [${tenantId}] not found.`);
    err.code = 'TENANT_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const nowIso = new Date().toISOString();
  let defaultBranchCreated = false;
  let defaultCampusCreated = false;
  let sessionEnsured = false;

  // 2. Ensure default primary branch exists
  let branch = await db.collection('branches').findOne({
    institutionId: tenantId,
    status: { $ne: 'ARCHIVED' }
  });

  if (!branch) {
    const branchDoc = {
      id: `BR-${tenantId}-MAIN`,
      institutionId: tenantId,
      orgId: tenant.orgId || null,
      branchCode: 'MAIN',
      name: `${tenant.name} Main Branch`,
      displayName: 'Main Branch',
      isMainBranch: true,
      institutionType: tenant.category === 'colleges-higher-ed' ? 'SENIOR_SECONDARY_COLLEGE' : 'K12_SCHOOL',
      boardAffiliation: tenant.board || 'CBSE',
      address: {
        street: tenant.branding?.address || '',
        city: tenant.city || '',
        state: app.state || '',
        postalCode: '',
        country: 'IN'
      },
      contact: {
        email: tenant.adminEmail || '',
        phone: tenant.adminPhone || '',
        principalName: tenant.adminName || ''
      },
      capacity: tenant.studentLimit || 1000,
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: 'SYSTEM_ONBOARDING'
    };

    await db.collection('branches').insertOne(branchDoc);
    branch = branchDoc;
    defaultBranchCreated = true;
  }

  // 3. Ensure default campus exists under branch
  let campus = await db.collection('campuses').findOne({
    branchId: branch.id,
    status: { $ne: 'ARCHIVED' }
  });

  if (!campus) {
    const campusDoc = {
      id: `CMP-${branch.id}-CAMPUS-1`,
      branchId: branch.id,
      institutionId: tenantId,
      orgId: branch.orgId || null,
      campusCode: 'CAMPUS-1',
      name: 'Main Campus',
      campusType: 'MAIN_CAMPUS',
      facilities: ['Smart Classrooms', 'Library', 'Computer Lab', 'Playground'],
      capacity: branch.capacity || 1000,
      address: branch.address,
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: 'SYSTEM_ONBOARDING'
    };

    await db.collection('campuses').insertOne(campusDoc);
    campus = campusDoc;
    defaultCampusCreated = true;
  }

  // 4. Ensure active academic session exists
  let activeSession = await db.collection('academic_sessions').findOne({
    institutionId: tenantId,
    isCurrent: true,
    status: { $ne: 'ARCHIVED' }
  });

  if (!activeSession) {
    const sessionPolicy = calculateAcademicSessionPolicy(tenant.category || 'k12-schools', nowIso);
    const sessionDoc = {
      id: `SESS-${tenantId}-${sessionPolicy.sessionName}`,
      schoolId: tenantId,
      institutionId: tenantId,
      sessionName: sessionPolicy.sessionName,
      startDate: sessionPolicy.startDate,
      endDate: sessionPolicy.endDate,
      termType: sessionPolicy.termType,
      category: sessionPolicy.category,
      isCurrent: true,
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: 'SYSTEM_ONBOARDING'
    };

    await db.collection('academic_sessions').insertOne(sessionDoc);
    activeSession = sessionDoc;
    sessionEnsured = true;
  }

  return {
    success: true,
    applicationId,
    tenantId,
    defaultBranchCreated,
    defaultCampusCreated,
    sessionEnsured,
    branchId: branch.id,
    campusId: campus.id,
    activeSessionId: activeSession.id
  };
}
