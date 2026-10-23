/**
 * i2A SchoolOS — Organization Hierarchy & Multi-Tenant Authorization Engine
 * Document Reference: Master Prompt 03 — Domain Model & Organization Hierarchy
 * 
 * Provides server-side services for:
 * - Recursive Organization Hierarchy Resolution (Trust -> Branches)
 * - Anti-Cycle & Valid Parent Verification for Hierarchical Units
 * - Strict Cross-Tenant Reference Validation (Foreign Entity Boundary Checks)
 * - Multi-Guardian to Multi-Student Link Management
 * - Academic Session Progression & Enrollment Integrity Checks
 */

import { validateOrganization } from './domainValidation.js';


/**
 * Checks for circular relationships in organization hierarchy
 * Traverses parent pointers starting from candidateParentId; if childId is encountered, a cycle exists.
 */
export async function detectHierarchyCycle(childId, candidateParentId, database, { session } = {}) {
  if (!childId || !candidateParentId) return false;
  if (childId === candidateParentId) return true;

  let currentId = candidateParentId;
  const visited = new Set([childId]);

  while (currentId) {
    if (visited.has(currentId)) {
      return true; // Cycle detected
    }
    visited.add(currentId);

    const parentDoc = await database.collection('organizations').findOne(
      { id: currentId },
      session ? { session } : undefined
    );
    if (!parentDoc || !parentDoc.parentOrgId) {
      break;
    }
    currentId = parentDoc.parentOrgId;
  }

  return false;
}

/**
 * Validates Parent-Child Organization Link
 */
export async function validateOrganizationLink(parentId, childId, database, { session } = {}) {
  if (!parentId) return { valid: true }; // Standalone organization

  if (parentId === childId) {
    return {
      valid: false,
      code: 'SELF_HIERARCHY_VIOLATION',
      error: 'An organization cannot be its own parent.'
    };
  }

  const parent = await database.collection('organizations').findOne(
    { id: parentId },
    session ? { session } : undefined
  );
  if (!parent) {
    return {
      valid: false,
      code: 'INVALID_PARENT_ORGANIZATION',
      error: `Parent organization [${parentId}] does not exist.`
    };
  }

  if (parent.orgType === 'INDEPENDENT_SCHOOL') {
    return {
      valid: false,
      code: 'INVALID_PARENT_TYPE',
      error: `Organization [${parentId}] is an INDEPENDENT_SCHOOL and cannot serve as a parent organization.`
    };
  }

  if (childId) {
    const isCycle = await detectHierarchyCycle(childId, parentId, database, { session });
    if (isCycle) {
      return {
        valid: false,
        code: 'CIRCULAR_HIERARCHY_DETECTED',
        error: `Circular organization relationship detected: [${childId}] cannot have ancestor [${parentId}] as parent.`
      };
    }
  }

  return { valid: true, parent };
}

/**
 * Acquires a distributed lease lock for hierarchy updates.
 * Canonical sorted key or graph mutex prevents deadlocks between concurrent updates.
 * Provides monotonically increasing fencing token and lease expiry fallback,
 * safe on standalone MongoDB and replica sets.
 */
export async function acquireHierarchyLock(lockKey, database, { leaseMs = 5000, maxRetries = 20, retryDelayMs = 50 } = {}) {
  const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseMs);

    // Monotonically increasing fencing token via atomic sequence
    const seqDoc = await database.collection('hierarchy_locks').findOneAndUpdate(
      { _id: '__lock_sequence__' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const fencingToken = seqDoc && typeof seqDoc.seq === 'number' ? seqDoc.seq : Date.now();

    try {
      await database.collection('hierarchy_locks').insertOne({
        _id: lockKey,
        locked: true,
        owner: nonce,
        fencingToken,
        lockedAt: now,
        expiresAt
      });
      return { acquired: true, lockKey, owner: nonce, fencingToken };
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key: check if lease expired
        const stolen = await database.collection('hierarchy_locks').findOneAndUpdate(
          {
            _id: lockKey,
            expiresAt: { $lt: now }
          },
          {
            $set: {
              locked: true,
              owner: nonce,
              fencingToken,
              lockedAt: now,
              expiresAt
            }
          },
          { returnDocument: 'after' }
        );

        if (stolen) {
          return { acquired: true, lockKey, owner: nonce, fencingToken };
        }

        // Lock is held by another active process, wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        throw err;
      }
    }
  }

  const timeoutError = new Error(`HIERARCHY_LOCK_TIMEOUT: Failed to acquire hierarchy lock for [${lockKey}] after ${maxRetries} attempts.`);
  timeoutError.code = 'HIERARCHY_LOCK_TIMEOUT';
  throw timeoutError;
}

