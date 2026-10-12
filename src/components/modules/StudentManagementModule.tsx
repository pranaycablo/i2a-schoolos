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
  Building2
} from 'lucide-react';

export const StudentManagementModule: React.FC = () => {
  const { students, addStudent, feeReceipts } = useSchool();
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentModal, setActiveStudentModal] = useState<Student | null>(null);
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
          {['ALL', 'Class VIII', 'Class X'].map((cls) => (
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

            <button
              onClick={() => setActiveStudentModal(std)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              View 360° Profile & Ledgers
            </button>
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
              <button onClick={() => setActiveStudentModal(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
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
