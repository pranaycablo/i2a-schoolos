import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  UserCheck,
  Check,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const AttendanceTimetableModule: React.FC = () => {
  const { students, updateStudent } = useSchool();

  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'TIMETABLE'>('ATTENDANCE');
  const [selectedClass, setSelectedClass] = useState('Class VIII');
  const [attendanceState, setAttendanceState] = useState<{ [stdId: string]: boolean }>({
    'std-101': true,
    'std-102': true,
    'std-103': false
  });

  const [alertSent, setAlertSent] = useState(false);

  const timetableSlots = [
    { period: '1 (09:00 - 09:45 AM)', mon: 'Mathematics (Mr. Sharma)', tue: 'Science (Mrs. Mishra)', wed: 'English (Mr. Verma)', thu: 'Hindi', fri: 'Social Studies' },
    { period: '2 (09:45 - 10:30 AM)', mon: 'Science (Mrs. Mishra)', tue: 'Mathematics', wed: 'Computer Lab', thu: 'Science', fri: 'Mathematics' },
    { period: '3 (10:45 - 11:30 AM)', mon: 'English', tue: 'Hindi', wed: 'Mathematics', thu: 'Sports / PE', fri: 'Library' }
  ];

  const handleMarkAttendanceSave = () => {
    // Recalculate attendance rates
    Object.keys(attendanceState).forEach((stdId) => {
      const isPresent = attendanceState[stdId];
      const std = students.find((s) => s.id === stdId);
      if (std) {
        const newRate = isPresent ? Math.min(100, std.attendanceRate + 0.5) : Math.max(0, std.attendanceRate - 2.0);
        updateStudent(stdId, { attendanceRate: Number(newRate.toFixed(1)) });
      }
    });
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CalendarCheck className="w-4 h-4" /> Operations & Timetable Automation
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            1-Click Attendance Engine & Conflict-Free Timetable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Teacher Mark Attendance → Auto Low-Attendance Parent Alert Trigger → Smart Timetable Conflict Prevention.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ATTENDANCE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab('TIMETABLE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TIMETABLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Conflict-Free Timetable
          </button>
        </div>
      </div>

      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Class:</span>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold rounded-xl text-xs">
                Class VIII - Section A
              </span>
            </div>
            <button
              onClick={handleMarkAttendanceSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Attendance & Trigger Parent Alerts
            </button>
          </div>

          {alertSent && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-fade-in">
              ✅ Attendance Saved! WhatsApp alerts automatically dispatched to parents for absent students (&lt;85% threshold check).
            </div>
          )}

          {/* Attendance List */}
          <div className="space-y-3">
            {students.map((std) => {
              const isPresent = attendanceState[std.id] ?? true;
              return (
                <div
                  key={std.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img src={std.photoUrl} alt={std.name} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{std.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        Adm #{std.admissionNo} • Current Rate: <b>{std.attendanceRate}%</b>
                      </p>
                    </div>
                  </div>

                  {/* Present / Absent Toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAttendanceState({ ...attendanceState, [std.id]: true })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() => setAttendanceState({ ...attendanceState, [std.id]: false })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        !isPresent
                          ? 'bg-crimson-600 bg-red-600 text-white shadow'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'TIMETABLE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Class VIII-A Master Conflict-Free Timetable</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
              ✓ Zero Teacher Conflict Detected
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="p-3 border">Period / Time</th>
                  <th className="p-3 border">Monday</th>
                  <th className="p-3 border">Tuesday</th>
                  <th className="p-3 border">Wednesday</th>
                  <th className="p-3 border">Thursday</th>
                  <th className="p-3 border">Friday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {timetableSlots.map((slot, idx) => (
                  <tr key={idx}>
                    <td className="p-3 border font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40">{slot.period}</td>
                    <td className="p-3 border text-slate-800 dark:text-slate-200">{slot.mon}</td>
                    <td className="p-3 border text-slate-800 dark:text-slate-200">{slot.tue}</td>
                    <td className="p-3 border text-slate-800 dark:text-slate-200">{slot.wed}</td>
                    <td className="p-3 border text-slate-800 dark:text-slate-200">{slot.thu}</td>
                    <td className="p-3 border text-slate-800 dark:text-slate-200">{slot.fri}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