/**
 * Releases a distributed hierarchy lease lock (owner-validated)
 */
export async function releaseHierarchyLock(lockKey, nonce, database) {
  if (!lockKey || !nonce) return false;
  const result = await database.collection('hierarchy_locks').deleteOne({
    _id: lockKey,
    owner: nonce
  });
  return result.deletedCount > 0;
}

/**
 * Safely updates an organization's parent using ACID Multi-Document Transactions:
 * 1. Hierarchy Graph Mutex Lease Locking with Monotonic Fencing Tokens
 * 2. In-Transaction Lock-Touch (Acquires WiredTiger write lock on central mutex document)
 * 3. Pre-update cycle detection evaluated within the transaction snapshot
 * 4. Compare-And-Set (CAS) atomic persistence on organizations collection
 * 5. Post-update cycle verification within the transaction snapshot
 * 6. Pre-commit lease verification inside the transaction
 * 7. Storage-engine level rollback (abortTransaction) on error, zero dirty writes
 * 8. Bounded exponential backoff retry for transient write conflicts (WriteConflictError)
 * 9. Fail-closed behavior if transactions/sessions are unsupported
 */
export async function updateOrganizationParent({
  childId,
  parentId,
  database,
  lockKey,
  maxRetries = 20,
  retryDelayMs = 50,
  leaseMs = 5000,
  maxTxRetries = 5
}) {
  if (!childId) {
    const err = new Error('INVALID_CHILD_ORGANIZATION: childId is required.');
    err.code = 'INVALID_CHILD_ORGANIZATION';
    throw err;
  }

  // 1. Immediate Self-Parenting Check (O(1) upfront)
  if (parentId && parentId === childId) {
    const err = new Error('SELF_HIERARCHY_VIOLATION: An organization cannot be its own parent.');
    err.code = 'SELF_HIERARCHY_VIOLATION';
    throw err;
  }

  // 2. Validate existence of entities
  const child = await database.collection('organizations').findOne({ id: childId });
  if (!child) {
    const err = new Error(`INVALID_CHILD_ORGANIZATION: Child organization [${childId}] does not exist.`);
    err.code = 'INVALID_CHILD_ORGANIZATION';
    throw err;
  }

  if (parentId) {
    const linkValidation = await validateOrganizationLink(parentId, childId, database);
    if (!linkValidation.valid) {
      const err = new Error(`${linkValidation.code}: ${linkValidation.error}`);
      err.code = linkValidation.code;
      throw err;
    }
  }

  // If already at requested parent, idempotent no-op
  if (child.parentOrgId === (parentId || null)) {
    return {
      success: true,
      childId,
      parentId: parentId || null,
      previousParentId: child.parentOrgId || null,
      noOp: true
    };
  }

  // 3. Topology Safety Check: MongoDB Transactions Require a Replica Set Session
  const client = database.client;
  if (!client || typeof client.startSession !== 'function') {
    const err = new Error('TRANSACTION_UNSUPPORTED_TOPOLOGY: MongoDB client does not support sessions for transactional hierarchy mutations.');
    err.code = 'TRANSACTION_UNSUPPORTED_TOPOLOGY';
    throw err;
  }

  // 4. Acquire Distributed Graph Mutex Lease Lock
  const effectiveLockKey = lockKey || 'hierarchy_graph_mutex';
  const lock = await acquireHierarchyLock(effectiveLockKey, database, { leaseMs, maxRetries, retryDelayMs });

  try {
    let txAttempt = 0;
    let updateResultPayload = null;

    // 5. Bounded Transaction Retry Loop for Transient Write Conflicts
    while (txAttempt < maxTxRetries) {
      const session = client.startSession();
      try {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' }
        });

        // Step A: In-Transaction Lock-Touch
        // Atomically touches the lock document within the transaction. This forces WiredTiger
        // to take a write lock on the central mutex document, preventing Write Skew across
        // competing transactions and serializing all concurrent hierarchy modifications.
        const lockTouch = await database.collection('hierarchy_locks').findOneAndUpdate(
          {
            _id: effectiveLockKey,
            owner: lock.owner,
            fencingToken: lock.fencingToken,
            expiresAt: { $gt: new Date() }
          },
          {
            $set: { lastVerifiedAt: new Date() }
          },
          { session, returnDocument: 'after' }
        );

        if (!lockTouch) {
          const err = new Error(`LEASE_EXPIRED: Hierarchy lock for [${effectiveLockKey}] expired or stolen before transaction write.`);
          err.code = 'LEASE_EXPIRED';
          throw err;
        }

        // Step B: Pre-Update Cycle Detection within Transaction Snapshot
        if (parentId) {
          const isPreCycle = await detectHierarchyCycle(childId, parentId, database, { session });
          if (isPreCycle) {
            const err = new Error(`CIRCULAR_HIERARCHY_DETECTED: Circular organization relationship detected: [${childId}] cannot have ancestor [${parentId}] as parent.`);
            err.code = 'CIRCULAR_HIERARCHY_DETECTED';
            throw err;
          }
        }

        // Step C: Read Fresh Child State under Transaction Snapshot
        const freshChild = await database.collection('organizations').findOne(
          { id: childId },
          { session }
        );
        if (!freshChild) {
          const err = new Error(`INVALID_CHILD_ORGANIZATION: Child organization [${childId}] does not exist.`);
          err.code = 'INVALID_CHILD_ORGANIZATION';
          throw err;
        }
        const currentVersion = typeof freshChild.version === 'number' ? freshChild.version : 1;
        const previousParentId = freshChild.parentOrgId || null;

        // Step D: Apply Update with Compare-And-Set (CAS on Version AND Fencing Token)
        const updateResult = await database.collection('organizations').updateOne(
          {
            id: childId,
            version: currentVersion,
            $or: [
              { lastFencingToken: { $exists: false } },
              { lastFencingToken: { $lt: lock.fencingToken } }
            ]
          },
          {
            $set: {
              parentOrgId: parentId || null,
              updatedAt: new Date().toISOString(),
              lastFencingToken: lock.fencingToken
            },
            $inc: { version: 1 }
          },
          { session }
        );

        if (updateResult.matchedCount === 0) {
          const err = new Error(
            `STALE_MUTATION_REJECTED: Organization [${childId}] mutation rejected by CAS check (expected version ${currentVersion}, fencing token ${lock.fencingToken}). Mutation aborted.`
          );
          err.code = 'STALE_MUTATION_REJECTED';
          throw err;
        }

        // Step E: Post-Update Cycle Verification inside Transaction
        if (parentId) {
          const isPostCycle = await detectHierarchyCycle(childId, parentId, database, { session });
          if (isPostCycle) {
            const err = new Error(`CIRCULAR_HIERARCHY_DETECTED: Post-update circular hierarchy detected: [${childId}] cannot have ancestor [${parentId}] as parent. Transaction aborted.`);
            err.code = 'CIRCULAR_HIERARCHY_DETECTED';
            throw err;
          }
        }

        // Step F: Pre-Commit Lease Validation inside Transaction
        const finalLockCheck = await database.collection('hierarchy_locks').findOne(
          {
            _id: effectiveLockKey,
            owner: lock.owner,
            fencingToken: lock.fencingToken,
            expiresAt: { $gt: new Date() }
          },
          { session }
        );
        if (!finalLockCheck) {
          const err = new Error(`LEASE_EXPIRED_BEFORE_COMMIT: Hierarchy lock expired before transaction commit.`);
          err.code = 'LEASE_EXPIRED_BEFORE_COMMIT';
          throw err;
        }

        // Step G: Commit ACID Transaction
        await session.commitTransaction();

        updateResultPayload = {
          success: true,
          childId,
          parentId: parentId || null,
          previousParentId,
          version: currentVersion + 1,
          fencingToken: lock.fencingToken
        };
        break; // Successfully committed; exit retry loop
      } catch (txErr) {
        // Storage-engine level rollback: all uncommitted writes discarded
        try {
          await session.abortTransaction();
        } catch (_) {}

        // Check if transient error eligible for retry
        const isTransient = (txErr.hasErrorLabel && txErr.hasErrorLabel('TransientTransactionError')) ||
          txErr.code === 112 ||
          txErr.codeName === 'WriteConflict';

        if (isTransient && txAttempt < maxTxRetries - 1) {
          txAttempt++;
          const backoffMs = retryDelayMs * Math.pow(1.5, txAttempt) + Math.random() * 20;
          await new Promise(r => setTimeout(r, backoffMs));
          continue; // Retry with fresh transaction snapshot
        }

        // Non-transient or exhausted retries: fail closed
        throw txErr;
      } finally {
        await session.endSession();
      }
    }

    if (!updateResultPayload) {
      const timeoutErr = new Error(`TRANSACTION_FAILED: Failed to commit hierarchy mutation after ${maxTxRetries} attempts.`);
      timeoutErr.code = 'TRANSACTION_FAILED';
      throw timeoutErr;
    }

    return updateResultPayload;
  } finally {
    // 6. Owner-Validated Distributed Lock Release
    await releaseHierarchyLock(effectiveLockKey, lock.owner, database);
  }
}

