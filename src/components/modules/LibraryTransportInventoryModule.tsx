import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AuxiliaryOperationsService } from '../../services/AuxiliaryOperationsService';
import type { UserSession } from '../../services/TenantSecurityService';
import type {
  LibraryBookMaster,
  LibraryTransactionRecord,
  TransportRouteItem,
  StudentTransportAssignment,
  TransportIncident
} from '../../types';
import {
  Bus,
  BookOpen,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Clock,
  Phone,
  Plus,
  Send,
  Eye,
  Lock,
  Radio
} from 'lucide-react';

export const LibraryTransportInventoryModule: React.FC = () => {
  const { branding, currentRole, students, staffList, logAction } = useSchool();
  const schoolId = branding?.id || 'I2A-SCH-000001';
  const auxService = AuxiliaryOperationsService.getInstance();

  const session: UserSession = {
    id: 'user-active-admin',
    email: 'admin@school.com',
    tenantId: schoolId,
    role: currentRole,
    status: 'ACTIVE'
  };

  const [activeTab, setActiveTab] = useState<'TRANSPORT' | 'LIBRARY' | 'INVENTORY'>('TRANSPORT');

  // --- LIBRARY STATE ---
  const [books, setBooks] = useState<LibraryBookMaster[]>(() => auxService.getBookMasters(schoolId));
  const [transactions, setTransactions] = useState<LibraryTransactionRecord[]>(() =>
    auxService.getLibraryTransactions(schoolId)
  );
  const [selectedCopyId, setSelectedCopyId] = useState<string>('LIB-901-C01');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(students[0]?.id || 'std-101');
  const [dueDateInput, setDueDateInput] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [libError, setLibError] = useState<string | null>(null);
  const [libSuccess, setLibSuccess] = useState<string | null>(null);

  // --- TRANSPORT STATE ---
  const [routes, setRoutes] = useState<TransportRouteItem[]>(() => auxService.getTransportRoutes());
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>(() =>
    auxService.getTransportAssignments(schoolId)
  );
  const [incidents, setIncidents] = useState<TransportIncident[]>(() =>
    auxService.getTransportIncidents(schoolId)
  );

  // Student Route Assignment Form State
  const [assignStudentId, setAssignStudentId] = useState<string>(students[1]?.id || 'std-102');
  const [assignRouteId, setAssignRouteId] = useState<string>('route-01');
  const [assignStopName, setAssignStopName] = useState<string>('Kankarbagh Colony Mor');
  const [transError, setTransError] = useState<string | null>(null);
  const [transSuccess, setTransSuccess] = useState<string | null>(null);

  // Incident reporting state
  const [incidentType, setIncidentType] = useState<TransportIncident['incidentType']>('DELAY');
  const [incidentDesc, setIncidentDesc] = useState<string>('Heavy traffic near Rajendra Nagar overbridge; 15 mins delay.');

  // Parent View simulation state
  const [parentFilterPhone, setParentFilterPhone] = useState<string>('9876543210');
  const [parentViewActive, setParentViewActive] = useState<boolean>(false);

  // Static Assets
  const inventoryAssets = [
    { assetNo: 'AST-101', name: 'Smart Class Interactive Projectors', category: 'IT_EQUIPMENT', count: 18, condition: 'EXCELLENT' },
    { assetNo: 'AST-102', name: 'Chemistry Glassware & Titration Sets', category: 'LAB_EQUIPMENT', count: 45, condition: 'GOOD' },
    { assetNo: 'AST-103', name: 'Biology High-Precision Microscopes', category: 'LAB_EQUIPMENT', count: 20, condition: 'EXCELLENT' }
  ];

  const refreshLibraryState = () => {
    setBooks(auxService.getBookMasters(schoolId));
    setTransactions(auxService.getLibraryTransactions(schoolId));
  };

  const refreshTransportState = () => {
    setRoutes(auxService.getTransportRoutes());
    setAssignments(auxService.getTransportAssignments(schoolId));
    setIncidents(auxService.getTransportIncidents(schoolId));
  };

  // 1. Issue Book Copy Handler
  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    setLibError(null);
    setLibSuccess(null);

    const student = students.find((s) => s.id === selectedMemberId);
    const memberName = student ? student.name : 'Unknown Student';

    try {
      const tx = auxService.issueBookCopy(
        schoolId,
        selectedCopyId,
        {
          id: selectedMemberId,
          name: memberName,
          type: 'STUDENT'
        },
        dueDateInput,
        session
      );
      setLibSuccess(`✅ Copy "${selectedCopyId}" (${tx.bookTitle}) successfully issued to ${memberName}! Due: ${dueDateInput}`);
      logAction('ISSUE_LIBRARY_BOOK', 'LIBRARY', `Issued copy ${selectedCopyId} to ${memberName}`);
      refreshLibraryState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLibError(msg);
    }
  };

  // 2. Return Book Copy Handler
  const handleReturnBook = (copyId: string) => {
    setLibError(null);
    setLibSuccess(null);
    try {
      const tx = auxService.returnBookCopy(schoolId, copyId, session);
      setLibSuccess(`✅ Copy "${copyId}" returned successfully! Fine: ₹${tx.fineAmount}`);
      logAction('RETURN_LIBRARY_BOOK', 'LIBRARY', `Returned copy ${copyId}. Fine: ₹${tx.fineAmount}`);
      refreshLibraryState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLibError(msg);
    }
  };

  // 3. Assign Student to Transport Route Handler
  const handleAssignStudentToRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setTransError(null);
    setTransSuccess(null);

    const student = students.find((s) => s.id === assignStudentId);
    if (!student) {
      setTransError('Selected student not found.');
      return;
    }

    try {
      const assignment = auxService.assignStudentToRoute(
        schoolId,
        assignRouteId,
        {
          id: student.id,
          name: student.name,
          className: student.className,
          section: student.section,
          parentPhone: student.parentMobile || '9876543210'
        },
        assignStopName,
        session
      );
      setTransSuccess(
        `✅ Student ${student.name} assigned to ${assignment.routeNumber} at stop "${assignment.stopName}". Seat reserved!`
      );
      logAction('ASSIGN_TRANSPORT_ROUTE', 'TRANSPORT', `Assigned ${student.name} to ${assignment.routeNumber}`);
      refreshTransportState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTransError(msg);
    }
  };

  // 4. Report Transport Incident Handler
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inc = auxService.reportTransportIncident(
        schoolId,
        assignRouteId,
        incidentType,
        incidentDesc,
        session
      );
      setTransSuccess(`⚠️ Incident logged for ${inc.routeNumber}: ${inc.description}`);
      logAction('LOG_TRANSPORT_INCIDENT', 'TRANSPORT', `Reported incident for ${inc.routeNumber}`);
      refreshTransportState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTransError(msg);
    }
  };

  // All physical copies flattened for quick lookup
  const allCopies = books.flatMap((b) => b.copies);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Bus className="w-4 h-4" /> Auxiliary Infrastructure & Operations
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Transport Fleet, Library Circulation & Campus Assets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real duplicate issuance prevention, bus vehicle capacity enforcement & child location isolation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('TRANSPORT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TRANSPORT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bus Transport Fleet
          </button>
          <button
            onClick={() => setActiveTab('LIBRARY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LIBRARY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Digital Library Circulation
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'INVENTORY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Asset Inventory
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TRANSPORT FLEET & SEAT CAPACITY MANAGEMENT         */}
      {/* ========================================================= */}
      {activeTab === 'TRANSPORT' && (
        <div className="space-y-6">
          {/* Telematics Reality Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Telematics & GPS Tracking Reality Notice (FOV-06R Verification)
              </span>
              <p className="text-amber-700 dark:text-amber-300">
                Route locations shown below represent scheduled stop checkpoints. Live GPS hardware tracking is marked{' '}
                <span className="font-mono font-bold bg-amber-200 dark:bg-amber-900 px-1 rounded">NOT_IMPLEMENTED</span>{' '}
                as physical AIS-140 GPS telematics devices and vehicle tracker APIs are not integrated in this pure frontend instance.
              </p>
            </div>
          </div>

          {transSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {transSuccess}
            </div>
          )}

          {transError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {transError}
            </div>
          )}

          {/* Promotional Parent Transport Mobile Showcase */}
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-8 p-6 space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Parent Live Transport & Route Telematics
                </span>
                <h3 className="text-xl font-black text-white">
                  Live School Bus Fleet, Driver Contact & Stop Geofencing
                </h3>
                <p className="text-xs text-amber-100/80 leading-relaxed max-w-xl">
                  Parents receive automated notifications when the vehicle crosses scheduled stop checkpoints. Real-time driver credentials, emergency contact, and capacity monitoring.
                </p>
              </div>
              <div className="md:col-span-4 p-4 flex justify-end">
                <img
                  src="./images/parent-app-banner.png"
                  alt="Live School Bus Mobile App"
                  className="h-32 w-auto object-cover rounded-2xl shadow-lg border border-amber-400/20"
                />
              </div>
            </div>
          </div>

          {/* Bus Routes List with Capacity Meter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {routes.map((r) => {
              const occupancy = Math.round((r.assignedStudentsCount / r.capacity) * 100);
              const isFull = r.assignedStudentsCount >= r.capacity;

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{r.routeNumber}</h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                          {r.vehicleNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{r.routeName}</p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        isFull
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}
                    >
                      {isFull ? 'FULL CAPACITY' : 'SEATS AVAILABLE'}
                    </span>
                  </div>

                  {/* Seat Capacity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span>Vehicle Capacity ({r.assignedStudentsCount}/{r.capacity} seats)</span>
                      <span>{occupancy}% Occupied</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-rose-500' : occupancy > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, occupancy)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Scheduled Stops */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stops & Schedule:</span>
                    <div className="space-y-1 pt-1">
                      {r.stops.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl"
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-300">{st.stopName}</span>
                          <span className="text-slate-500 font-mono">
                            Pick: {st.pickUpTime} | Drop: {st.dropTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Driver & Duty */}
                  <div className="text-xs pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        Driver: <b>{r.driverName}</b> ({r.driverMobile})
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      Status: {r.liveStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat Allocation & Incident Log Desk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student Assignment Form with Strict Capacity & Conflict Checks */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Assign Student to Transport Route
              </h3>
              <form onSubmit={handleAssignStudentToRoute} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Select Student</label>
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className} - {s.admissionNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Select Bus Route</label>
                  <select
                    value={assignRouteId}
                    onChange={(e) => {
                      setAssignRouteId(e.target.value);
                      const sel = routes.find((r) => r.id === e.target.value);
                      if (sel && sel.stops.length > 0) {
                        setAssignStopName(sel.stops[0].stopName);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.routeNumber} ({r.routeName}) — {r.assignedStudentsCount}/{r.capacity} seats occupied
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Select Bus Stop</label>
                  <select
                    value={assignStopName}
                    onChange={(e) => setAssignStopName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {(routes.find((r) => r.id === assignRouteId)?.stops || []).map((st, idx) => (
                      <option key={idx} value={st.stopName}>
                        {st.stopName} (Pick: {st.pickUpTime} | Drop: {st.dropTime})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md"
                >
                  Verify Capacity & Assign Seat
                </button>
              </form>
            </div>

            {/* Incident & Driver Duty Desk */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Driver Duty & Route Incident Log
              </h3>
              <form onSubmit={handleReportIncident} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Select Incident Type</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as TransportIncident['incidentType'])}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="DELAY">Traffic Delay / Slow Moving</option>
                    <option value="BREAKDOWN">Vehicle Mechanical Breakdown</option>
                    <option value="MAINTENANCE">Scheduled Maintenance</option>
                    <option value="WEATHER">Heavy Rain / Weather Disruption</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Incident Description</label>
                  <textarea
                    rows={2}
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md"
                >
                  Log Operational Incident
                </button>
              </form>

              {/* Recent Incident Feed */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[11px] font-bold text-slate-400">Incident History:</span>
                {incidents.length === 0 ? (
                  <p className="text-slate-400 text-[11px]">No active incidents recorded.</p>
                ) : (
                  incidents.slice(-3).map((inc) => (
                    <div key={inc.id} className="p-2 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px]">
                      <div className="flex justify-between font-bold text-amber-900 dark:text-amber-200">
                        <span>{inc.routeNumber} ({inc.incidentType})</span>
                        <span className="font-mono text-slate-500">{inc.reportedAt}</span>
                      </div>
                      <p className="text-amber-800 dark:text-amber-300 mt-0.5">{inc.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Secure Parent Isolation View Test */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Parent Portal Transport Data Isolation Test
                </h3>
                <p className="text-xs text-slate-500">
                  Verifies that parent accounts can only see their own child's transport route, protecting student safety.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Parent Mobile Number"
                  value={parentFilterPhone}
                  onChange={(e) => setParentFilterPhone(e.target.value)}
                  className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <button
                  onClick={() => setParentViewActive(!parentViewActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    parentViewActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  {parentViewActive ? 'Reset to Admin View' : 'Simulate Parent View'}
                </button>
              </div>
            </div>

            {/* Display Active Transport Assignments */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Assigned Stop</th>
                    <th className="py-2.5 px-3">Pickup Time</th>
                    <th className="py-2.5 px-3">Drop Time</th>
                    <th className="py-2.5 px-3">Parent Contact</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments
                    .filter((a) => !parentViewActive || a.parentPhone === parentFilterPhone)
                    .map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{a.studentName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{a.className} - {a.section}</td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">{a.routeNumber}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{a.stopName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{a.pickupTime}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{a.dropTime}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{a.parentPhone}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {parentViewActive && assignments.filter((a) => a.parentPhone === parentFilterPhone).length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs">
                  🔒 No records visible for phone {parentFilterPhone}. Other students' transport data is strictly isolated!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LIBRARY CIRCULATION & DUPLICATE BOOK PREVENTION   */}
      {/* ========================================================= */}
      {activeTab === 'LIBRARY' && (
        <div className="space-y-6">
          {/* Notification Limitation Alert */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-3">
            <Radio className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                Library Circulation & Overdue Notification Status (FOV-06R Verification)
              </span>
              <p className="text-indigo-700 dark:text-indigo-300">
                Book copies are tracked with unique accession barcodes. Duplicate issuance is strictly blocked.
                External WhatsApp/SMS overdue alerts are marked{' '}
                <span className="font-mono font-bold bg-indigo-200 dark:bg-indigo-900 px-1 rounded">NOT_IMPLEMENTED / BLOCKED</span>{' '}
                as SMS/WhatsApp gateway credentials are not configured in this test environment.
              </p>
            </div>
          </div>

          {libSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {libSuccess}
            </div>
          )}

          {libError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {libError}
            </div>
          )}

          {/* Book Catalog Cards with Physical Copies List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {books.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      {b.code}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{b.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Author: {b.author} • Category: {b.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-indigo-600 text-sm">
                      {b.availableCopies} / {b.totalCopies} Available
                    </span>
                  </div>
                </div>

                {/* Individual Physical Accession Copies */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Physical Accession Copies:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {b.copies.map((c) => {
                      const isIssued = c.status === 'ISSUED';
                      return (
                        <div
                          key={c.id}
                          className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${
                            isIssued
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white">{c.id}</div>
                            {isIssued ? (
                              <div className="text-[10px] text-amber-700 dark:text-amber-400">
                                Issued to: <b>{c.currentBorrowerName}</b>
                                <br />
                                Due: {c.dueDate}
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                Available on Shelf
                              </div>
                            )}
                          </div>

                          {isIssued && (
                            <button
                              onClick={() => handleReturnBook(c.id)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer"
                            >
                              Return
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Book Issue Desk */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Circulation Desk: Issue Book Copy
            </h3>
            <form onSubmit={handleIssueBook} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-end">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Select Physical Copy</label>
                <select
                  value={selectedCopyId}
                  onChange={(e) => setSelectedCopyId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {allCopies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Select Member (Student)</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className} - {s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md"
                >
                  Validate & Issue Copy
                </button>
              </div>
            </form>
          </div>

          {/* Library Transaction Ledger */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Circulation Transaction Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Accession ID</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Return Date</th>
                    <th className="py-2.5 px-3">Fine</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{tx.id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{tx.copyId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{tx.bookTitle}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{tx.memberName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{tx.issueDate}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{tx.dueDate}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{tx.returnDate || '—'}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-600">₹{tx.fineAmount}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'ACTIVE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: INVENTORY ASSET AUDIT                              */}
      {/* ========================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">School Property & Asset Audit</h3>
          <div className="space-y-3 text-xs">
            {inventoryAssets.map((a, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{a.name}</h4>
                  <p className="text-[10px] text-slate-500">Asset No: {a.assetNo} • Category: {a.category}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 dark:text-white">{a.count} Units</span>
                  <span className="block text-[10px] font-bold text-emerald-600">{a.condition}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
