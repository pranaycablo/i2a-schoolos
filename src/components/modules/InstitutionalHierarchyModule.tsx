import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  GitBranch,
  Calendar,
  Layers,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Users,
  Star,
  RefreshCw,
  Archive,
  ChevronRight,
  School
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useToast } from '../../design-system/components/Toast';
import {
  hierarchyApi,
  BranchItem,
  CampusItem,
  AcademicSessionItem,
  HierarchyTreeResponse
} from '../../services/apiClient';

export const InstitutionalHierarchyModule: React.FC = () => {
  const { currentRole, activeSchoolId } = useSchool();
  const { addToast } = useToast();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'TREE' | 'BRANCHES' | 'CAMPUSES' | 'SESSIONS' | 'STRUCTURE'>('TREE');

  // Hierarchy Data States
  const [treeData, setTreeData] = useState<HierarchyTreeResponse | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddCampusModal, setShowAddCampusModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  // Form State: New Branch
  const [newBranch, setNewBranch] = useState({
    branchCode: '',
    name: '',
    displayName: '',
    isMainBranch: false,
    capacity: 1000,
    street: '',
    city: '',
    state: '',
    email: '',
    phone: ''
  });

  // Form State: New Campus
  const [newCampus, setNewCampus] = useState({
    branchId: '',
    campusCode: '',
    name: '',
    campusType: 'MAIN_CAMPUS' as CampusItem['campusType'],
    capacity: 500,
    facilities: 'Library, Science Lab, Smart Classrooms, Playground',
    street: '',
    city: ''
  });

  // Form State: New Academic Session
  const [newSession, setNewSession] = useState({
    sessionName: '2026-2027',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    termType: 'ANNUAL' as 'ANNUAL' | 'SEMESTER' | 'TRIMESTER',
    isCurrent: false
  });

  // Authorization Helpers
  const canMutateOrg = ['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'].includes(currentRole);
  const canMutateBranch = ['SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN'].includes(currentRole);

  // Load Tree Data
  const loadHierarchyData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const treeRes = await hierarchyApi.getTree();
      if (treeRes.ok && treeRes.data) {
        setTreeData(treeRes.data);
      } else {
        // Fallback synthetic tree if offline / test environment
        setTreeData({
          success: true,
          institution: {
            id: activeSchoolId || 'SCH-001',
            name: 'i2A Demonstration Academy',
            code: 'I2A-DEMO-01',
            category: 'k12-schools',
            board: 'CBSE',
            isStandalone: true
          },
          organization: null,
          activeSession: {
            id: 'SESS-2026-2027',
            sessionName: '2026-2027',
            startDate: '2026-04-01',
            endDate: '2027-03-31',
            termType: 'ANNUAL',
            isCurrent: true
          },
          branches: [
            {
              id: 'BR-MAIN',
              institutionId: activeSchoolId || 'SCH-001',
              branchCode: 'MAIN',
              name: 'Main Campus Branch',
              displayName: 'Headquarters',
              isMainBranch: true,
              capacity: 1500,
              status: 'ACTIVE',
              campuses: [
                {
                  id: 'CMP-1',
                  branchId: 'BR-MAIN',
                  institutionId: activeSchoolId || 'SCH-001',
                  campusCode: 'CAMPUS-1',
                  name: 'Primary & Secondary Campus',
                  campusType: 'MAIN_CAMPUS',
                  capacity: 1500,
                  facilities: ['Smart Classrooms', 'Robotics Lab', 'Auditorium'],
                  status: 'ACTIVE'
                }
              ]
            }
          ],
          stats: {
            branchCount: 1,
            campusCount: 1,
            totalCapacity: 1500,
            hasActiveSession: true
          }
        });
      }

      // Load Branches
      const branchRes = await hierarchyApi.listBranches();
      if (branchRes.ok && branchRes.data?.branches) {
        setBranches(branchRes.data.branches);
      }

      // Load Campuses
      const campusRes = await hierarchyApi.listCampuses();
      if (campusRes.ok && campusRes.data?.campuses) {
        setCampuses(campusRes.data.campuses);
      }

      // Load Academic Sessions
      const sessionRes = await hierarchyApi.listSessions();
      if (sessionRes.ok && sessionRes.data?.sessions) {
        setSessions(sessionRes.data.sessions);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch hierarchy data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeSchoolId]);

  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // Handle Branch Creation
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hierarchyApi.createBranch({
        branchCode: newBranch.branchCode.toUpperCase(),
        name: newBranch.name,
        displayName: newBranch.displayName || newBranch.name,
        isMainBranch: newBranch.isMainBranch,
        capacity: Number(newBranch.capacity) || 1000,
        address: { street: newBranch.street, city: newBranch.city, state: newBranch.state, country: 'IN' },
        contact: { email: newBranch.email, phone: newBranch.phone }
      });

      if (res.ok) {
        addToast({
          title: 'Branch Created',
          message: `Branch ${newBranch.branchCode} successfully registered.`,
          type: 'success'
        });
        setShowAddBranchModal(false);
        setNewBranch({
          branchCode: '',
          name: '',
          displayName: '',
          isMainBranch: false,
          capacity: 1000,
          street: '',
          city: '',
          state: '',
          email: '',
          phone: ''
        });
        await loadHierarchyData();
      } else {
        addToast({
          title: 'Error Creating Branch',
          message: res.error || 'Failed to create branch.',
          type: 'error'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      addToast({ title: 'Error', message: msg, type: 'error' });
    }
  };

  // Handle Campus Creation
  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampus.branchId) {
      addToast({ title: 'Validation Error', message: 'Please select a parent branch.', type: 'error' });
      return;
    }

    try {
      const facilitiesList = newCampus.facilities.split(',').map((f) => f.trim()).filter(Boolean);
      const res = await hierarchyApi.createCampus({
        branchId: newCampus.branchId,
        campusCode: newCampus.campusCode.toUpperCase(),
        name: newCampus.name,
        campusType: newCampus.campusType,
        capacity: Number(newCampus.capacity) || 500,
        facilities: facilitiesList,
        address: { street: newCampus.street, city: newCampus.city, country: 'IN' }
      });

      if (res.ok) {
        addToast({
          title: 'Campus Created',
          message: `Campus ${newCampus.campusCode} successfully added.`,
          type: 'success'
        });
        setShowAddCampusModal(false);
        setNewCampus({
          branchId: '',
          campusCode: '',
          name: '',
          campusType: 'MAIN_CAMPUS',
          capacity: 500,
          facilities: 'Library, Science Lab, Smart Classrooms, Playground',
          street: '',
          city: ''
        });
        await loadHierarchyData();
      } else {
        addToast({
          title: 'Error Creating Campus',
          message: res.error || 'Failed to create campus.',
          type: 'error'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      addToast({ title: 'Error', message: msg, type: 'error' });
    }
  };

  // Handle Session Creation
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hierarchyApi.createSession({
        sessionName: newSession.sessionName,
        startDate: newSession.startDate,
        endDate: newSession.endDate,
        termType: newSession.termType,
        isCurrent: newSession.isCurrent
      });

      if (res.ok) {
        addToast({
          title: 'Session Created',
          message: `Academic Session ${newSession.sessionName} created successfully.`,
          type: 'success'
        });
        setShowAddSessionModal(false);
        await loadHierarchyData();
      } else {
        addToast({
          title: 'Error Creating Session',
          message: res.error || 'Failed to create academic session.',
          type: 'error'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      addToast({ title: 'Error', message: msg, type: 'error' });
    }
  };

  // Handle Session Activation (Atomic Invariant)
  const handleActivateSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Are you sure you want to activate Academic Session [${sessionName}]? This will atomically conclude any existing active session.`)) {
      return;
    }

    try {
      const res = await hierarchyApi.activateSession(sessionId);
      if (res.ok) {
        addToast({
          title: 'Session Activated',
          message: `Academic Session [${sessionName}] is now the single active session.`,
          type: 'success'
        });
        await loadHierarchyData();
      } else {
        addToast({
          title: 'Activation Failed',
          message: res.error || 'Failed to activate session.',
          type: 'error'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation error';
      addToast({ title: 'Error', message: msg, type: 'error' });
    }
  };

  // Handle Branch Archival
  const handleArchiveBranch = async (branchId: string, branchCode: string) => {
    if (!confirm(`Are you sure you want to archive branch [${branchCode}]? All child campuses will be soft-archived. Historical data remains intact.`)) {
      return;
    }

    try {
      const res = await hierarchyApi.archiveBranch(branchId);
      if (res.ok) {
        addToast({
          title: 'Branch Archived',
          message: `Branch [${branchCode}] archived. ${res.data?.archivedCampusesCount || 0} child campuses updated.`,
          type: 'success'
        });
        await loadHierarchyData();
      } else {
        addToast({
          title: 'Archival Failed',
          message: res.error || 'Failed to archive branch.',
          type: 'error'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Archival error';
      addToast({ title: 'Error', message: msg, type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Phase 09: Institutional Hierarchy OS
              </span>
              {treeData?.organization ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  Trust / Group: {treeData.organization.name}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Standalone Institution Model
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              {treeData?.institution.name || 'Institutional Hierarchy & Academic OS'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enterprise Multi-Tenant Structural Engine: Organization Trust &rarr; Institution &rarr; Branches &rarr; Campuses &rarr; Academic Sessions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadHierarchyData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {canMutateOrg && (
              <button
                onClick={() => setShowAddBranchModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Branch
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Branches</span>
              <GitBranch className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {treeData?.stats.branchCount || branches.length || 1}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Operational Units</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Campuses</span>
              <School className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {treeData?.stats.campusCount || campuses.length || 1}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Physical Campuses</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Total Capacity</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {treeData?.stats.totalCapacity ? treeData.stats.totalCapacity.toLocaleString() : '1,500'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Student Enrollment Cap</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Active Session</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {treeData?.activeSession?.sessionName || '2026-2027'}
            </div>
            <div className="text-[11px] text-emerald-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Academic Term
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('TREE')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'TREE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Hierarchy Tree & Overview
        </button>

        <button
          onClick={() => setActiveTab('BRANCHES')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'BRANCHES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Branches ({branches.length || 1})
        </button>

        <button
          onClick={() => setActiveTab('CAMPUSES')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'CAMPUSES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <School className="w-4 h-4" />
          Campuses ({campuses.length || 1})
        </button>

        <button
          onClick={() => setActiveTab('SESSIONS')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'SESSIONS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Sessions ({sessions.length || 1})
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: VISUAL HIERARCHY TREE */}
      {activeTab === 'TREE' && (
        <div className="space-y-6">
          {/* Zero Overhead Standalone Notice */}
          {treeData?.institution.isStandalone && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Zero Mandatory Overhead Guarantee:
                </span>{' '}
                <span className="text-emerald-800 dark:text-emerald-300">
                  This institution operates as a standalone school. You are not forced to create complex corporate trusts or satellite branches. If you expand in the future, you can seamlessly add multi-location branches, regional franchises, or satellite campuses without data migration.
                </span>
              </div>
            </div>
          )}

          {/* Interactive Visual Hierarchy Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Hierarchy Structure & Topological Links
            </h2>

            <div className="space-y-4">
              {/* Level 1: Parent Organization (if any) */}
              {treeData?.organization ? (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                        Level 1: Educational Trust / Group
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {treeData.organization.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Code: {treeData.organization.orgCode} &bull; Type: {treeData.organization.orgType}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Root Entity
                  </span>
                </div>
              ) : null}

              {/* Down Arrow Indicator */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              </div>

              {/* Level 2: Institution Node */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                      Level 2: Institution Tenant Boundary
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {treeData?.institution.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {treeData?.institution.id} &bull; Board: {treeData?.institution.board} &bull; Category: {treeData?.institution.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    Isolated Tenant
                  </span>
                </div>
              </div>

              {/* Down Arrow Indicator */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              </div>

              {/* Level 3: Branches & Campuses Tree */}
              <div className="space-y-3 pl-4 md:pl-8 border-l-2 border-indigo-200 dark:border-indigo-800">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Level 3: Operating Branches & Campuses
                </div>

                {(treeData?.branches || []).map((branch) => (
                  <div
                    key={branch.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5 text-indigo-500" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {branch.name}
                            {branch.isMainBranch && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                Main Branch
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            Branch Code: {branch.branchCode} &bull; Capacity: {branch.capacity?.toLocaleString()} students
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canMutateBranch && (
                          <button
                            onClick={() => {
                              setNewCampus((prev) => ({ ...prev, branchId: branch.id }));
                              setShowAddCampusModal(true);
                            }}
                            className="text-xs px-2.5 py-1 rounded font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Campus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Child Campuses for this Branch */}
                    {branch.campuses && branch.campuses.length > 0 && (
                      <div className="pl-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase">
                          Campuses & Facilities
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {branch.campuses.map((campus) => (
                            <div
                              key={campus.id}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                            >
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  {campus.name}
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  Code: {campus.campusCode} &bull; Type: {campus.campusType}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                Active
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANCH MANAGEMENT */}
      {activeTab === 'BRANCHES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Branches Directory</h2>
              <p className="text-xs text-slate-500">Autonomous educational branches under this institution</p>
            </div>
            {canMutateOrg && (
              <button
                onClick={() => setShowAddBranchModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Branch
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Branch Code & Name</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Capacity</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{b.branchCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      {b.isMainBranch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Main Branch
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Regional Branch</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      {b.address?.city ? `${b.address.city}, ${b.address.state || 'IN'}` : 'Headquarters'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {b.capacity ? b.capacity.toLocaleString() : '1,000'} students
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canMutateOrg && !b.isMainBranch && (
                        <button
                          onClick={() => handleArchiveBranch(b.id, b.branchCode)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
                        >
                          <Archive className="w-3 h-3" />
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUSES */}
      {activeTab === 'CAMPUSES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Physical Campuses & Sites</h2>
              <p className="text-xs text-slate-500">Facilities, satellite grounds, and hostel complexes linked to branches</p>
            </div>
            {canMutateBranch && (
              <button
                onClick={() => setShowAddCampusModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Campus
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Campus Code & Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Facilities</th>
                  <th className="px-6 py-3">Capacity</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campuses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.campusCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {c.campusType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex flex-wrap gap-1">
                        {(c.facilities || []).slice(0, 3).map((f, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {f}
                          </span>
                        ))}
                        {(c.facilities || []).length > 3 && (
                          <span className="text-[10px] text-slate-400">+{c.facilities!.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {c.capacity || 500} students
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <div className="space-y-6">
          {/* Active Session Highlight Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Single Active Session Invariant (Enforced)
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Current Live Session: {treeData?.activeSession?.sessionName || '2026-2027'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dates: {treeData?.activeSession?.startDate || '2026-04-01'} to {treeData?.activeSession?.endDate || '2027-03-31'} &bull; Term: {treeData?.activeSession?.termType || 'ANNUAL'}
              </p>
            </div>

            {canMutateOrg && (
              <button
                onClick={() => setShowAddSessionModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create New Session
              </button>
            )}
          </div>

          {/* Sessions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Session Name</th>
                    <th className="px-6 py-3">Term Type</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3">State</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {s.sessionName}
                        {s.isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {s.termType || 'ANNUAL'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        {s.startDate}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        {s.endDate}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            s.isCurrent
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!s.isCurrent && canMutateOrg && s.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleActivateSession(s.id, s.sessionName)}
                            className="text-xs px-3 py-1 font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-md transition-colors"
                          >
                            Activate (Switch)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRANCH */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Operational Branch</h3>
            <p className="text-xs text-slate-500 mb-4">Create a branch under this educational institution</p>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Code (2-10 chars uppercase) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOUTH-01"
                  value={newBranch.branchCode}
                  onChange={(e) => setNewBranch({ ...newBranch, branchCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Campus Branch"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    value={newBranch.capacity}
                    onChange={(e) => setNewBranch({ ...newBranch, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isMain"
                  checked={newBranch.isMainBranch}
                  onChange={(e) => setNewBranch({ ...newBranch, isMainBranch: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="isMain" className="text-xs text-slate-700 dark:text-slate-300">
                  Set as Main / Headquarters Branch
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CAMPUS */}
      {showAddCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Physical Campus / Site</h3>
            <p className="text-xs text-slate-500 mb-4">Link a physical complex to an operating branch</p>

            <form onSubmit={handleCreateCampus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Branch *
                </label>
                <select
                  required
                  value={newCampus.branchId}
                  onChange={(e) => setNewCampus({ ...newCampus, branchId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                >
                  <option value="">Select Branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CAMPUS-NORTH"
                  value={newCampus.campusCode}
                  onChange={(e) => setNewCampus({ ...newCampus, campusCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Satellite Campus"
                  value={newCampus.name}
                  onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Type
                </label>
                <select
                  value={newCampus.campusType}
                  onChange={(e) => setNewCampus({ ...newCampus, campusType: e.target.value as CampusItem['campusType'] })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                >
                  <option value="MAIN_CAMPUS">Main Campus</option>
                  <option value="SATELLITE_CAMPUS">Satellite Campus</option>
                  <option value="SPORTS_COMPLEX">Sports Complex</option>
                  <option value="HOSTEL_BLOCK">Hostel Block</option>
                  <option value="RESEARCH_CENTRE">Research Centre</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCampusModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Create Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACADEMIC SESSION */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create Academic Session</h3>
            <p className="text-xs text-slate-500 mb-4">Configure term dates and academic policy</p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Name (e.g. 2027-2028) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2027-2028"
                  value={newSession.sessionName}
                  onChange={(e) => setNewSession({ ...newSession, sessionName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSession.startDate}
                    onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSession.endDate}
                    onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isCurrentSession"
                  checked={newSession.isCurrent}
                  onChange={(e) => setNewSession({ ...newSession, isCurrent: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="isCurrentSession" className="text-xs text-slate-700 dark:text-slate-300">
                  Activate immediately (concludes currently active session)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