/**
 * Authoritative creation of an Organization entity.
 * Enforces hierarchy graph mutex, parent validation, transactional isolation, and CAS versioning.
 * Prevents bypass of cycle detection and domain rules during entity provisioning or import.
 */
export async function createOrganization(orgDoc, database, { leaseMs = 5000, maxRetries = 20, retryDelayMs = 50 } = {}) {
  if (!orgDoc || !orgDoc.id) {
    const err = new Error('INVALID_ORGANIZATION_DATA: Organization id is required.');
    err.code = 'INVALID_ORGANIZATION_DATA';
    throw err;
  }

  // 1. Structural domain validation
  const validation = validateOrganization(orgDoc);
  if (!validation.valid) {
    const err = new Error(`VALIDATION_ERROR: ${validation.errors.join('; ')}`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const now = new Date().toISOString();

  // 2. If organization has a parent, it must be protected by graph mutex AND transaction
  if (orgDoc.parentOrgId) {
    if (orgDoc.parentOrgId === orgDoc.id) {
      const err = new Error('SELF_HIERARCHY_VIOLATION: An organization cannot be its own parent.');
      err.code = 'SELF_HIERARCHY_VIOLATION';
      throw err;
    }

    const client = database.client;
    if (!client || typeof client.startSession !== 'function') {
      const err = new Error('TRANSACTION_UNSUPPORTED_TOPOLOGY: MongoDB client does not support sessions for transactional organization creation.');
      err.code = 'TRANSACTION_UNSUPPORTED_TOPOLOGY';
      throw err;
    }

    const lock = await acquireHierarchyLock('hierarchy_graph_mutex', database, { leaseMs, maxRetries, retryDelayMs });
    try {
      const session = client.startSession();
      try {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' }
        });

        // In-transaction lock touch
        const lockTouch = await database.collection('hierarchy_locks').findOneAndUpdate(
          {
            _id: 'hierarchy_graph_mutex',
            owner: lock.owner,
            fencingToken: lock.fencingToken,
            expiresAt: { $gt: new Date() }
          },
          { $set: { lastVerifiedAt: new Date() } },
          { session, returnDocument: 'after' }
        );

        if (!lockTouch) {
          const err = new Error('LEASE_EXPIRED: Hierarchy lock expired or stolen before organization creation.');
          err.code = 'LEASE_EXPIRED';
          throw err;
        }

        const linkValidation = await validateOrganizationLink(orgDoc.parentOrgId, orgDoc.id, database, { session });
        if (!linkValidation.valid) {
          const err = new Error(`${linkValidation.code}: ${linkValidation.error}`);
          err.code = linkValidation.code;
          throw err;
        }

        const docToInsert = {
          ...orgDoc,
          version: 1,
          lastFencingToken: lock.fencingToken,
          createdAt: orgDoc.createdAt || now,
          updatedAt: now
        };

        await database.collection('organizations').insertOne(docToInsert, { session });

        // Pre-commit lock check
        const finalLockCheck = await database.collection('hierarchy_locks').findOne(
          {
            _id: 'hierarchy_graph_mutex',
            owner: lock.owner,
            fencingToken: lock.fencingToken,
            expiresAt: { $gt: new Date() }
          },
          { session }
        );
        if (!finalLockCheck) {
          throw new Error('LEASE_EXPIRED_BEFORE_COMMIT: Lock expired before organization creation commit.');
        }

        await session.commitTransaction();
        return docToInsert;
      } catch (txErr) {
        try {
          await session.abortTransaction();
        } catch (_) {}
        throw txErr;
      } finally {
        await session.endSession();
      }
    } finally {
      await releaseHierarchyLock('hierarchy_graph_mutex', lock.owner, database);
    }
  } else {
    // Standalone organization (root trust, independent school)
    const docToInsert = {
      ...orgDoc,
      parentOrgId: null,
      version: 1,
      createdAt: orgDoc.createdAt || now,
      updatedAt: now
    };

    await database.collection('organizations').insertOne(docToInsert);
    return docToInsert;
  }
}

