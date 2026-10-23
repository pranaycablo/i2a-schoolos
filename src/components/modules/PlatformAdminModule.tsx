import React, { useState, useEffect, useCallback } from 'react';
import { useSchool, SchoolTenant, SchoolTenantLocation } from '../../context/SchoolContext';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Activity,
  DollarSign,
  UserCheck,
  Globe,
  Settings,
  RefreshCw,
  Plus,
  MapPin,
  GitBranch,
  X,
  ChevronRight,
  Eye,
  Edit3,
  Mail,
  Phone
} from 'lucide-react';
import { ApplicationVerificationConsole } from '../admin/ApplicationVerificationConsole';
import { hierarchyApi, BranchItem } from '../../services/apiClient';

export const PlatformAdminModule: React.FC = () => {
  const {
    tenants,
    onboardSchool,
    updateSchoolLocation,
    toggleSchoolSuspension,
    subscriptionPlans,
    loginToSchool,
    returnToPublicSaas,
    schoolApplications,
    syncWithBackend,
    isSyncing
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'REGISTERED_SCHOOLS' | 'VERIFICATION_QUEUE' | 'BRANCH_MONITOR'>('REGISTERED_SCHOOLS');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBoard, setFilterBoard] = useState<string>('ALL');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolTenant | null>(null);
  const [schoolBranches, setSchoolBranches] = useState<BranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [allBranches, setAllBranches] = useState<BranchItem[]>([]);

  // Add Branch Modal for selected school
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    branchCode: '',
    name: '',
    displayName: '',
    isMainBranch: false,
    capacity: 1000,
    street: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Edit Location Modal for selected school
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [editLocationData, setEditLocationData] = useState<SchoolTenantLocation>({
    street: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    postalCode: '',
    country: 'IN',
    latitude: null,
    longitude: null
  });

  // Onboard New School Form State
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    code: '',
    board: 'CBSE' as 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB',
    category: 'k12-schools',
    planId: 'PROFESSIONAL' as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    billingCycle: 'YEARLY' as 'MONTHLY' | 'YEARLY',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    street: '',
    locality: '',
    city: '',
    district: '',
    state: 'Bihar',
    postalCode: '',
    country: 'IN',
    latitude: '',
    longitude: '',
    initialBranchCode: 'MAIN',
    initialBranchName: '',
    initialBranchCapacity: 1000
  });
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  // Statistics
  const totalSchools = tenants.length;
  const activeSchools = tenants.filter((t) => t.subscriptionStatus === 'ACTIVE' || t.subscriptionStatus === 'TRIAL').length;
  const suspendedSchools = tenants.filter((t) => t.subscriptionStatus === 'SUSPENDED').length;
  const pendingApplications = schoolApplications.filter((a) => a.status === 'PENDING_VERIFICATION' || a.status === 'DOCS_REVIEWED');
  const totalBranchesCount = tenants.reduce((acc, t) => acc + (t.branchCount || (t.branches?.length ?? 1)), 0);

  const totalMRR = tenants.reduce((acc, t) => {
    const plan = subscriptionPlans.find((p) => p.id === t.planId);
    return acc + (plan ? plan.monthlyPrice : 0);
  }, 0);

  // Load branches for a selected school
  const loadBranchesForSchool = useCallback(async (schoolId: string) => {
    setLoadingBranches(true);
    try {
      const res = await hierarchyApi.listBranches({ institutionId: schoolId });
      if (res.ok && res.data?.branches) {
        setSchoolBranches(res.data.branches);
      } else {
        // Fallback to tenant.branches in local state
        const t = tenants.find((item) => item.id === schoolId);
        if (t?.branches) {
          setSchoolBranches(t.branches as BranchItem[]);
        } else {
          setSchoolBranches([]);
        }
      }
    } catch {
      const t = tenants.find((item) => item.id === schoolId);
      setSchoolBranches((t?.branches as BranchItem[]) || []);
    } finally {
      setLoadingBranches(false);
    }
  }, [tenants]);

  // Load all branches for global branch monitor tab
  const loadAllBranches = useCallback(async () => {
    try {
      const res = await hierarchyApi.listBranches();
      if (res.ok && res.data?.branches) {
        setAllBranches(res.data.branches);
      }
    } catch {
      // Gather from tenants
      const aggregated: BranchItem[] = [];
      for (const t of tenants) {
        if (t.branches) {
          aggregated.push(...(t.branches as BranchItem[]));
        }
      }
      setAllBranches(aggregated);
    }
  }, [tenants]);

  useEffect(() => {
    if (activeTab === 'BRANCH_MONITOR') {
      loadAllBranches();
    }
  }, [activeTab, loadAllBranches]);

  useEffect(() => {
    if (selectedSchool) {
      loadBranchesForSchool(selectedSchool.id);
    }
  }, [selectedSchool, loadBranchesForSchool]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // Filtered Schools
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.location?.district && t.location.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.subscriptionStatus === filterStatus;
    const matchesBoard = filterBoard === 'ALL' || t.board === filterBoard;
    return matchesSearch && matchesStatus && matchesBoard;
  });

  // Handle Onboard New School Submission
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);

    // Form Validations
    if (!onboardForm.name.trim()) {
      setOnboardError('School name is required.');
      return;
    }
    if (!onboardForm.adminName.trim()) {
      setOnboardError('Administrator name is required.');
      return;
    }
    if (!onboardForm.adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboardForm.adminEmail.trim())) {
      setOnboardError('Please provide a valid official administrator email address.');
      return;
    }
    if (!onboardForm.adminPhone.trim() || onboardForm.adminPhone.trim().length < 8) {
      setOnboardError('Please provide a valid administrator telephone number (min 8 digits).');
      return;
    }
    if (!onboardForm.city.trim() || !onboardForm.state.trim()) {
      setOnboardError('School City and State are required.');
      return;
    }

    // Coordinates Validation
    const lat = onboardForm.latitude.trim() ? Number(onboardForm.latitude.trim()) : null;
    const lng = onboardForm.longitude.trim() ? Number(onboardForm.longitude.trim()) : null;
    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      setOnboardError('Latitude must be a valid coordinate between -90 and +90.');
      return;
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      setOnboardError('Longitude must be a valid coordinate between -180 and +180.');
      return;
    }

    setOnboardSubmitting(true);
    try {
      const res = await onboardSchool({
        name: onboardForm.name.trim(),
        code: onboardForm.code.trim() || undefined,
        board: onboardForm.board,
        category: onboardForm.category,
        planId: onboardForm.planId,
        billingCycle: onboardForm.billingCycle,
        adminName: onboardForm.adminName.trim(),
        adminEmail: onboardForm.adminEmail.trim(),
        adminPhone: onboardForm.adminPhone.trim(),
        address: {
          street: onboardForm.street.trim(),
          locality: onboardForm.locality.trim(),
          city: onboardForm.city.trim(),
          district: onboardForm.district.trim(),
          state: onboardForm.state.trim(),
          postalCode: onboardForm.postalCode.trim(),
          country: onboardForm.country.trim() || 'IN',
          latitude: lat,
          longitude: lng,
          isGeocoded: Boolean(lat && lng)
        },
        initialBranch: {
          branchCode: onboardForm.initialBranchCode.trim() || 'MAIN',
          name: onboardForm.initialBranchName.trim() || `${onboardForm.name.trim()} (Main Campus)`,
          capacity: Number(onboardForm.initialBranchCapacity) || 1000
        }
      });

      if (res.success && res.tenant) {
        showNotification(`✅ School "${res.tenant.name}" (${res.tenant.id}) successfully onboarded with verified location!`);
        setShowOnboardModal(false);
        // Reset form
        setOnboardForm({
          name: '',
          code: '',
          board: 'CBSE',
          category: 'k12-schools',
          planId: 'PROFESSIONAL',
          billingCycle: 'YEARLY',
          adminName: '',
          adminEmail: '',
          adminPhone: '',
          street: '',
          locality: '',
          city: '',
          district: '',
          state: 'Bihar',
          postalCode: '',
          country: 'IN',
          latitude: '',
          longitude: '',
          initialBranchCode: 'MAIN',
          initialBranchName: '',
          initialBranchCapacity: 1000
        });
      } else {
        setOnboardError(res.error || 'Failed to onboard school. Please verify inputs.');
      }
    } catch (err) {
      setOnboardError(err instanceof Error ? err.message : 'Network error during school onboarding.');
    } finally {
      setOnboardSubmitting(false);
    }
  };

  // Open School Detail View
  const handleOpenSchoolDetail = (school: SchoolTenant) => {
    setSelectedSchool(school);
    loadBranchesForSchool(school.id);
    setEditLocationData({
      street: school.location?.street || '',
      locality: school.location?.locality || '',
      city: school.location?.city || school.city || '',
      district: school.location?.district || '',
      state: school.location?.state || 'Bihar',
      postalCode: school.location?.postalCode || '',
      country: school.location?.country || 'IN',
      latitude: school.location?.latitude ?? null,
      longitude: school.location?.longitude ?? null
    });
  };

  // Handle Save School Location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    const lat = editLocationData.latitude !== null && editLocationData.latitude !== undefined && editLocationData.latitude !== ('' as any)
      ? Number(editLocationData.latitude)
      : null;
    const lng = editLocationData.longitude !== null && editLocationData.longitude !== undefined && editLocationData.longitude !== ('' as any)
      ? Number(editLocationData.longitude)
      : null;

    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      alert('Latitude must be between -90 and +90.');
      return;
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      alert('Longitude must be between -180 and +180.');
      return;
    }

    const payload: SchoolTenantLocation = {
      ...editLocationData,
      latitude: lat,
      longitude: lng,
      isGeocoded: Boolean(lat && lng)
    };

    const res = await updateSchoolLocation(selectedSchool.id, payload);
    if (res.success) {
      setSelectedSchool((prev) => prev ? { ...prev, location: payload, city: payload.city || prev.city } : null);
      setShowEditLocationModal(false);
      showNotification(`📍 Location updated for ${selectedSchool.name}.`);
    } else {
      alert(res.error || 'Failed to update school location.');
    }
  };

  // Handle Add Branch to Selected School
  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    if (!newBranchData.branchCode.trim() || !newBranchData.name.trim()) {
      alert('Branch Code and Branch Name are required.');
      return;
    }

    const lat = newBranchData.latitude.trim() ? Number(newBranchData.latitude.trim()) : null;
    const lng = newBranchData.longitude.trim() ? Number(newBranchData.longitude.trim()) : null;
    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      alert('Branch Latitude must be between -90 and +90.');
      return;
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      alert('Branch Longitude must be between -180 and +180.');
      return;
    }

    try {
      const res = await hierarchyApi.createBranch({
        institutionId: selectedSchool.id,
        branchCode: newBranchData.branchCode.trim().toUpperCase(),
        name: newBranchData.name.trim(),
        displayName: newBranchData.displayName.trim() || newBranchData.name.trim(),
        isMainBranch: newBranchData.isMainBranch,
        capacity: Number(newBranchData.capacity) || 1000,
        address: {
          street: newBranchData.street.trim(),
          locality: newBranchData.locality.trim(),
          city: newBranchData.city.trim() || selectedSchool.city,
          district: newBranchData.district.trim() || selectedSchool.location?.district || '',
          state: newBranchData.state.trim() || selectedSchool.location?.state || 'Bihar',
          postalCode: newBranchData.postalCode.trim(),
          country: 'IN',
          latitude: lat,
          longitude: lng
        },
        contact: {
          principalName: newBranchData.contactName.trim(),
          email: newBranchData.contactEmail.trim(),
          phone: newBranchData.contactPhone.trim()
        }
      });

      if (res.ok && res.data?.branch) {
        showNotification(`🌿 New Branch "${res.data.branch.name}" created for ${selectedSchool.name}!`);
        setShowAddBranchModal(false);
        setNewBranchData({
          branchCode: '',
          name: '',
          displayName: '',
          isMainBranch: false,
          capacity: 1000,
          street: '',
          locality: '',
          city: '',
          district: '',
          state: '',
          postalCode: '',
          latitude: '',
          longitude: '',
          contactName: '',
          contactEmail: '',
          contactPhone: ''
        });
        loadBranchesForSchool(selectedSchool.id);
        syncWithBackend();
      } else {
        alert(res.error || 'Failed to create branch.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating branch');
    }
  };

  // Toggle Branch Status (Active / Inactive)
  const handleToggleBranchStatus = async (branch: BranchItem) => {
    const nextStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await hierarchyApi.updateBranch(branch.id, { status: nextStatus as any });
      if (res.ok) {
        showNotification(`Branch "${branch.name}" status changed to ${nextStatus}.`);
        if (selectedSchool) loadBranchesForSchool(selectedSchool.id);
        loadAllBranches();
      } else {
        alert(res.error || 'Failed to update branch status');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error toggling branch status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 text-xs text-slate-100">
      {/* Platform Header & Summary Dashboard */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-7 rounded-3xl space-y-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  i2A Platform Central Operator Console
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Global Multi-Tenant Control, School Directory, Multi-Campus Branches & Verification Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <Plus className="w-4 h-4" /> Add New School
            </button>
            <button
              onClick={() => syncWithBackend()}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors flex items-center gap-2 cursor-pointer"
              title="Synchronize real-time state with backend"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={returnToPublicSaas}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold transition-colors cursor-pointer"
            >
              Exit to SaaS Homepage
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-2">
          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-slate-400 font-semibold text-[11px] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Total Schools
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{totalSchools}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Standalone & Groups</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active Tenants
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1.5">{activeSchools}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{suspendedSchools} Suspended</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-cyan-400 font-semibold text-[11px] flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" /> Total Campuses
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-1.5">{totalBranchesCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across All Schools</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-amber-400 font-semibold text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Apps
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{pendingApplications.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Verification Queue</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl col-span-2 sm:col-span-1">
            <div className="text-indigo-400 font-semibold text-[11px] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Platform MRR
            </div>
            <div className="text-2xl font-black text-white mt-1.5">₹{totalMRR.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active Subscriptions</div>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between animate-fade-in shadow-xl ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600/70 text-emerald-200'
              : 'bg-rose-950/90 border-rose-600/70 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 font-bold">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="hover:text-white font-bold ml-4 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl w-fit border border-slate-800 shadow-md overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('REGISTERED_SCHOOLS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'REGISTERED_SCHOOLS'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> Multi-Tenant School Directory ({totalSchools})
        </button>

        <button
          onClick={() => setActiveTab('BRANCH_MONITOR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'BRANCH_MONITOR'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4" /> All Branches & Campuses ({totalBranchesCount})
        </button>

        <button
          onClick={() => setActiveTab('VERIFICATION_QUEUE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer relative ${
            activeTab === 'VERIFICATION_QUEUE'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Applications ({pendingApplications.length})
          {pendingApplications.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'VERIFICATION_QUEUE' ? (
        <ApplicationVerificationConsole />
      ) : activeTab === 'BRANCH_MONITOR' ? (
        /* Global Branch & Campus Governance Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" /> Global Branch & Campus Inventory
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Centralized monitoring of all campuses across independent schools and multi-branch educational trusts.
              </p>
            </div>
            <button
              onClick={loadAllBranches}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Branches
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="p-3.5">Branch Code & Name</th>
                  <th className="p-3.5">Parent School ID</th>
                  <th className="p-3.5">Type & Role</th>
                  <th className="p-3.5">Campus Location</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {allBranches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No branches found. Click on any school in the School Directory to add a branch.
                    </td>
                  </tr>
                ) : (
                  allBranches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-xs">
                            {b.branchCode.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-white font-extrabold">{b.name}</div>
                            <span className="font-mono text-[10px] text-cyan-400">{b.branchCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-indigo-400 font-semibold">{b.institutionId}</td>
                      <td className="p-3.5">
                        {b.isMainBranch ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-extrabold text-[10px]">
                            MAIN CAMPUS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                            BRANCH CAMPUS
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {b.address?.city || 'City'}, {b.address?.state || 'State'}
                            {b.address?.postalCode ? ` - ${b.address.postalCode}` : ''}
                          </span>
                        </div>
                        {b.address?.latitude && b.address?.longitude && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Lat: {b.address.latitude}, Lng: {b.address.longitude}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{b.capacity || 1000} students</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleBranchStatus(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] border border-slate-700 cursor-pointer"
                        >
                          {b.status === 'ACTIVE' ? 'Set Inactive' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Registered Schools Directory Tab */
        <div className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by school name, ID (e.g. I2A-SCH-000001), city, district, or admin email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium text-[11px]">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium text-[11px]">Board:</span>
                <select
                  value={filterBoard}
                  onChange={(e) => setFilterBoard(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Boards</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="STATE_BOARD">State Board</option>
                  <option value="IB">IB</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Multi-Tenant Registered Schools Directory ({filteredTenants.length})
              </h3>
              <span className="text-[11px] text-slate-400">Click any row or Manage Branches to view/edit branches</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="p-4">School ID & Name</th>
                    <th className="p-4">Board & Affiliation</th>
                    <th className="p-4">Official Location</th>
                    <th className="p-4">Branches</th>
                    <th className="p-4">Administrator Contact</th>
                    <th className="p-4">Plan & Status</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No schools matched your search criteria. Click "+ Add New School" to onboard a school.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => {
                      const isSuspended = t.subscriptionStatus === 'SUSPENDED';
                      const branchCount = t.branchCount ?? (t.branches?.length || 1);

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-semibold">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-indigo-950 text-indigo-400 font-black flex items-center justify-center shrink-0 border border-indigo-800">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-extrabold text-white hover:text-indigo-300 transition-colors cursor-pointer" onClick={() => handleOpenSchoolDetail(t)}>
                                  {t.name}
                                </div>
                                <span className="font-mono text-[10px] text-indigo-400 font-bold">{t.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-bold text-[10px] border border-slate-700">
                              {t.board}
                            </span>
                            <div className="text-slate-400 text-[11px] mt-0.5">{t.category || 'K-12 School'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-200 text-[11px] font-semibold flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>{t.city}, {t.location?.state || 'India'}</span>
                            </div>
                            <div className="text-slate-500 text-[10px] pl-4">
                              {t.location?.district ? `${t.location.district} District` : ''}
                              {t.location?.postalCode ? ` - ${t.location.postalCode}` : ''}
                            </div>
                            {t.location?.latitude && t.location?.longitude && (
                              <div className="pl-4 text-[9px] text-emerald-400 font-mono">
                                Lat: {t.location.latitude}, Lng: {t.location.longitude}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleOpenSchoolDetail(t)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer"
                            >
                              <GitBranch className="w-3 h-3 text-cyan-400" />
                              <span>{branchCount} {branchCount === 1 ? 'Branch' : 'Branches'}</span>
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-200">{t.adminName}</div>
                            <div className="text-slate-400 text-[11px]">{t.adminEmail}</div>
                            <div className="text-slate-500 text-[10px]">{t.adminPhone}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-white text-[11px]">{t.planName}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase w-fit ${
                                  t.subscriptionStatus === 'ACTIVE'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                    : t.subscriptionStatus === 'TRIAL'
                                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                                    : t.subscriptionStatus === 'SUSPENDED'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                                }`}
                              >
                                {t.subscriptionStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[11px]">{t.registeredAt}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleOpenSchoolDetail(t)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 cursor-pointer flex items-center gap-1"
                                title="Manage Branches & Campus Locations"
                              >
                                <GitBranch className="w-3 h-3 text-cyan-400" /> Branches
                              </button>

                              <button
                                onClick={() => loginToSchool(t.id, 'PRINCIPAL')}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold text-[11px] border border-indigo-800 cursor-pointer"
                              >
                                Open Portal
                              </button>

                              <button
                                onClick={() => toggleSchoolSuspension(t.id)}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                                  isSuspended
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {isSuspended ? 'Reactivate' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden space-y-3">
            {filteredTenants.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                No schools found matching search criteria.
              </div>
            ) : (
              filteredTenants.map((t) => {
                const isSuspended = t.subscriptionStatus === 'SUSPENDED';
                const branchCount = t.branchCount ?? (t.branches?.length || 1);

                return (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 font-black flex items-center justify-center border border-indigo-800 shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{t.name}</h4>
                          <span className="font-mono text-[10px] text-indigo-400 font-bold">{t.id}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                          t.subscriptionStatus === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : t.subscriptionStatus === 'TRIAL'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                            : t.subscriptionStatus === 'SUSPENDED'
                            ? 'bg-rose-950 text-rose-300 border border-rose-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}
                      >
                        {t.subscriptionStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Location:</span>
                        <span className="font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                          {t.city}, {t.location?.state || 'India'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Campuses / Branches:</span>
                        <button
                          onClick={() => handleOpenSchoolDetail(t)}
                          className="font-bold text-cyan-400 flex items-center gap-1 mt-0.5 underline cursor-pointer"
                        >
                          <GitBranch className="w-3 h-3 text-cyan-400" />
                          {branchCount} {branchCount === 1 ? 'Branch' : 'Branches'}
                        </button>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">Admin Contact:</span>
                        <span className="text-slate-300 font-medium">{t.adminName} ({t.adminEmail})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenSchoolDetail(t)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-cyan-400" /> Branches
                      </button>
                      <button
                        onClick={() => loginToSchool(t.id, 'PRINCIPAL')}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                      >
                        Portal
                      </button>
                      <button
                        onClick={() => toggleSchoolSuspension(t.id)}
                        className={`px-3 py-2.5 rounded-xl font-bold text-xs cursor-pointer border ${
                          isSuspended
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Onboard New School Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 animate-fade-in relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-[11px] uppercase tracking-wider">
                <Building2 className="w-4 h-4" /> i2A Platform Direct Onboarding
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Onboard & Register New School
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Provisions a dedicated multi-tenant school entity, verified physical location, and initial main branch campus.
              </p>
            </div>

            {onboardError && (
              <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-600/70 text-rose-200 flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{onboardError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              {/* Section A: School Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                  1. School Legal Identity & Affiliation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      Official School Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Jude World Academy"
                      value={onboardForm.name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      Board Affiliation
                    </label>
                    <select
                      value={onboardForm.board}
                      onChange={(e) => setOnboardForm({ ...onboardForm, board: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="CBSE">CBSE (Central Board)</option>
                      <option value="ICSE">ICSE / ISC</option>
                      <option value="STATE_BOARD">State Board</option>
                      <option value="IB">International Baccalaureate (IB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      Subscription Plan
                    </label>
                    <select
                      value={onboardForm.planId}
                      onChange={(e) => setOnboardForm({ ...onboardForm, planId: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="STARTER">Starter Plan (Up to 500 Students)</option>
                      <option value="PROFESSIONAL">Professional Plan (Up to 1500 Students)</option>
                      <option value="ENTERPRISE">Enterprise Plan (Unlimited Campuses)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section B: Administrator Contact */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                  2. School Principal / Administrator Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      Admin Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh Sharma"
                      value={onboardForm.adminName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      Official Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="principal@school.edu.in"
                      value={onboardForm.adminEmail}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={onboardForm.adminPhone}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section C: School Location */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>3. School Official Location & Geotag</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">Lat (-90..90) / Lng (-180..180)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Street / Road Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 14 Bailey Road, Near Golf Course"
                      value={onboardForm.street}
                      onChange={(e) => setOnboardForm({ ...onboardForm, street: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Locality / Colony</label>
                    <input
                      type="text"
                      placeholder="e.g. Shastri Nagar"
                      value={onboardForm.locality}
                      onChange={(e) => setOnboardForm({ ...onboardForm, locality: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      City / Town <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patna"
                      value={onboardForm.city}
                      onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">District</label>
                    <input
                      type="text"
                      placeholder="e.g. Patna"
                      value={onboardForm.district}
                      onChange={(e) => setOnboardForm({ ...onboardForm, district: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bihar"
                      value={onboardForm.state}
                      onChange={(e) => setOnboardForm({ ...onboardForm, state: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">PIN / Postal Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 800001"
                      value={onboardForm.postalCode}
                      onChange={(e) => setOnboardForm({ ...onboardForm, postalCode: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Latitude (-90 to +90)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 25.5941"
                      value={onboardForm.latitude}
                      onChange={(e) => setOnboardForm({ ...onboardForm, latitude: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Longitude (-180 to +180)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 85.1376"
                      value={onboardForm.longitude}
                      onChange={(e) => setOnboardForm({ ...onboardForm, longitude: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section D: Initial Branch */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                  4. Initial Main Branch Campus
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Main Branch Code</label>
                    <input
                      type="text"
                      placeholder="MAIN"
                      value={onboardForm.initialBranchCode}
                      onChange={(e) => setOnboardForm({ ...onboardForm, initialBranchCode: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Campus Display Name</label>
                    <input
                      type="text"
                      placeholder="Main Campus (Headquarters)"
                      value={onboardForm.initialBranchName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, initialBranchName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {onboardSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning School...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Complete School Onboarding
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: School Detail & Branch Management Drawer */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full my-8 space-y-6 animate-fade-in relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setSelectedSchool(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 font-black text-lg flex items-center justify-center border border-indigo-800 shrink-0">
                  {selectedSchool.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedSchool.name}</h2>
                  <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5 flex-wrap">
                    <span className="font-mono text-indigo-400 font-bold">{selectedSchool.id}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-300">{selectedSchool.board} Board</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{selectedSchool.planName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddBranchModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Branch
                </button>
                <button
                  onClick={() => loginToSchool(selectedSchool.id, 'PRINCIPAL')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer"
                >
                  Open Portal
                </button>
              </div>
            </div>

            {/* School Location Details Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" /> Official Registered Location
                </h4>
                <button
                  onClick={() => setShowEditLocationModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit Location
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Street & Colony</span>
                  <span className="text-slate-200 font-medium">
                    {selectedSchool.location?.street || 'Not specified'}
                    {selectedSchool.location?.locality ? `, ${selectedSchool.location.locality}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">City, District & State</span>
                  <span className="text-slate-200 font-medium">
                    {selectedSchool.location?.city || selectedSchool.city}, {selectedSchool.location?.district || ''} ({selectedSchool.location?.state || 'India'})
                    {selectedSchool.location?.postalCode ? ` - ${selectedSchool.location.postalCode}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Geocoded Coordinates</span>
                  {selectedSchool.location?.latitude && selectedSchool.location?.longitude ? (
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {selectedSchool.location.latitude}, {selectedSchool.location.longitude}
                    </span>
                  ) : (
                    <span className="text-amber-400 text-[11px]">Manual Address Entry (No GPS Pin)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Multi-Branch Inventory for this School */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-white text-sm flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" /> Registered Branches & Campuses ({schoolBranches.length})
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Multi-campus architecture strictly isolated to {selectedSchool.name}.
                  </p>
                </div>
                {loadingBranches && <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />}
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {schoolBranches.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-slate-400 text-xs">
                    No branches registered yet for this school. Click "+ Add Branch" above.
                  </div>
                ) : (
                  schoolBranches.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-sm">{b.name}</span>
                          <span className="font-mono text-cyan-400 font-extrabold text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                            {b.branchCode}
                          </span>
                          {b.isMainBranch && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[9px] font-extrabold uppercase">
                              MAIN CAMPUS
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              b.status === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-amber-950 text-amber-300 border border-amber-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div className="text-slate-400 text-xs flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {b.address?.street ? `${b.address.street}, ` : ''}
                            {b.address?.city || selectedSchool.city}, {b.address?.state || 'India'}
                            {b.address?.postalCode ? ` - ${b.address.postalCode}` : ''}
                          </span>
                          {b.address?.latitude && b.address?.longitude && (
                            <span className="font-mono text-emerald-400 text-[10px] ml-1">
                              ({b.address.latitude}, {b.address.longitude})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleBranchStatus(b)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
                        >
                          {b.status === 'ACTIVE' ? 'Set Inactive' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Branch to School Modal */}
      {showAddBranchModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full my-8 space-y-5 animate-fade-in relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowAddBranchModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-cyan-400 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" /> Multi-Branch Provisioning
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Add Campus Branch to {selectedSchool.name}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Creates an independent campus node linked strictly to School ID: {selectedSchool.id}.
              </p>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                    Branch Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOUTH, BR-2"
                    value={newBranchData.branchCode}
                    onChange={(e) => setNewBranchData({ ...newBranchData, branchCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    value={newBranchData.capacity}
                    onChange={(e) => setNewBranchData({ ...newBranchData, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                  Branch Campus Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Campus Wing"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 52 Ring Road, South City"
                  value={newBranchData.street}
                  onChange={(e) => setNewBranchData({ ...newBranchData, street: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">City</label>
                  <input
                    type="text"
                    placeholder={selectedSchool.city}
                    value={newBranchData.city}
                    onChange={(e) => setNewBranchData({ ...newBranchData, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">PIN Code</label>
                  <input
                    type="text"
                    placeholder="800020"
                    value={newBranchData.postalCode}
                    onChange={(e) => setNewBranchData({ ...newBranchData, postalCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Latitude (-90..90)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="25.5912"
                    value={newBranchData.latitude}
                    onChange={(e) => setNewBranchData({ ...newBranchData, latitude: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Longitude (-180..180)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="85.1584"
                    value={newBranchData.longitude}
                    onChange={(e) => setNewBranchData({ ...newBranchData, longitude: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isMainBranchCheck"
                  checked={newBranchData.isMainBranch}
                  onChange={(e) => setNewBranchData({ ...newBranchData, isMainBranch: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                />
                <label htmlFor="isMainBranchCheck" className="text-slate-300 font-semibold text-xs cursor-pointer">
                  Set as Main Branch Campus for this School
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit School Location Modal */}
      {showEditLocationModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full my-8 space-y-5 animate-fade-in relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowEditLocationModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-indigo-400 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Location Correction
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Edit Location for {selectedSchool.name}
              </h3>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Street / Road Address</label>
                <input
                  type="text"
                  value={editLocationData.street || ''}
                  onChange={(e) => setEditLocationData({ ...editLocationData, street: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Locality</label>
                  <input
                    type="text"
                    value={editLocationData.locality || ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, locality: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">City</label>
                  <input
                    type="text"
                    value={editLocationData.city || ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">District</label>
                  <input
                    type="text"
                    value={editLocationData.district || ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">State</label>
                  <input
                    type="text"
                    value={editLocationData.state || ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">PIN Code</label>
                  <input
                    type="text"
                    value={editLocationData.postalCode || ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, postalCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editLocationData.latitude ?? ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, latitude: e.target.value ? Number(e.target.value) : null })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editLocationData.longitude ?? ''}
                    onChange={(e) => setEditLocationData({ ...editLocationData, longitude: e.target.value ? Number(e.target.value) : null })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditLocationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
