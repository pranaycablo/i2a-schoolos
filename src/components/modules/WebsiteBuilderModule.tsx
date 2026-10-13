import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Globe,
  ExternalLink,
  UserPlus,
  Phone,
  Mail,
  CheckCircle2,
  MapPin,
  Award,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  School,
  Check,
  Send
} from 'lucide-react';
import { UserRole } from '../../types';

export const WebsiteBuilderModule: React.FC = () => {
  const {
    branding,
    updateBranding,
    feeTypes,
    submitSchoolAdmission,
    setCurrentRole,
    setActiveModule,
    language
  } = useSchool();

  // Active view inside the website preview
  const [siteTab, setSiteTab] = useState<'HOME' | 'ADMISSION' | 'FEES' | 'NOTICES' | 'PORTAL_LOGIN'>('HOME');
  
  // Domain Configuration State
  const [domainMode, setDomainMode] = useState<'SUBDOMAIN' | 'CUSTOM_DOMAIN'>(
    branding.domainType || 'SUBDOMAIN'
  );
  const [customDomainInput, setCustomDomainInput] = useState(
    branding.customDomain || 'www.abcpublicschool.edu.in'
  );
  const [subdomainInput, setSubdomainInput] = useState(
    branding.subdomainSlug || 'abcpublicschool'
  );
  const [isDomainSaved, setIsDomainSaved] = useState(false);

  // Admission Form State
  const [admForm, setAdmForm] = useState({
    studentName: '',
    applyingClass: 'Class VI',
    parentName: '',
    phone: '',
    email: '',
    previousSchool: 'St. Paul High School',
    remarks: 'Applying through School Public Website'
  });
  const [submittedApplicationNo, setSubmittedApplicationNo] = useState<string | null>(null);

  const activeWebsiteUrl =
    domainMode === 'CUSTOM_DOMAIN'
      ? customDomainInput
      : `${subdomainInput}.i2aschool.com`;

  const handleSaveDomain = () => {
    updateBranding({
      domainType: domainMode,
      customDomain: customDomainInput,
      subdomainSlug: subdomainInput,
      website: activeWebsiteUrl
    });
    setIsDomainSaved(true);
    setTimeout(() => setIsDomainSaved(false), 3000);
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admForm.studentName || !admForm.parentName || !admForm.phone) {
      alert('कृपया आवश्यक जानकारी भरें (Please fill all required fields)');
      return;
    }

    const createdApp = submitSchoolAdmission({
      studentName: admForm.studentName,
      applyingClass: admForm.applyingClass,
      parentName: admForm.parentName,
      phone: admForm.phone,
      email: admForm.email || `${admForm.studentName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      remarks: `Previous School: ${admForm.previousSchool}. ${admForm.remarks}`
    });

    setSubmittedApplicationNo(createdApp.applicationNo);
    // Reset fields
    setAdmForm({
      studentName: '',
      applyingClass: 'Class VI',
      parentName: '',
      phone: '',
      email: '',
      previousSchool: '',
      remarks: ''
    });
  };

  const handlePortalQuickLogin = (role: UserRole, targetModule: string) => {
    setCurrentRole(role);
    setActiveModule(targetModule);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Integrated School Website CMS & Live Portal
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            School Website Builder & Public Admission Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            हर स्कूल की अपनी ऑटो-जनरेटेड सुंदर वेबसाइट — सब-डोमेन या खुद के पर्सनल डोमेन पर लाइव।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://${activeWebsiteUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.preventDefault();
              alert(`Simulating redirection to live edge node: https://${activeWebsiteUrl}`);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Visit Live Website
          </a>
        </div>
      </div>

      {/* Domain Mapping & DNS Management Control Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-extrabold text-sm">डोमेन और सब-डोमेन सेटिंग्स (Domain Configuration)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" /> Edge SSL Active (Let's Encrypt 4096-bit)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-bold text-[10px]">
              <Sparkles className="w-3.5 h-3.5" /> Auto CDN Sync
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Domain Routing Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDomainMode('SUBDOMAIN')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                  domainMode === 'SUBDOMAIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                i2A Subdomain
              </button>
              <button
                type="button"
                onClick={() => setDomainMode('CUSTOM_DOMAIN')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                  domainMode === 'CUSTOM_DOMAIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Custom Domain
              </button>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                {domainMode === 'SUBDOMAIN' ? 'Subdomain Slug' : 'School Official Custom Domain (FQDN)'}
              </label>
              <div className="flex items-center">
                {domainMode === 'SUBDOMAIN' ? (
                  <div className="flex items-center w-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                    <input
                      type="text"
                      value={subdomainInput}
                      onChange={(e) => setSubdomainInput(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2 text-white font-mono font-semibold focus:outline-none"
                    />
                    <span className="px-3 text-slate-400 font-mono text-[11px] bg-slate-900 border-l border-slate-700 py-2">
                      .i2aschool.com
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center w-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                    <span className="px-3 text-slate-500 font-mono text-[11px] bg-slate-900 border-r border-slate-700 py-2">
                      https://
                    </span>
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="e.g. www.dpspatna.edu.in"
                      className="flex-1 bg-transparent px-3 py-2 text-white font-mono font-semibold focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveDomain}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 shrink-0 transition-all shadow-md"
            >
              {isDomainSaved ? <Check className="w-4 h-4" /> : null}
              {isDomainSaved ? 'Saved & Deployed!' : 'Save & Deploy Domain'}
            </button>
          </div>
        </div>

        {domainMode === 'CUSTOM_DOMAIN' && (
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              CNAME Record: Point <b className="font-mono text-indigo-400">@</b> or <b className="font-mono text-indigo-400">www</b> to{' '}
              <b className="font-mono text-emerald-400">cname.edge.i2aschoolos.com</b>
            </span>
            <span className="text-slate-500 text-[10px]">DNS Status: Connected & Verified</span>
          </div>
        )}
      </div>

      {/* Live Interactive School Website Preview Window */}
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto">
        {/* Browser Mock Chrome */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-2 ml-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-indigo-400 text-[11px]">https://{activeWebsiteUrl}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold border border-indigo-800">
              Interactive Website Sandbox
            </span>
          </div>
        </div>

        {/* Live School Website Body */}
        <div className="bg-slate-950 p-6 sm:p-8 space-y-8 text-slate-100 font-sans">
          {/* School Website Navigation Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3">
              <img
                src={branding.logoUrl}
                alt="School Logo"
                className="h-12 w-12 object-cover rounded-xl border border-slate-800 shadow-md"
              />
              <div>
                <h3 className="font-black text-lg tracking-tight text-white">{branding.name}</h3>
                <p className="text-[11px] text-slate-400">{branding.tagline}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 font-medium">
                  <span>Affiliated to {branding.board}</span>
                  <span>•</span>
                  <span>Reg: {branding.regNumber}</span>
                  <span>•</span>
                  <span>Session: {branding.academicSession}</span>
                </div>
              </div>
            </div>

            {/* School Website Nav Links */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSiteTab('HOME')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'HOME' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('ADMISSION')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  siteTab === 'ADMISSION'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Apply Online
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('FEES')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'FEES' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fee Structure
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('NOTICES')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'NOTICES' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Notice Board
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('PORTAL_LOGIN')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'PORTAL_LOGIN' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
                }`}
              >
                Portal Login
              </button>
            </div>
          </div>

          {/* TAB 1: HOME */}
          {siteTab === 'HOME' && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-8 sm:p-10 rounded-3xl border border-indigo-900/40 text-center space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <span className="px-3.5 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                  ⚡ Admissions Open for Academic Session {branding.academicSession}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto leading-tight">
                  Nurturing Excellence, Character & Future Leadership
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
                  World-Class Digital Smart Classrooms • AI-Powered Personalized Learning • State-of-the-Art Science & Robotics Labs • GPS Tracked Fleet.
                </p>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setSiteTab('ADMISSION')}
                    className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Start Online Admission
                  </button>
                  <button
                    onClick={() => setSiteTab('FEES')}
                    className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
                  >
                    View Fee Structure
                  </button>
                </div>
              </div>

              {/* Highlights 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <BookOpen className="w-5 h-5 text-indigo-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">Smart Learning</h4>
                  <p className="text-[10px] text-slate-400">Interactive Projectors & AI Practice</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">100% Safe Campus</h4>
                  <p className="text-[10px] text-slate-400">CCTV Surveillance & RFID Gates</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <Award className="w-5 h-5 text-amber-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">Top Academic Ranks</h4>
                  <p className="text-[10px] text-slate-400">Consistent 100% Board Pass Rate</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <Sparkles className="w-5 h-5 text-purple-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">GPS Transport</h4>
                  <p className="text-[10px] text-slate-400">Live Bus Tracking for Parents</p>
                </div>
              </div>

              {/* Principal Message & School Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase">
                    <Award className="w-4 h-4" /> Principal's Desk Message
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "Welcome to {branding.name}. Our objective is to combine academic excellence with high moral values, ensuring every child receives the tools, mentorship, and encouragement to realize their highest potential."
                  </p>
                  <div className="pt-2 border-t border-slate-800">
                    <p className="font-extrabold text-white">{branding.principalName}</p>
                    <p className="text-[10px] text-slate-400">Principal & Academic Director</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-indigo-400 text-xs">Official Contact & Address</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {branding.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {branding.email}
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{branding.address}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ONLINE ADMISSION FORM */}
          {siteTab === 'ADMISSION' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 p-6 rounded-3xl border border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                  <UserPlus className="w-4 h-4" /> Direct Online Admission Form
                </div>
                <h3 className="text-xl font-black text-white">Apply for Admission (2026-2027)</h3>
                <p className="text-slate-300 text-xs">
                  छात्र या अभिभावक सीधे इस फॉर्म को भरकर आवेदन कर सकते हैं। फॉर्म सबमिट होते ही स्कूल की एडमिशन सेल इसे तुरंत वेरिफाई करेगी।
                </p>
              </div>

              {submittedApplicationNo ? (
                <div className="bg-emerald-950/80 border border-emerald-600/80 p-8 rounded-3xl text-center space-y-4 animate-fade-in shadow-xl">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">आवेदन सफलतापूर्वक दर्ज हो गया!</h4>
                    <p className="text-emerald-300 text-xs mt-1">
                      आपका एप्लीकेशन नंबर: <b className="font-mono text-white text-base bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700">{submittedApplicationNo}</b>
                    </p>
                    <p className="text-slate-300 text-xs max-w-md mx-auto mt-2">
                      आपके द्वारा दिए गए नंबर पर व्हाट्सएप पुष्टिकरण भेज दिया गया है। स्कूल की एडमिशन टीम शीघ्र आपसे संपर्क करेगी।
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setSubmittedApplicationNo(null)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                    >
                      नया फॉर्म भरें (Submit Another Application)
                    </button>
                    <button
                      onClick={() => setSiteTab('HOME')}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                    >
                      होम पेज पर जाएं
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAdmissionSubmit} className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">छात्र का पूरा नाम (Student Name) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aryan Kumar"
                        value={admForm.studentName}
                        onChange={(e) => setAdmForm({ ...admForm, studentName: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">किस क्लास में एडमिशन चाहिए (Applying Class) *</label>
                      <select
                        value={admForm.applyingClass}
                        onChange={(e) => setAdmForm({ ...admForm, applyingClass: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">अभिभावक / माता-पिता का नाम *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={admForm.parentName}
                        onChange={(e) => setAdmForm({ ...admForm, parentName: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">व्हाट्सएप / मोबाइल नंबर *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={admForm.phone}
                        onChange={(e) => setAdmForm({ ...admForm, phone: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">ईमेल पता (Email)</label>
                      <input
                        type="email"
                        placeholder="parent@gmail.com"
                        value={admForm.email}
                        onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">पिछला स्कूल (Previous School / Marks)</label>
                    <input
                      type="text"
                      placeholder="e.g. St. Joseph Convent (88% in previous class)"
                      value={admForm.previousSchool}
                      onChange={(e) => setAdmForm({ ...admForm, previousSchool: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> सबमिट करें (Submit Online Admission Form)
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FEES STRUCTURE */}
          {siteTab === 'FEES' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    {language === 'hi' ? 'पारदर्शी फीस संरचना' : 'Official Fee Structure'}
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {language === 'hi' ? `सत्र ${branding.academicSession} के लिए अधिकृत शुल्क विवरण` : `Authorized fee schedule for session ${branding.academicSession}`}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                      <th className="p-3.5">Fee Category</th>
                      <th className="p-3.5">Frequency</th>
                      <th className="p-3.5">Standard Amount</th>
                      <th className="p-3.5">Nature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {feeTypes.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-white">{f.name}</td>
                        <td className="p-3.5 text-slate-400">{f.frequency}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">₹{f.amount.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            f.isOptional ? 'bg-slate-800 text-slate-300' : 'bg-indigo-950 text-indigo-300'
                          }`}>
                            {f.isOptional ? 'Optional' : 'Compulsory'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: NOTICES */}
          {siteTab === 'NOTICES' && (
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-white">
                {language === 'hi' ? 'स्कूल सूचना पट्ट' : 'Official Notice Board'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 font-bold text-[10px] rounded-md">Urgent Notice</span>
                    <span className="text-[10px] text-slate-500 font-mono">10 Oct 2026</span>
                  </div>
                  <h5 className="font-extrabold text-white text-xs">Term-1 Examination Timetable Released</h5>
                  <p className="text-slate-400 text-[11px]">
                    All students of Class VI to XII must check their exam schedules on their student portals.
                  </p>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 font-bold text-[10px] rounded-md">Sports & Events</span>
                    <span className="text-[10px] text-slate-500 font-mono">08 Oct 2026</span>
                  </div>
                  <h5 className="font-extrabold text-white text-xs">Annual Inter-School Football Tournament</h5>
                  <p className="text-slate-400 text-[11px]">
                    Selections will begin next Monday in the main school playground at 07:00 AM.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUICK PORTAL ACCESS GATEWAY */}
          {siteTab === 'PORTAL_LOGIN' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black text-white">स्कूल पोर्टल डायरेक्ट लॉगिन (Authorized Portal Gateway)</h4>
                <p className="text-slate-400 text-xs">
                  अपनी भूमिका चुनें और सीधे अपने डिजिटल डैशबोर्ड में प्रवेश करें।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-center hover:border-purple-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto font-bold">
                    🎓
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs">Student Portal</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">होमवर्क, ऑनलाइन टेस्ट, किताबें और रिजल्ट</p>
                  </div>
                  <button
                    onClick={() => handlePortalQuickLogin('STUDENT', 'homework_learning')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Enter Student Portal
                  </button>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-center hover:border-cyan-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto font-bold">
                    👨‍👩‍👧
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs">Parent Portal</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">फीस भुगतान, हाजिरी अलर्ट, लीव एप्लीकेशन</p>
                  </div>
                  <button
                    onClick={() => handlePortalQuickLogin('PARENT', 'fee_management')}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Enter Parent Portal
                  </button>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-center hover:border-amber-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto font-bold">
                    👩‍🏫
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs">Teacher Portal</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">दैनिक हाजिरी, होमवर्क और AI टेस्ट पेपर</p>
                  </div>
                  <button
                    onClick={() => handlePortalQuickLogin('TEACHER', 'attendance_timetable')}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Enter Teacher Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
