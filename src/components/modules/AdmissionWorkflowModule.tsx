import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Award,
  Sparkles,
  Send,
  Building2,
  XCircle,
  MessageSquare,
  Phone,
  MapPin,
  UserCheck,
  Flame,
  Filter,
  Search,
  ChevronRight,
  Check,
  ExternalLink
} from 'lucide-react';
import { OnlineAdmissionApplication } from '../../types';

export const AdmissionWorkflowModule: React.FC = () => {
  const {
    admissions,
    addAdmission,
    updateAdmissionStatus,
    approveAdmissionAndCreateStudent,
    updateLeadStage,
    triggerWhatsAppLeadMessage,
    branding
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'CRM_PIPELINE' | 'PARENT_FORM'>('CRM_PIPELINE');
  const [stageFilter, setStageFilter] = useState<'ALL' | NonNullable<OnlineAdmissionApplication['leadStage']>>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Counselor note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [counselorNoteText, setCounselorNoteText] = useState('');

  // Parent Public Form State
  const [parentForm, setParentForm] = useState({
    studentName: '',
    applyingClass: 'Class VIII',
    parentName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: 'Near Gandhi Chowk, Boring Road',
    city: 'Patna',
    remarks: 'Seeking admission for Academic Year 2026-27 with school transport'
  });
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null);

  // CRM KPI Counters
  const totalLeads = admissions.length;
  const newLeadsCount = admissions.filter((a) => !a.leadStage || a.leadStage === 'NEW_LEAD').length;
  const whatsappEngagedCount = admissions.filter((a) => a.leadStage === 'WHATSAPP_SENT').length;
  const campusVisitCount = admissions.filter((a) => a.leadStage === 'CAMPUS_VISIT').length;
  const interviewCount = admissions.filter((a) => a.leadStage === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_SCHEDULED').length;
  const enrolledCount = admissions.filter((a) => a.leadStage === 'ENROLLED' || a.status === 'ENROLLED').length;

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAdmission({
      studentName: parentForm.studentName,
      applyingClass: parentForm.applyingClass,
      parentName: parentForm.parentName,
      phone: parentForm.phone,
      whatsappNumber: parentForm.whatsappNumber || parentForm.phone,
      email: parentForm.email || `${parentForm.studentName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      address: parentForm.address,
      city: parentForm.city,
      remarks: parentForm.remarks,
      documentsUploaded: true,
      status: 'SUBMITTED'
    });
    setSubmittedAppNo(`APP-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleSaveCounselorNote = (appId: string) => {
    const currentApp = admissions.find((a) => a.id === appId);
    const currentStage = currentApp?.leadStage || 'NEW_LEAD';
    updateLeadStage(appId, currentStage, counselorNoteText);
    setEditingNoteId(null);
    setCounselorNoteText('');
  };

  const handleWhatsAppClick = (app: OnlineAdmissionApplication) => {
    const waUrl = triggerWhatsAppLeadMessage(app);
    window.open(waUrl, '_blank');
  };

  // Filtered Admissions List
  const filteredAdmissions = admissions.filter((app) => {
    const effectiveStage = app.leadStage || (app.status === 'ENROLLED' ? 'ENROLLED' : app.status === 'INTERVIEW_SCHEDULED' ? 'INTERVIEW_SCHEDULED' : 'NEW_LEAD');
    const matchesStage = stageFilter === 'ALL' || effectiveStage === stageFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      (app.city && app.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <UserPlus className="w-4 h-4" /> Indian School Admissions CRM & Lead Funnel
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Admissions Pipeline & 1-Click SIS Conversion Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            वेबसाइट इंक्वायरी → ऑटो व्हाट्सएप नर्चरिंग → कैंपस विजिट → इंटरव्यू → 1-क्लिक स्टूडेंट प्रोफाइल एनरोलमेंट।
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('CRM_PIPELINE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CRM_PIPELINE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Admissions CRM Pipeline ({totalLeads})
          </button>
          <button
            onClick={() => setActiveTab('PARENT_FORM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PARENT_FORM' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Public Form Simulator
          </button>
        </div>
      </div>

      {activeTab === 'CRM_PIPELINE' && (
        <div className="space-y-6">
          {/* Top Funnel KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div
              onClick={() => setStageFilter('ALL')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                stageFilter === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">Total Inquiries</p>
              <h3 className="text-xl font-black mt-1">{totalLeads}</h3>
              <p className="text-[10px] opacity-70 mt-0.5">All Channels</p>
            </div>

            <div
              onClick={() => setStageFilter('NEW_LEAD')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                stageFilter === 'NEW_LEAD'
                  ? 'bg-amber-500 text-white border-amber-400 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">1. New Leads</p>
              <h3 className="text-xl font-black mt-1 text-amber-500 dark:text-amber-400">{newLeadsCount}</h3>
              <p className="text-[10px] opacity-70 mt-0.5">Subdomain Leads</p>
            </div>

            <div
              onClick={() => setStageFilter('WHATSAPP_SENT')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                stageFilter === 'WHATSAPP_SENT'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">2. WhatsApp Sent</p>
              <h3 className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{whatsappEngagedCount}</h3>
              <p className="text-[10px] opacity-70 mt-0.5">Pack Delivered</p>
            </div>

            <div
              onClick={() => setStageFilter('CAMPUS_VISIT')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                stageFilter === 'CAMPUS_VISIT'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">3. Campus Visit</p>
              <h3 className="text-xl font-black mt-1 text-blue-600 dark:text-blue-400">{campusVisitCount}</h3>
              <p className="text-[10px] opacity-70 mt-0.5">Tour Booked</p>
            </div>

            <div
              onClick={() => setStageFilter('INTERVIEW_SCHEDULED')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                stageFilter === 'INTERVIEW_SCHEDULED'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-purple-400'
              }`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">4. Interview / Test</p>
              <h3 className="text-xl font-black mt-1 text-purple-600 dark:text-purple-400">{interviewCount}</h3>
              <p className="text-[10px] opacity-70 mt-0.5">Doc Verified</p>
            </div>

            <div
              onClick={() => setStageFilter('ENROLLED')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                stageFilter === 'ENROLLED'
                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-emerald-600'
              }`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">5. Enrolled (SIS)</p>
              <h3 className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{enrolledCount}</h3>
              <p className="text-[10px] opacity-70 mt-0.5">Profile Created</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="छात्र, अभिभावक या मोबाइल नंबर से खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Stage:
              </span>
              {(['ALL', 'NEW_LEAD', 'WHATSAPP_SENT', 'CAMPUS_VISIT', 'INTERVIEW_SCHEDULED', 'ENROLLED'] as const).map((stg) => (
                <button
                  key={stg}
                  onClick={() => setStageFilter(stg)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    stageFilter === stg
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {stg === 'ALL' ? 'All Leads' : stg.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Leads CRM List */}
          <div className="space-y-4">
            {filteredAdmissions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <UserPlus className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200">कोई लीड नहीं मिली (No Inquiries Found)</h4>
                <p className="text-slate-500 text-xs">फ़िल्टर बदलकर देखें या पब्लिक वेबसाइट सब-डोमेन पर नया फॉर्म सबमिट करें।</p>
              </div>
            ) : (
              filteredAdmissions.map((app) => {
                const currentStage = app.leadStage || (app.status === 'ENROLLED' ? 'ENROLLED' : app.status === 'INTERVIEW_SCHEDULED' ? 'INTERVIEW_SCHEDULED' : 'NEW_LEAD');
                const isEnrolled = app.status === 'ENROLLED' || currentStage === 'ENROLLED';

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all hover:border-indigo-400/80"
                  >
                    {/* Top Row: Reg No, Student Name, Badges, Stage Dropdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {app.applicationNo}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {app.studentName}
                        </h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {app.applyingClass}
                        </span>

                        {/* Lead Score Indicator */}
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Flame className="w-3 h-3 text-amber-500" /> Lead Score: {app.leadScore || 88}%
                        </span>

                        {/* Auto WhatsApp Dispatch Indicator */}
                        {app.autoMessageSent && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 text-emerald-500" /> Auto WhatsApp Dispatched
                          </span>
                        )}
                      </div>

                      {/* Stage Selector Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold">Stage:</span>
                        <select
                          value={currentStage}
                          disabled={isEnrolled}
                          onChange={(e) => updateLeadStage(app.id, e.target.value as any)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="NEW_LEAD">1. New Lead (Fresh)</option>
                          <option value="WHATSAPP_SENT">2. WhatsApp Sent</option>
                          <option value="CAMPUS_VISIT">3. Campus Visit</option>
                          <option value="INTERVIEW_SCHEDULED">4. Interview / Test</option>
                          <option value="ADMISSION_OFFERED">5. Admission Offered</option>
                          <option value="ENROLLED">6. Enrolled (SIS Active)</option>
                        </select>
                      </div>
                    </div>

                    {/* Middle Row: Contact & Address Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                      <div>
                        <span className="text-slate-400 text-[10px] block">अभिभावक (Parent / Guardian):</span>
                        <b className="text-slate-900 dark:text-white">{app.parentName}</b>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">संपर्क / व्हाट्सएप (Phone):</span>
                        <div className="flex items-center gap-1.5">
                          <b className="font-mono text-slate-900 dark:text-white">{app.whatsappNumber || app.phone}</b>
                          <a
                            href={`https://wa.me/91${(app.whatsappNumber || app.phone).replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-500 hover:text-emerald-400 p-0.5"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">पता एवं शहर (Location):</span>
                        <b className="text-slate-900 dark:text-white flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {app.address || 'Local Campus Area'}, {app.city || 'Patna'}
                        </b>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">आवेदन तिथि एवं स्रोत (Source):</span>
                        <b className="text-slate-900 dark:text-white">
                          {app.submittedDate} ({app.source || 'Public Subdomain'})
                        </b>
                      </div>
                    </div>

                    {/* Inquirer Remarks & Counselor Follow-Up Notes */}
                    <div className="space-y-2">
                      {app.remarks && (
                        <div className="text-xs bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/50 text-amber-900 dark:text-amber-300">
                          💬 <b>अभिभावक की टिप्पणी (Parent Inquiry):</b> {app.remarks}
                        </div>
                      )}

                      {/* Counselor Follow-up Notes */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs">
                        <div className="flex-1">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400 mr-2">
                            📝 काउंसलर फॉलो-अप नोट (Counselor Notes):
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {app.counselorNotes || 'अभी कोई फॉलो-अप नोट दर्ज नहीं किया गया।'}
                          </span>
                        </div>
                        {editingNoteId === app.id ? (
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <input
                              type="text"
                              value={counselorNoteText}
                              onChange={(e) => setCounselorNoteText(e.target.value)}
                              placeholder="नोट लिखें (e.g. Call scheduled for tomorrow)"
                              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => handleSaveCounselorNote(app.id)}
                              className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteId(app.id);
                              setCounselorNoteText(app.counselorNotes || '');
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 text-[11px]"
                          >
                            + नोट अपडेट करें
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1-Click WhatsApp Trigger Button */}
                        <button
                          onClick={() => handleWhatsAppClick(app)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> 1-Click WhatsApp Welcome & Prospectus
                        </button>

                        {/* Call Button */}
                        <a
                          href={`tel:${app.phone}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> Call Parent
                        </a>
                      </div>

                      {/* Convert to Student SIS Action */}
                      <div>
                        {isEnrolled ? (
                          <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4" /> Enrolled in Student SIS
                          </span>
                        ) : (
                          <button
                            onClick={() => approveAdmissionAndCreateStudent(app.id)}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
                          >
                            <UserCheck className="w-4 h-4" /> 1-क्लिक स्टूडेंट में बदलें (Convert to Student SIS Profile)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Public Form Simulator */}
      {activeTab === 'PARENT_FORM' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800 text-center">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Public Online Admission Form Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simulate parent submitting admission for {branding.name} to test instant lead capture and auto-WhatsApp targeting.
            </p>
          </div>

          {submittedAppNo ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-300">
                Application Submitted Successfully!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your Application Registration Number is <b className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{submittedAppNo}</b>.
              </p>
              <button
                onClick={() => {
                  setSubmittedAppNo(null);
                  setActiveTab('CRM_PIPELINE');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
              >
                Return to Admissions CRM Pipeline
              </button>
            </div>
          ) : (
            <form onSubmit={handleParentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={parentForm.studentName}
                  onChange={(e) => setParentForm({ ...parentForm, studentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  placeholder="e.g. Aarav Patel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Applying Class *</label>
                  <select
                    value={parentForm.applyingClass}
                    onChange={(e) => setParentForm({ ...parentForm, applyingClass: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
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
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={parentForm.parentName}
                    onChange={(e) => setParentForm({ ...parentForm, parentName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    placeholder="e.g. Mahesh Patel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mobile / WhatsApp No. *</label>
                  <input
                    type="tel"
                    required
                    value={parentForm.phone}
                    onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                    placeholder="9811223344"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={parentForm.email}
                    onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    placeholder="mahesh.patel@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Address / Locality *</label>
                  <input
                    type="text"
                    required
                    value={parentForm.address}
                    onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">City / District *</label>
                  <input
                    type="text"
                    required
                    value={parentForm.city}
                    onChange={(e) => setParentForm({ ...parentForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Remarks / Query</label>
                <input
                  type="text"
                  value={parentForm.remarks}
                  onChange={(e) => setParentForm({ ...parentForm, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Application & Trigger Lead Pipeline
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