/**
 * Resolves full hierarchical branch tree for an Organization
 */
export async function resolveOrganizationBranches(orgId, database) {
  if (!orgId) return [];

  // 1. Gather all descendant organizations recursively
  const allOrgIds = [orgId];
  let toCheck = [orgId];

  while (toCheck.length > 0) {
    const children = await database.collection('organizations')
      .find({ parentOrgId: { $in: toCheck } })
      .project({ id: 1 })
      .toArray();

    const newChildrenIds = children.map(c => c.id).filter(id => !allOrgIds.includes(id));
    allOrgIds.push(...newChildrenIds);
    toCheck = newChildrenIds;
  }

  // 2. Fetch all branches / schools belonging to any organization in the tree
  const branches = await database.collection('tenants')
    .find({ orgId: { $in: allOrgIds } })
    .toArray();

  return branches;
}

export const resolveOrganizationTree = resolveOrganizationBranches;

/**
 * Checks if a Parent Organization Director is authorized to access a target school
 */
export async function isSchoolUnderOrganization(orgId, schoolId, database) {
  if (!orgId || !schoolId) return false;

  const targetSchool = await database.collection('tenants').findOne({ id: schoolId });
  if (!targetSchool || !targetSchool.orgId) return false;

  // Direct match
  if (targetSchool.orgId === orgId) return true;

  // Hierarchical match: check if targetSchool.orgId is a descendant of orgId
  const branches = await resolveOrganizationBranches(orgId, database);
  return branches.some(b => b.id === schoolId);
}

