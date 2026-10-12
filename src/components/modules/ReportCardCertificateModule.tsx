import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import {
  Award,
  FileText,
  Printer,
  ShieldCheck,
  User,
  Sparkles,
  Download,
  CheckCircle2,
  Building2,
  BadgeCheck
} from 'lucide-react';

export const ReportCardCertificateModule: React.FC = () => {
  const { branding, students, examSubmissions } = useSchool();

  const [activeTab, setActiveTab] = useState<'REPORT_CARD' | 'ID_CARDS' | 'CERTIFICATES'>('REPORT_CARD');
  const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);
  const [certificateType, setCertificateType] = useState<'BONAFIDE' | 'CHARACTER' | 'TC'>('BONAFIDE');

  const studentSubmission = examSubmissions.find((s) => s.studentId === selectedStudent.id) || examSubmissions[0];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" /> Branded Document Automation Engine
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Report Cards, Student/Staff ID Cards & Certificates
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            One-Click PDF Generation with School Header, Logo, Authorized Principal Signature & Verification Stamp.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('REPORT_CARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'REPORT_CARD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Report Card Generator
          </button>
          <button
            onClick={() => setActiveTab('ID_CARDS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ID_CARDS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ID Cards Automation
          </button>
          <button
            onClick={() => setActiveTab('CERTIFICATES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CERTIFICATES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Certificates (TC / Bonafide)
          </button>
        </div>
      </div>

      {/* Select Student Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-500">Select Target Student:</span>
          <select
            value={selectedStudent.id}
            onChange={(e) => setSelectedStudent(students.find((s) => s.id === e.target.value) || students[0])}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Adm #{s.admissionNo} - {s.className})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print PDF Document
        </button>
      </div>

      {activeTab === 'REPORT_CARD' && (
        <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 font-sans">
          {/* Header */}
          <div className="text-center border-b pb-4 space-y-1">
            <img src={branding.logoUrl} alt="Logo" className="h-16 w-16 mx-auto object-cover rounded-xl mb-2" />
            <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: branding.primaryColor }}>
              {branding.name}
            </h2>
            <p className="text-xs text-slate-500">{branding.address}</p>
            <div className="mt-3 inline-block px-4 py-1 text-xs font-black text-white rounded-full" style={{ backgroundColor: branding.primaryColor }}>
              ANNUAL ACADEMIC PROGRESS REPORT CARD ({branding.academicSession})
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Student Name:</p>
              <p className="font-extrabold text-slate-900">{selectedStudent.name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Adm No / Roll:</p>
              <p className="font-bold">{selectedStudent.admissionNo} / {selectedStudent.rollNo}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Class & Section:</p>
              <p className="font-bold">{selectedStudent.className} - {selectedStudent.section}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Attendance Rate:</p>
              <p className="font-bold text-emerald-600">{selectedStudent.attendanceRate}%</p>
            </div>
          </div>

          {/* Marks Table */}
          <div className="border rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Max Marks</th>
                  <th className="p-3 text-center">Marks Obtained</th>
                  <th className="p-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold">Science (Theory & Lab)</td>
                  <td className="p-3 text-center">100</td>
                  <td className="p-3 text-center font-bold">{studentSubmission.score * 3}</td>
                  <td className="p-3 text-center font-extrabold text-indigo-600">{studentSubmission.grade}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Mathematics</td>
                  <td className="p-3 text-center">100</td>
                  <td className="p-3 text-center font-bold">92</td>
                  <td className="p-3 text-center font-extrabold text-indigo-600">A+</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">English Language & Lit</td>
                  <td className="p-3 text-center">100</td>
                  <td className="p-3 text-center font-bold">88</td>
                  <td className="p-3 text-center font-extrabold text-indigo-600">A</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Social Studies</td>
                  <td className="p-3 text-center">100</td>
                  <td className="p-3 text-center font-bold">85</td>
                  <td className="p-3 text-center font-extrabold text-indigo-600">A</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1">
            <p className="font-bold text-indigo-900">Principal Remarks:</p>
            <p className="text-slate-700 italic">
              "{selectedStudent.name} has shown outstanding analytical skills and regular attendance. Promoted to next academic session!"
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between items-end text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Class Teacher Signature</p>
              <p className="font-bold text-slate-800">Mrs. Sunita Mishra</p>
            </div>
            <div className="text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-[10px] font-bold text-emerald-700">Official Seal Verified</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px]">Principal Signature</p>
              <p className="font-bold text-slate-800">{branding.principalName}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ID_CARDS' && (
        <div className="flex justify-center py-6">
          {/* Plastic Pocket ID Card */}
          <div className="w-80 bg-white text-slate-900 rounded-3xl border-2 border-indigo-600 shadow-2xl overflow-hidden font-sans">
            <div className="bg-indigo-600 text-white p-4 text-center space-y-1">
              <h4 className="font-extrabold text-sm uppercase tracking-tight">{branding.name}</h4>
              <p className="text-[9px] text-indigo-200">STUDENT IDENTITY CARD</p>
            </div>

            <div className="p-6 text-center space-y-3">
              <img src={selectedStudent.photoUrl} alt="Photo" className="h-24 w-24 rounded-2xl mx-auto object-cover ring-4 ring-indigo-500/20" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{selectedStudent.name}</h3>
                <p className="text-xs font-bold text-indigo-600">Class: {selectedStudent.className}-{selectedStudent.section}</p>
              </div>

              <div className="text-[11px] text-slate-600 text-left bg-slate-50 p-3 rounded-xl space-y-1">
                <p><b>Adm No:</b> {selectedStudent.admissionNo}</p>
                <p><b>Parent Mobile:</b> {selectedStudent.parentMobile}</p>
                <p><b>Blood Group:</b> O+ (Verified)</p>
                <p><b>Emergency:</b> {branding.phone}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CERTIFICATES' && (
        <div className="max-w-2xl mx-auto bg-white text-slate-900 p-8 rounded-3xl border-4 border-amber-500 shadow-2xl space-y-6 text-center">
          <BadgeCheck className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black uppercase text-slate-900 tracking-wider">
            BONAFIDE CERTIFICATE
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed px-6">
            This is to certify that <b>{selectedStudent.name}</b>, Son/Daughter of <b>{selectedStudent.fatherName}</b>, residing at <b>{selectedStudent.address}</b>, is a bona fide student of <b>{branding.name}</b> studying in <b>{selectedStudent.className}</b> under Admission No. <b>{selectedStudent.admissionNo}</b> during the academic session {branding.academicSession}.
          </p>

          <div className="pt-8 flex justify-between text-xs px-6">
            <div className="text-left">
              <p className="text-slate-400">Issue Date</p>
              <p className="font-bold">08 October 2026</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Principal Signature</p>
              <p className="font-bold">{branding.principalName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
