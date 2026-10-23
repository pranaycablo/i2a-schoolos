import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import {
  Users,
  Search,
  Plus,
  FileText,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle,
  X,
  Sparkles,
  CreditCard,
  Building2,
  Printer,
  QrCode,
  MessageSquare,
  AlertCircle,
  Eye,
  Check,
  UserCheck,
  ShieldCheck,
  Download,
  Filter
} from 'lucide-react';

export const StudentManagementModule: React.FC = () => {
  const { students, addStudent, feeReceipts, branding, language } = useSchool();
  
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'GOOD' | 'WARNING' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'GRID' | 'TABLE'>('GRID');
  
  const [activeStudentModal, setActiveStudentModal] = useState<Student | null>(null);
  const [activeIdCardStudent, setActiveIdCardStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Student Form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    admissionNo: String(1030 + students.length + 1),
    rollNo: '06',
    className: 'Class VIII',
    section: 'A',
    gender: 'MALE' as Student['gender'],
    dob: '2013-05-10',
    fatherName: '',
    motherName: '',
    parentMobile: '',
    parentEmail: '',
    address: 'Patna, Bihar',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    assignedSubjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    attendanceRate: 95.0,
    presentDays: 178,
    absentDays: 10,
    totalWorkingDays: 188,
    feeDueAmount: 0,
    feePaidAmount: 22000,
    academicGrade: 'A+'
  });

  // Calculate Overall Metrics
  const totalStudents = students.length;
  const avgAttendance = (
    students.reduce((acc, s) => acc + s.attendanceRate, 0) / (students.length || 1)
  ).toFixed(1);
  const totalPresentToday = students.filter((s) => s.attendanceRate >= 80).length;
  const totalAbsentToday = totalStudents - totalPresentToday;
  const withDuesCount = students.filter((s) => (s.feeDueAmount || 0) > 0).length;

  const filteredStudents = students.filter((std) => {
    const matchesClass = selectedClass === 'ALL' || std.className === selectedClass;
    const matchesQuery =
      std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.admissionNo.includes(searchQuery) ||
      std.rollNo.includes(searchQuery) ||
      std.parentMobile.includes(searchQuery) ||
      std.fatherName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesAttendance = true;
    if (attendanceFilter === 'GOOD') matchesAttendance = std.attendanceRate >= 85;
    if (attendanceFilter === 'WARNING') matchesAttendance = std.attendanceRate >= 75 && std.attendanceRate < 85;
    if (attendanceFilter === 'CRITICAL') matchesAttendance = std.attendanceRate < 75;

    return matchesClass && matchesQuery && matchesAttendance;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.fatherName || !newStudent.parentMobile) {
      alert('कृपया छात्र का नाम, पिता का नाम और मोबाइल नंबर अवश्य भरें।');
      return;
    }

    addStudent({
      ...newStudent,
      parentWhatsApp: newStudent.parentMobile,
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      documents: { birthCertificate: 'Uploaded' }
    });
    setShowAddModal(false);
    setNewStudent({
      name: '',
      admissionNo: String(1030 + students.length + 2),
      rollNo: '07',
      className: 'Class VIII',
      section: 'A',
      gender: 'MALE',
      dob: '2013-05-10',
      fatherName: '',
      motherName: '',
      parentMobile: '',
      parentEmail: '',
      address: 'Patna, Bihar',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      assignedSubjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
      attendanceRate: 95.0,
      presentDays: 178,
      absentDays: 10,
      totalWorkingDays: 188,
      feeDueAmount: 0,
      feePaidAmount: 22000,
      academicGrade: 'A+'
    });
  };

  const getParentWhatsAppUrl = (std: Student) => {
    const cleanPhone = (std.parentWhatsApp || std.parentMobile || '').replace(/[^0-9]/g, '');
    const msg = `नमस्ते ${std.fatherName || 'अभिभावक'} जी,\n${branding.name} की ओर से सादर प्रणाम। आपके सुपुत्र/सुपुत्री ${std.name} (कक्षा: ${std.className}-${std.section}, रोल नं: ${std.rollNo}) की उपस्थिति दर वर्तमान में ${std.attendanceRate}% है (उपस्थित: ${std.presentDays || 178} दिन, अनुपस्थित: ${std.absentDays || 10} दिन)।\n\nकिसी भी जानकारी हेतु संपर्क करें: ${branding.phone}।\nधन्यवाद!`;
    return `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" /> Comprehensive Student SIS & Attendance Hub
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Student 360° Directory, Attendance & Parent Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            छात्र की पूरी जानकारी: कुल उपस्थित (Present) व अनुपस्थित (Absent) दिन, अभिभावक संपर्क, बकाया फीस एवं डिजिटल आईडी कार्ड।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> नया छात्र जोड़ें (Add Student)
          </button>
        </div>
      </div>

      {/* Top 4 Attendance & Student KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">कुल नामांकित छात्र (Total)</p>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{totalStudents} Students</h3>
          <p className="text-[10px] text-indigo-500 font-semibold">100% Active Profiles</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">औसत छात्र उपस्थिति (Avg Rate)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{avgAttendance}%</h3>
          <p className="text-[10px] text-emerald-500 font-semibold">CBSE Benchmarked (&gt;85%)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">आज की उपस्थिति (Today's Status)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-black text-emerald-600">{totalPresentToday} Present</h3>
            <span className="text-xs text-rose-500 font-bold">({totalAbsentToday} Absent)</span>
          </div>
          <p className="text-[10px] text-slate-400">Daily RFID & Class Log</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">फीस बकाया स्थिति (Fee Dues)</p>
          <h3 className="text-xl font-black text-amber-600 dark:text-amber-400">
            {totalStudents - withDuesCount} Cleared
          </h3>
          <p className="text-[10px] text-rose-500 font-semibold">{withDuesCount} Students with Dues</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Class Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-bold text-[11px] mr-1 shrink-0">Class:</span>
            {['ALL', 'Class VI', 'Class VIII', 'Class X', 'Class XII'].map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  selectedClass === cls
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Search Box & Layout Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="छात्र का नाम, रोल या मोबाइल..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewLayout('GRID')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewLayout === 'GRID' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-400'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewLayout('TABLE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewLayout === 'TABLE' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-400'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Attendance Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> उपस्थिति फ़िल्टर:
          </span>
          <button
            onClick={() => setAttendanceFilter('ALL')}
            className={`px-2.5 py-0.5 rounded-lg font-bold ${
              attendanceFilter === 'ALL' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600' : 'text-slate-500'
            }`}
          >
            सभी छात्र (All)
          </button>
          <button
            onClick={() => setAttendanceFilter('GOOD')}
            className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
              attendanceFilter === 'GOOD' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> उत्तम उपस्थिति (&ge;85%)
          </button>
          <button
            onClick={() => setAttendanceFilter('WARNING')}
            className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
              attendanceFilter === 'WARNING' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' : 'text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> मध्यम (75-85%)
          </button>
          <button
            onClick={() => setAttendanceFilter('CRITICAL')}
            className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
              attendanceFilter === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> कम उपस्थिति (&lt;75%)
          </button>
        </div>
      </div>

      {/* LAYOUT 1: CARDS GRID VIEW */}
      {viewLayout === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((std) => {
            const present = std.presentDays || Math.round((std.attendanceRate / 100) * 188);
            const absent = std.absentDays || Math.max(0, 188 - present);
            const totalDays = std.totalWorkingDays || 188;
            const hasDues = (std.feeDueAmount || 0) > 0;

            return (
              <div
                key={std.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 group"
              >
                {/* Header: Photo, Name, Roll, Admission No */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={std.photoUrl}
                      alt={std.name}
                      className="w-13 h-13 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {std.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {std.className}-{std.section}
                        </span>
                        <span>•</span>
                        <span>रोल: <b>{std.rollNo}</b></span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        Adm #{std.admissionNo}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Grade {std.academicGrade || 'A'}
                  </span>
                </div>

                {/* Real Attendance Metrics (Present / Absent / Total) */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> उपस्थिति विवरण (Attendance)
                    </span>
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        std.attendanceRate >= 85
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : std.attendanceRate >= 75
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                      }`}
                    >
                      {std.attendanceRate}%
                    </span>
                  </div>

                  {/* Present vs Absent Counters */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-1">
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                        उपस्थित (Present)
                      </span>
                      <span className="font-black font-mono text-base text-emerald-600 dark:text-emerald-400">
                        {present} <span className="text-[10px] font-medium text-slate-400">दिन</span>
                      </span>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block uppercase">
                        अनुपस्थित (Absent)
                      </span>
                      <span className="font-black font-mono text-base text-rose-600 dark:text-rose-400">
                        {absent} <span className="text-[10px] font-medium text-slate-400">दिन</span>
                      </span>
                    </div>
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        std.attendanceRate >= 85 ? 'bg-emerald-500' : std.attendanceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${std.attendanceRate}%` }}
                    />
                  </div>
                </div>

                {/* Parent Information & Fee Status Strip */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">पिता का नाम:</span>
                    <b className="text-slate-900 dark:text-white">{std.fatherName}</b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">अभिभावक फोन:</span>
                    <b className="font-mono text-slate-900 dark:text-white">{std.parentMobile}</b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">फीस स्थिति:</span>
                    {hasDues ? (
                      <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                        बकाया: ₹{std.feeDueAmount?.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        ✓ पूर्ण चुकता (Cleared)
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Strip */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getParentWhatsAppUrl(std)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 dark:border-emerald-800/80 transition-colors"
                      title="Send Attendance & Fees Alert on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`tel:${std.parentMobile}`}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Call Parent"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveIdCardStudent(std)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <QrCode className="w-3 h-3 text-indigo-500" /> ID Card
                    </button>
                    <button
                      onClick={() => setActiveStudentModal(std)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Eye className="w-3 h-3" /> Full Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LAYOUT 2: COMPACT PRO TABLE VIEW */}
      {viewLayout === 'TABLE' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Student</th>
                  <th className="p-4">Class & Roll</th>
                  <th className="p-4">Parent Details</th>
                  <th className="p-4">Present / Absent Days</th>
                  <th className="p-4">Attendance %</th>
                  <th className="p-4">Fee Dues</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((std) => {
                  const present = std.presentDays || Math.round((std.attendanceRate / 100) * 188);
                  const absent = std.absentDays || Math.max(0, 188 - present);
                  const hasDues = (std.feeDueAmount || 0) > 0;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={std.photoUrl} alt={std.name} className="w-9 h-9 rounded-xl object-cover" />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">{std.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Adm #{std.admissionNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {std.className}-{std.section}
                        <span className="text-[10px] text-slate-400 font-normal block">Roll #{std.rollNo}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{std.fatherName}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{std.parentMobile}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                            {present}P
                          </span>
                          <span className="text-rose-600 font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                            {absent}A
                          </span>
                          <span className="text-slate-400 text-[10px]">/ 188 Days</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            std.attendanceRate >= 85
                              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                              : 'text-rose-600 bg-rose-50 dark:bg-rose-950'
                          }`}
                        >
                          {std.attendanceRate}%
                        </span>
                      </td>
                      <td className="p-4">
                        {hasDues ? (
                          <span className="font-mono font-bold text-rose-600">₹{std.feeDueAmount?.toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">✓ Cleared</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={getParentWhatsAppUrl(std)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setActiveStudentModal(std)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-xs"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360° Comprehensive Student Profile Modal */}
      {activeStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img
                  src={activeStudentModal.photoUrl}
                  alt={activeStudentModal.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
                />
                <div>
                  <h3 className="font-black text-xl">{activeStudentModal.name}</h3>
                  <p className="text-indigo-200 text-xs">
                    कक्षा: <b>{activeStudentModal.className}-{activeStudentModal.section}</b> • रोल नं: <b>{activeStudentModal.rollNo}</b> • Adm #{activeStudentModal.admissionNo}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Active Student Profile
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveStudentModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Attendance Deep Breakdown Card */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" /> शैक्षणिक सत्र उपस्थिति रिपोर्ट (Attendance Deep Dive)
                  </h4>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {activeStudentModal.attendanceRate}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">कुल उपस्थित दिन</span>
                    <b className="font-mono text-xl text-emerald-600 dark:text-emerald-400">
                      {activeStudentModal.presentDays || 178}
                    </b>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block uppercase">कुल अनुपस्थित दिन</span>
                    <b className="font-mono text-xl text-rose-600 dark:text-rose-400">
                      {activeStudentModal.absentDays || 10}
                    </b>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">सत्र के कार्य दिवस</span>
                    <b className="font-mono text-xl text-slate-800 dark:text-slate-200">
                      {activeStudentModal.totalWorkingDays || 188}
                    </b>
                  </div>
                </div>
              </div>

              {/* Personal & Parent Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">पारिवारिक विवरण (Family Details)</h5>
                  <p><span className="text-slate-400">पिता का नाम:</span> <b>{activeStudentModal.fatherName}</b></p>
                  <p><span className="text-slate-400">माता का नाम:</span> <b>{activeStudentModal.motherName || 'N/A'}</b></p>
                  <p><span className="text-slate-400">अभिभावक फोन:</span> <b className="font-mono">{activeStudentModal.parentMobile}</b></p>
                  <p><span className="text-slate-400">व्हाट्सएप:</span> <b className="font-mono">{activeStudentModal.parentWhatsApp}</b></p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">व्यक्तिगत एवं आवासीय पता</h5>
                  <p><span className="text-slate-400">जन्म तिथि:</span> <b className="font-mono">{activeStudentModal.dob}</b></p>
                  <p><span className="text-slate-400">जेंडर:</span> <b>{activeStudentModal.gender}</b></p>
                  <p><span className="text-slate-400">हाउस / दल:</span> <b>{activeStudentModal.house || 'General'}</b></p>
                  <p><span className="text-slate-400">स्थानीय पता:</span> <b>{activeStudentModal.address}</b></p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <a
                href={getParentWhatsAppUrl(activeStudentModal)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <MessageSquare className="w-4 h-4" /> व्हाट्सएप पर सूचना भेजें (Send Alert)
              </a>
              <button
                onClick={() => {
                  setActiveIdCardStudent(activeStudentModal);
                  setActiveStudentModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <QrCode className="w-4 h-4" /> डिजिटल आई-कार्ड देखें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Digital Student ID Card Modal */}
      {activeIdCardStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">Official Student Identity Card</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setActiveIdCardStudent(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ID Card Front View */}
            <div className="p-6 text-center space-y-4 bg-white dark:bg-slate-950">
              <div className="border-b pb-3">
                <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 mx-auto rounded-xl object-cover" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1 uppercase">{branding.name}</h4>
                <p className="text-[9px] text-slate-400">CBSE Affiliated • Session {branding.academicSession}</p>
              </div>

              <img
                src={activeIdCardStudent.photoUrl}
                alt={activeIdCardStudent.name}
                className="w-24 h-24 rounded-2xl object-cover mx-auto ring-4 ring-indigo-500/20 shadow-lg"
              />

              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{activeIdCardStudent.name}</h3>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {activeIdCardStudent.className} - Section {activeIdCardStudent.section}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Roll No: {activeIdCardStudent.rollNo} • Adm #{activeIdCardStudent.admissionNo}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl text-[11px] text-left space-y-1 border">
                <p><span className="text-slate-400">Father:</span> <b>{activeIdCardStudent.fatherName}</b></p>
                <p><span className="text-slate-400">Emergency Phone:</span> <b className="font-mono">{activeIdCardStudent.parentMobile}</b></p>
                <p><span className="text-slate-400">Blood Group:</span> <b>O+ Positive</b></p>
              </div>

              <div className="pt-2 flex justify-between items-center text-[9px] text-slate-400 border-t">
                <span>Authorized Identity Pass</span>
                <span className="font-mono text-indigo-500">i2A SchoolOS Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">नया छात्र नामांकन (New Student Enrollment)</h4>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold mb-1">छात्र का नाम (Full Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saurav Sharma"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">कक्षा (Class) *</label>
                <select
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none font-bold"
                >
                  <option value="Class Nursery">Class Nursery</option>
                  <option value="Class I">Class I</option>
                  <option value="Class II">Class II</option>
                  <option value="Class III">Class III</option>
                  <option value="Class IV">Class IV</option>
                  <option value="Class V">Class V</option>
                  <option value="Class VI">Class VI</option>
                  <option value="Class VII">Class VII</option>
                  <option value="Class VIII">Class VIII</option>
                  <option value="Class IX">Class IX</option>
                  <option value="Class X">Class X</option>
                  <option value="Class XI">Class XI</option>
                  <option value="Class XII">Class XII</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">रोल नंबर (Roll No) *</label>
                <input
                  type="text"
                  required
                  value={newStudent.rollNo}
                  onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">एडमिशन नंबर *</label>
                <input
                  type="text"
                  required
                  value={newStudent.admissionNo}
                  onChange={(e) => setNewStudent({ ...newStudent, admissionNo: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">पिता का नाम (Father Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rakesh Sharma"
                  value={newStudent.fatherName}
                  onChange={(e) => setNewStudent({ ...newStudent, fatherName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">अभिभावक मोबाइल नंबर *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newStudent.parentMobile}
                  onChange={(e) => setNewStudent({ ...newStudent, parentMobile: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">स्थानीय पता (Address)</label>
              <input
                type="text"
                placeholder="e.g. Boring Road, Near City Mall, Patna"
                value={newStudent.address}
                onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition-all"
            >
              छात्र प्रोफाइल सेव करें (Enroll Student Profile)
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
