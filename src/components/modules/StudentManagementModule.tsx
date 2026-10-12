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
  QrCode
} from 'lucide-react';

export const StudentManagementModule: React.FC = () => {
  const { students, addStudent, feeReceipts, branding, language } = useSchool();
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentModal, setActiveStudentModal] = useState<Student | null>(null);
  const [activeIdCardStudent, setActiveIdCardStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Student Form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    admissionNo: String(1020 + students.length + 1),
    rollNo: '04',
    className: 'Class VIII',
    section: 'A',
    gender: 'MALE' as Student['gender'],
    dob: '2012-06-10',
    fatherName: '',
    motherName: '',
    parentMobile: '',
    parentEmail: '',
    address: 'Patna, Bihar',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    assignedSubjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies']
  });

  const filteredStudents = students.filter((std) => {
    const matchesClass = selectedClass === 'ALL' || std.className === selectedClass;
    const matchesQuery =
      std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.admissionNo.includes(searchQuery) ||
      std.parentMobile.includes(searchQuery);
    return matchesClass && matchesQuery;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudent({
      ...newStudent,
      parentWhatsApp: newStudent.parentMobile,
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      documents: { birthCertificate: 'Uploaded' },
      attendanceRate: 96.0
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" /> Digital Student 360° Repository
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Student Management & Parent Linkage Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Single-entry student profiles automatically synchronized with Attendance, Fees, Exam Records, and Communication.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Student
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Class Filter:</span>
          {['ALL', ...Array.from(new Set(students.map((s) => s.className).filter(Boolean)))].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedClass === cls
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, admission #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
          />
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((std) => (
          <div
            key={std.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={std.photoUrl} alt={std.name} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-indigo-500/20" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{std.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Adm #{std.admissionNo} • Roll #{std.rollNo}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                {std.className}-{std.section}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> Father:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{std.fatherName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Contact:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{std.parentMobile}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Attendance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{std.attendanceRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveStudentModal(std)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                360° Profile
              </button>
              <button
                onClick={() => setActiveIdCardStudent(std)}
                className="py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center justify-center gap-1.5"
                title="Print Official Student Identity Card"
              >
                <Printer className="w-3.5 h-3.5" />
                {language === 'hi' ? 'पहचान पत्र (I-Card)' : 'I-Card'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 360 Degree Student Profile Modal */}
      {activeStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <img src={activeStudentModal.photoUrl} alt={activeStudentModal.name} className="h-16 w-16 rounded-2xl object-cover ring-4 ring-indigo-500/20" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeStudentModal.name}</h3>
                  <p className="text-xs text-slate-500">
                    Admission No: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStudentModal.admissionNo}</span> • Roll No: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStudentModal.rollNo}</span>
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {activeStudentModal.className} — Section {activeStudentModal.section}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveIdCardStudent(activeStudentModal)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'पहचान पत्र प्रिंट करें' : 'Print I-Card'}
                </button>
                <button onClick={() => setActiveStudentModal(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> Parent Information
                </h4>
                <p><span className="text-slate-500">Father:</span> <b>{activeStudentModal.fatherName}</b></p>
                <p><span className="text-slate-500">Mother:</span> <b>{activeStudentModal.motherName}</b></p>
                <p><span className="text-slate-500">Phone:</span> <b>{activeStudentModal.parentMobile}</b></p>
                <p><span className="text-slate-500">Email:</span> <b>{activeStudentModal.parentEmail}</b></p>
                <p><span className="text-slate-500">Address:</span> {activeStudentModal.address}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-500" /> Academic & Attendance
                </h4>
                <p><span className="text-slate-500">DOB:</span> <b>{activeStudentModal.dob}</b></p>
                <p><span className="text-slate-500">Attendance Rate:</span> <b className="text-emerald-600">{activeStudentModal.attendanceRate}%</b></p>
                <p><span className="text-slate-500">Assigned Subjects:</span> {activeStudentModal.assignedSubjects.join(', ')}</p>
              </div>
            </div>

            {/* Fee History for Student */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Digital Fee Payment History
              </h4>
              <div className="space-y-2">
                {feeReceipts.filter((r) => r.studentId === activeStudentModal.id || r.admissionNo === activeStudentModal.admissionNo).map((rcp) => (
                  <div key={rcp.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-xs">
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300">{rcp.receiptNo}</p>
                      <p className="text-[10px] text-slate-500">{rcp.paymentDate} via {rcp.paymentMode}</p>
                    </div>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">₹{rcp.paidAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Student Identity Card (I-Card) Modal */}
      {activeIdCardStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-500" />
                {language === 'hi' ? 'छात्र पहचान पत्र (Official Student I-Card)' : 'Official Student Identity Card'}
              </span>
              <button onClick={() => setActiveIdCardStudent(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable ID Card Design */}
            <div className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-5 border-2 border-amber-400 shadow-xl relative overflow-hidden text-center space-y-3 font-sans">
              {/* Lanyard Slot Notch */}
              <div className="w-12 h-2 rounded-full bg-slate-300/40 mx-auto -mt-2 mb-2" />

              {/* School Header */}
              <div className="space-y-0.5">
                <h3 className="font-black text-sm tracking-tight text-white uppercase">{branding.name}</h3>
                <p className="text-[9px] text-amber-300 font-bold tracking-wider uppercase">
                  Affiliated to {branding.board} • Reg: {branding.regNumber}
                </p>
                <div className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black tracking-widest mt-1">
                  STUDENT ID CARD • {branding.academicSession}
                </div>
              </div>

              {/* Student Photo */}
              <div className="relative mx-auto w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 to-indigo-400 shadow-lg">
                <img
                  src={activeIdCardStudent.photoUrl}
                  alt={activeIdCardStudent.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Student Identity Information */}
              <div>
                <h4 className="text-base font-extrabold text-white tracking-wide">{activeIdCardStudent.name}</h4>
                <p className="text-xs font-bold text-amber-300">
                  {activeIdCardStudent.className} — Sec {activeIdCardStudent.section} • Roll No: {activeIdCardStudent.rollNo}
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 text-left grid grid-cols-2 gap-1.5 text-[10px] text-slate-200">
                <p><span className="text-slate-400">Adm No:</span> <b className="font-mono text-white">{activeIdCardStudent.admissionNo}</b></p>
                <p><span className="text-slate-400">Blood Group:</span> <b className="text-rose-300">B+ (Positive)</b></p>
                <p className="col-span-2 truncate"><span className="text-slate-400">Father:</span> <b className="text-white">{activeIdCardStudent.fatherName}</b></p>
                <p className="col-span-2"><span className="text-slate-400">Emergency Phone:</span> <b className="text-amber-300 font-mono">{activeIdCardStudent.parentMobile}</b></p>
              </div>

              {/* Barcode & Signature */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                <div className="flex items-center gap-1">
                  <QrCode className="w-7 h-7 text-white" />
                  <span className="font-mono text-[9px] text-slate-300 font-bold">CARD-{activeIdCardStudent.admissionNo}</span>
                </div>
                <div className="text-right">
                  <p className="font-serif italic font-bold text-white text-[10px]">{branding.principalName}</p>
                  <p className="text-[8px] text-amber-300 font-semibold">Principal Signature</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400">Ready for turnstile gate scanner</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIdCardStudent(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  {language === 'hi' ? 'प्रिंट पहचान पत्र' : 'Print I-Card'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleAddSubmit} className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" /> Create Digital Student Profile
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Admission Number</label>
                <input
                  type="text"
                  required
                  value={newStudent.admissionNo}
                  onChange={(e) => setNewStudent({ ...newStudent, admissionNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Class</label>
                <select
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Class VIII">Class VIII</option>
                  <option value="Class X">Class X</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Section</label>
                <input
                  type="text"
                  value={newStudent.section}
                  onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Father's Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.fatherName}
                  onChange={(e) => setNewStudent({ ...newStudent, fatherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Parent Mobile / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={newStudent.parentMobile}
                  onChange={(e) => setNewStudent({ ...newStudent, parentMobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                Save Student Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