/**
 * Validates cross-tenant boundaries for multi-entity operations (e.g. Enrollment)
 * Guarantees that student, session, class, and section all belong to the caller's school.
 */
export async function validateEnrollmentBoundaries({
  schoolId,
  studentId,
  academicSessionId,
  classId,
  sectionId,
  database
}) {
  const violations = [];

  // 1. Verify Student belongs to this school
  const student = await database.collection('students').findOne({ id: studentId });
  if (!student) {
    violations.push(`Student [${studentId}] not found.`);
  } else if (student.schoolId !== schoolId) {
    violations.push(`CROSS_TENANT_VIOLATION: Student [${studentId}] belongs to school [${student.schoolId}], not [${schoolId}].`);
  }

  // 2. Verify Academic Session belongs to this school
  if (academicSessionId) {
    const session = await database.collection('academic_sessions').findOne({ id: academicSessionId });
    if (session && session.schoolId !== schoolId) {
      violations.push(`CROSS_TENANT_VIOLATION: Academic session [${academicSessionId}] belongs to school [${session.schoolId}], not [${schoolId}].`);
    }
  }

  // 3. Verify Class belongs to this school
  if (classId) {
    const classDoc = await database.collection('classes').findOne({ id: classId });
    if (classDoc && classDoc.schoolId !== schoolId) {
      violations.push(`CROSS_TENANT_VIOLATION: Class [${classId}] belongs to school [${classDoc.schoolId}], not [${schoolId}].`);
    }
  }

  // 4. Verify Section belongs to this school
  if (sectionId) {
    const sectionDoc = await database.collection('sections').findOne({ id: sectionId });
    if (sectionDoc && sectionDoc.schoolId !== schoolId) {
      violations.push(`CROSS_TENANT_VIOLATION: Section [${sectionId}] belongs to school [${sectionDoc.schoolId}], not [${schoolId}].`);
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Validates and links a Guardian to a Student
 * Supports multiple guardians per student, and multiple students per guardian.
 */
export async function linkGuardianToStudent({
  schoolId,
  studentId,
  guardianUserId,
  relationshipType,
  isPrimaryContact = false,
  canPickup = true,
  hasFinancialResponsibility = true,
  database
}) {
  // 1. Verify student exists in this tenant
  const student = await database.collection('students').findOne({ id: studentId, schoolId });
  if (!student) {
    throw new Error(`Student [${studentId}] not found in school [${schoolId}].`);
  }

  // 2. Verify guardian user exists
  const guardian = await database.collection('users').findOne({ id: guardianUserId });
  if (!guardian) {
    throw new Error(`Guardian user [${guardianUserId}] not found.`);
  }

  const linkId = `rel-${studentId}-${guardianUserId}`;

  // If setting this guardian as primary, demote any previous primary contact for this student
  if (isPrimaryContact) {
    await database.collection('guardian_relationships').updateMany(
      { studentId, schoolId },
      { $set: { isPrimaryContact: false } }
    );
  }

  const linkDoc = {
    id: linkId,
    schoolId,
    studentId,
    guardianUserId,
    relationshipType,
    isPrimaryContact,
    canPickup,
    hasFinancialResponsibility,
    updatedAt: new Date().toISOString()
  };

  await database.collection('guardian_relationships').updateOne(
    { id: linkId },
    { $set: linkDoc, $setOnInsert: { createdAt: new Date().toISOString() } },
    { upsert: true }
  );

  return linkDoc;
}
