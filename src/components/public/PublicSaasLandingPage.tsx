import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  School,
  Sparkles,
  CheckCircle2,
  Building2,
  Users,
  CreditCard,
  BookOpen,
  Calendar,
  ShieldCheck,
  Award,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  PhoneCall,
  FileText,
  HelpCircle,
  Play,
  Check,
  X,
  ShoppingBag,
  Bus,
  Layers,
  Smartphone
} from 'lucide-react';
import { UserRole } from '../../types';

export const PublicSaasLandingPage: React.FC = () => {
  const {
    tenants,
    registerSchool,
    loginToSchool,
    subscriptionPlans,
    language,
    setLanguage
  } = useSchool();

  const isHindi = language === 'hi';

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');

  // School Registration Form State
  const [regForm, setRegForm] = useState({
    schoolName: '',
    adminName: '',
    email: '',
    phone: '',
    city: '',
    board: 'CBSE' as 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB',
    planId: 'PROFESSIONAL' as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  });
  const [regError, setRegError] = useState('');

  // Portal Login Form State
  const [loginSchoolId, setLoginSchoolId] = useState(tenants[0]?.id || 'I2A-SCH-000001');
  const [loginRole, setLoginRole] = useState<UserRole>('PRINCIPAL');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.schoolName.trim() || !regForm.adminName.trim() || !regForm.email.trim() || !regForm.phone.trim()) {
      setRegError(isHindi ? 'कृपया सभी आवश्यक जानकारी भरें।' : 'Please fill all required fields.');
      return;
    }
    setRegError('');
    const newTenant = registerSchool({
      name: regForm.schoolName,
      adminName: regForm.adminName,
      adminEmail: regForm.email,
      adminPhone: regForm.phone,
      city: regForm.city || 'Patna',
      board: regForm.board,
      planId: regForm.planId,
      billingCycle
    });
    setShowRegModal(false);
    loginToSchool(newTenant.id, 'PRINCIPAL');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === 'SUPER_ADMIN') {
      loginToSchool(loginSchoolId, 'SUPER_ADMIN');
    } else {
      loginToSchool(loginSchoolId, loginRole);
    }
    setShowLoginModal(false);
  };

  const handleLaunchDemo = () => {
    loginToSchool('I2A-SCH-000001', 'PRINCIPAL');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* SaaS Public Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <School className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  i2A SchoolOS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-300">
                  {isHindi ? 'सॉस प्लेटफॉर्म' : 'SaaS Platform'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isHindi ? 'भारत का अग्रणी स्वायत्त स्कूल ईआरपी व ऑपरेटिंग सिस्टम' : 'Central Multi-Tenant School ERP & Operating System'}
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">
              {isHindi ? 'मुख्य सुविधाएं' : 'Features & Modules'}
            </a>
            <a href="#ai-platform" className="hover:text-indigo-400 transition-colors">
              {isHindi ? 'एआई कोपायलट' : 'AI Copilot'}
            </a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">
              {isHindi ? 'सब्सक्रिप्शन प्लान्स' : 'Subscription Plans'}
            </a>
            <a href="#security" className="hover:text-indigo-400 transition-colors">
              {isHindi ? 'डेटा सुरक्षा' : 'Data Security'}
            </a>
          </nav>

          {/* Action CTAs & Language Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(isHindi ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-800/50 transition-all cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isHindi ? 'English' : 'हिन्दी'}</span>
            </button>

            <button
              onClick={handleLaunchDemo}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" /> {isHindi ? 'सैंडबॉक्स डेमो देखें' : 'Live Demo Sandbox'}
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              {isHindi ? 'लॉगिन करें' : 'Sign In'}
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {isHindi ? 'नया स्कूल शुरू करें' : 'Create Your School'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Showcase Visual Mockup */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 -z-10" />
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            {isHindi ? 'भारत का अगली पीढ़ी का स्वायत्त एआई स्कूल प्रबंधन प्लेटफॉर्म' : 'Next-Gen Autonomous AI School ERP Platform for India'}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white max-w-4xl mx-auto">
            {isHindi ? (
              <>
                अपने विद्यालय संचालन को आधुनिक बनाएं{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  i2A SchoolOS के साथ
                </span>
              </>
            ) : (
              <>
                Transform Your School Operations with{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  i2A SchoolOS
                </span>
              </>
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            {isHindi
              ? 'नया स्कूल रजिस्टर करें, अपनी ब्रांडिंग जोड़ें, एआई प्रश्न पत्र बनाएं, फीस रसीद व यूपीआई संग्रह प्रबंधित करें, समय-सारणी के टकराव सुलझाएं और सीबीएसई/आईसीएसई रिपोर्ट कार्ड तैयार करें।'
              : 'Register your institution, customize your portal branding, generate AI question papers, manage online admissions & automated fee receipts, auto-solve timetable conflicts, and calculate CBSE/ICSE results — all in one secure multi-tenant cloud platform.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setShowRegModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              {isHindi ? 'अभी अपना स्कूल रजिस्टर करें' : 'Register Your School Now'} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLaunchDemo}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              {isHindi ? 'लाइव सैंडबॉक्स डेमो देखें (एबीसी पब्लिक स्कूल)' : 'Explore Sandbox Demo (ABC School)'}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left max-w-4xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-indigo-400 font-extrabold text-2xl">23+</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">
                {isHindi ? 'मुख्य ईआरपी मॉड्यूल' : 'Core ERP Modules'}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-purple-400 font-extrabold text-2xl">100%</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">
                {isHindi ? 'मल्टी-टेनेंट डेटा पृथक्करण' : 'Multi-Tenant Isolation'}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-pink-400 font-extrabold text-2xl">AI Core</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">
                {isHindi ? 'स्वचालित टेस्ट व नोटिस' : 'Auto Test & Timetable'}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-emerald-400 font-extrabold text-2xl">CBSE / ICSE</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">
                {isHindi ? 'बोर्ड प्रमाणित ढांचा' : 'Board Compliant Engine'}
              </div>
            </div>
          </div>

          {/* Hero Promotional Mockup Image Banner */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden backdrop-blur-xl group">
              <div className="absolute top-4 left-6 flex items-center gap-2 z-10">
                <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                <span className="ml-2 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] text-indigo-300 font-mono">
                  https://schoolos.in/portal/live-dashboard
                </span>
              </div>
              <img
                src="./images/hero-banner.png"
                alt="i2A SchoolOS Enterprise Dashboard"
                className="w-full rounded-2xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-6 right-6 z-10 px-4 py-2 rounded-2xl bg-slate-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-2 shadow-xl backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {isHindi ? 'सीबीएसई एवं एनईपी 2020 प्रमाणित प्लेटफॉर्म' : '100% CBSE & NEP 2020 Aligned'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Feature Highlights (3 Key Showcase Cards with Images) */}
      <section id="ai-platform" className="py-16 px-6 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              {isHindi ? 'अत्याधुनिक नवाचार' : 'Built for Excellence'}
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {isHindi ? 'भारतीय विद्यालयों के लिए विशिष्ट सुविधाएं' : 'Enterprise Modules Designed for Indian Schools'}
            </h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              {isHindi
                ? 'एआई प्रश्न पत्र निर्माता से लेकर मोबाइल अभिभावक ऐप और स्कूल स्टोर तक, सभी सुविधाएं एक साथ।'
                : 'From AI-generated question papers to native mobile webapps and authorized campus stores.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Visual Card 1: AI Exam Generator */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between group hover:border-indigo-500/60 transition-all shadow-xl">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {isHindi ? 'एआई शैक्षणिक इंजन' : 'AI Academic Engine'}
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-extrabold text-lg text-white">
                  {isHindi ? '1-क्लिक एआई प्रश्न पत्र निर्माता' : '1-Click AI Question Paper Generator'}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {isHindi
                    ? 'एनसीईआरटी पाठ्यपुस्तकों से ब्लूम्स टैक्सोनॉमी अनुरूप बहुविकल्पीय व वर्णनात्मक प्रश्न पत्र तैयार करें, शिक्षक समीक्षा और प्रधानाचार्य अनुमोदन लॉक के साथ।'
                    : 'Generate Bloom\'s taxonomy-aligned CBSE exam papers with blueprints, MCQs, and subjective marking schemes in seconds.'}
                </p>
              </div>
              <div className="px-6 pb-6">
                <img
                  src="./images/ai-exam-banner.png"
                  alt="AI Exam Generator"
                  className="w-full h-44 object-cover rounded-2xl border border-slate-800 group-hover:scale-[1.02] transition-transform"
                />
              </div>
            </div>

            {/* Visual Card 2: Parent WebApp & Bus Tracking */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition-all shadow-xl">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {isHindi ? 'अभिभावक मोबाइल वेबऐप' : 'Parent Mobile WebApp'}
                  </span>
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-lg text-white">
                  {isHindi ? 'लाइव बस जीपीएस व यूपीआई फीस' : 'Live Bus GPS & Instant UPI Payments'}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {isHindi
                    ? 'अभिभावकों के लिए बिना ऐप स्टोर जाए 1-क्लिक नेटिव वेबऐप, जहां लाइव स्कूल बस ट्रैकिंग, उपस्थिति अलर्ट एवं यूपीआई द्वारा त्वरित फीस रसीद उपलब्ध है।'
                    : 'Native zero-install mobile webapp with real-time GPS school bus route tracking, instant UPI fee clearance, and progress cards.'}
                </p>
              </div>
              <div className="px-6 pb-6">
                <img
                  src="./images/parent-app-banner.png"
                  alt="Parent Mobile App & Bus Tracking"
                  className="w-full h-44 object-cover rounded-2xl border border-slate-800 group-hover:scale-[1.02] transition-transform"
                />
              </div>
            </div>

            {/* Visual Card 3: School Store & Uniforms */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between group hover:border-purple-500/60 transition-all shadow-xl">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800">
                    {isHindi ? 'आधिकारिक स्कूल स्टोर' : 'Campus Store'}
                  </span>
                  <ShoppingBag className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-extrabold text-lg text-white">
                  {isHindi ? 'स्कूल स्टोर एवं यूनिफॉर्म किट' : 'Official Uniforms & Book Kit Store'}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {isHindi
                    ? 'स्कूल-मान्यता प्राप्त यूनिफॉर्म, टाई, जूते, एनसीईआरटी किताबें एवं प्रयोगशाला सामग्री सीधे अभिभावक पोर्टल से ऑर्डर करें, कक्षा में सीधी डिलीवरी।'
                    : 'Direct pre-ordering for authorized school uniforms, ties, textbooks, and science kits with direct classroom fulfillment.'}
                </p>
              </div>
              <div className="px-6 pb-6">
                <img
                  src="./images/school-store-banner.png"
                  alt="Official School Store"
                  className="w-full h-44 object-cover rounded-2xl border border-slate-800 group-hover:scale-[1.02] transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 px-6 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              {isHindi ? 'संपूर्ण ईआरपी ढांचा' : 'Comprehensive ERP Suite'}
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {isHindi ? 'प्रधानाचार्य से लेकर अभिभावक तक निर्बाध सहयोग' : 'End-to-End Multi-Tenant Collaboration'}
            </h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              {isHindi
                ? 'सभी शैक्षणिक, वित्तीय, प्रशासनिक एवं सुरक्षा मॉड्यूल एक ही एकीकृत प्लेटफॉर्म पर।'
                : 'Everything your principal, accountants, teachers, parents, and students need to collaborate seamlessly.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isHindi ? 'स्कूल सेटअप व ब्रांडिंग' : 'School Onboarding & Branding'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {isHindi
                  ? 'स्कूल का लोगो, नाम, बोर्ड संबद्धता (सीबीएसई/आईसीएसई), फीस हेडर एवं सत्र सेटिंग्स तुरंत कॉन्फ़िगर करें।'
                  : 'Configure school identity, custom logo, fee headers, board affiliation (CBSE/ICSE), and academic session settings.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isHindi ? 'फीस संग्रह एवं वित्तीय खाता' : 'Fee Invoicing & Financial Ledger'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {isHindi
                  ? 'ट्यूशन, वाहन एवं सह-पाठ्यक्रम फीस संरचना बनाएं, आधिकारिक रसीदें निकालें और बकाया राशि का ट्रैक रखें।'
                  : 'Manage tuition, transport & activity fee structures, generate printable fee receipts, track outstanding balances, and log school expenses.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-pink-950 border border-pink-800 flex items-center justify-center text-pink-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isHindi ? 'एआई कोपायलट व परीक्षा इंजन' : 'AI Copilot & Exam Automation'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {isHindi
                  ? 'प्राकृतिक भाषा में स्कूल डेटा विश्लेषण, आधिकारिक नोटिस ड्राफ्टर, उपचारात्मक वर्कशीट और सीबीएसई परिणाम।'
                  : 'Generate AI exam papers, manage teacher approvals, auto-evaluate objective tests, and compute CGPA & report cards.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isHindi ? 'समय सारणी व टकराव समाधान' : 'Timetable & Conflict Engine'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {isHindi
                  ? 'शिक्षक डबल-बुकिंग रोकथाम, कमरा आवंटन, कार्यभार सीमा एवं अनुपस्थित शिक्षकों के लिए त्वरित प्रतिस्थापन।'
                  : 'Automatic period allocation algorithm detecting teacher double-booking, room capacity constraints, workload limits, and daily substitutions.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isHindi ? 'अभिभावक एवं छात्र पोर्टल' : 'Parent & Student Portals'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {isHindi
                  ? 'दैनिक उपस्थिति, गृहकार्य समीक्षा, फीस रसीदें, टर्म प्रगति पत्रक एवं स्कूल परिपत्र का रीयल-टाइम अपडेट।'
                  : 'Dedicated views for parents and students to monitor real-time attendance, homework submissions, fee invoices, report cards, and announcements.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isHindi ? 'सुरक्षा एवं फोरेंसिक ऑडिट' : 'Immutable Security & Audit Trail'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {isHindi
                  ? 'कठोर मल्टी-टेनेंट स्कूल आईडी अलगाव, भूमिका-आधारित पहुंच नियंत्रण (RBAC) एवं अंकों व वित्तीय लेनदेन का ऑडिट लॉग।'
                  : 'Strict multi-tenant School ID context isolation, role-based authorization (RBAC), and full audit logging of marks modification and fee transactions.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans & Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              {isHindi ? 'पारदर्शी सॉस शुल्क' : 'Transparent SaaS Pricing'}
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {isHindi ? 'अपने विद्यालय के अनुरूप योजना चुनें' : 'Select Your School Subscription Plan'}
            </h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              {isHindi
                ? 'छोटे अकादमियों से लेकर बड़े बहु-शाखा शैक्षणिक संस्थानों तक अनुकूलित योजनाएं।'
                : 'Flexible pricing suited for small academies, growing schools, and large multi-campus institutions.'}
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  billingCycle === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isHindi ? 'मासिक बिलिंग' : 'Monthly Billing'}
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === 'YEARLY' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isHindi ? 'वार्षिक बिलिंग' : 'Yearly Billing'} <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">{isHindi ? '20% बचत' : 'Save 20%'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {subscriptionPlans.map((plan) => {
              const isPopular = plan.id === 'PROFESSIONAL';
              const price = billingCycle === 'YEARLY' ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-slate-900 rounded-3xl p-8 border flex flex-col justify-between space-y-6 transition-all ${
                    isPopular
                      ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-2xl shadow-indigo-500/20 scale-105'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-md">
                      {isHindi ? 'स्कूलों द्वारा सर्वाधिक चयनित' : 'Most Popular For Schools'}
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-slate-400 text-xs mt-1">
                        {isHindi ? `अधिकतम ${plan.maxStudents === 999999 ? 'असीमित' : plan.maxStudents} छात्र` : `Up to ${plan.maxStudents === 999999 ? 'Unlimited' : plan.maxStudents} Students`}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹{price.toLocaleString()}</span>
                      <span className="text-slate-400 font-medium">{isHindi ? '/ माह' : '/ month'}</span>
                    </div>

                    <ul className="space-y-2.5 pt-4 border-t border-slate-800">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setRegForm({ ...regForm, planId: plan.id as any });
                      setShowRegModal(true);
                    }}
                    className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:opacity-95'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isHindi ? 'यह योजना चुनें' : 'Select Plan'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="security" className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <School className="w-5 h-5 text-indigo-400" />
            <span className="font-extrabold text-slate-200 text-sm">i2A SchoolOS</span>
            <span>• {isHindi ? 'भारत का अग्रणी स्कूल ईआरपी प्लेटफॉर्म' : 'India\'s Premier Multi-Tenant School ERP'}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> 256-Bit SSL Encrypted
            </span>
            <span>Session 2026-27</span>
          </div>
        </div>
      </footer>

      {/* School Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-fade-in relative text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                {isHindi ? 'त्वरित विद्यालय पंजीकरण' : 'Instant Institutional Onboarding'}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {isHindi ? 'नया स्कूल रजिस्टर करें' : 'Register Your School'}
              </h2>
              <p className="text-slate-400 mt-1">
                {isHindi ? 'तुरंत अपना पोर्टल बनाएं और लॉगिन क्रेडेंशियल्स ईमेल पर प्राप्त करें।' : 'Setup your cloud school instance with instant credentials dispatched to your email.'}
              </p>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 font-bold">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {isHindi ? 'विद्यालय का आधिकारिक नाम *' : 'School Official Name *'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier's International Academy"
                  value={regForm.schoolName}
                  onChange={(e) => setRegForm({ ...regForm, schoolName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {isHindi ? 'प्रधानाचार्य / डायरेक्टर का नाम *' : 'Principal / Director Name *'}
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Rajesh Sharma"
                    value={regForm.adminName}
                    onChange={(e) => setRegForm({ ...regForm, adminName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {isHindi ? 'आधिकारिक ईमेल *' : 'Official Email *'}
                  </label>
                  <input
                    type="email"
                    placeholder="principal@stxaviers.edu.in"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {isHindi ? 'मोबाइल नंबर (व्हाट्सएप) *' : 'Mobile / WhatsApp *'}
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {isHindi ? 'बोर्ड संबद्धता' : 'Board Affiliation'}
                  </label>
                  <select
                    value={regForm.board}
                    onChange={(e) => setRegForm({ ...regForm, board: e.target.value as any })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CBSE">CBSE Board</option>
                    <option value="ICSE">ICSE Board</option>
                    <option value="STATE_BOARD">State Board</option>
                    <option value="IB">IB International</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {isHindi ? 'चयनित सब्सक्रिप्शन योजना' : 'Selected Subscription Plan'}
                </label>
                <select
                  value={regForm.planId}
                  onChange={(e) => setRegForm({ ...regForm, planId: e.target.value as any })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STARTER">{isHindi ? 'स्टार्टर योजना (250 छात्रों तक)' : 'Starter Plan (Up to 250 Students)'}</option>
                  <option value="PROFESSIONAL">{isHindi ? 'प्रोफेशनल योजना (1,000 छात्रों तक)' : 'Professional Plan (Up to 1,000 Students)'}</option>
                  <option value="ENTERPRISE">{isHindi ? 'एंटरप्राइज योजना (असीमित)' : 'Enterprise Plan (Unlimited)'}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isHindi ? 'पंजीकरण पूर्ण करें व पोर्टल खोलें' : 'Complete Registration & Launch Portal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Portal Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-fade-in relative text-xs">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                {isHindi ? 'पोर्टल प्रमाणीकरण' : 'Portal Authentication'}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {isHindi ? 'स्कूल पोर्टल में लॉगिन करें' : 'Sign In to School Portal'}
              </h2>
              <p className="text-slate-400 mt-1">
                {isHindi ? 'अपना पंजीकृत विद्यालय एवं अधिकृत भूमिका चुनें।' : 'Select your registered school & user authorization scope.'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {isHindi ? 'पंजीकृत स्कूल चुनें' : 'Select Registered School'}
                </label>
                <select
                  value={loginSchoolId}
                  onChange={(e) => setLoginSchoolId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {isHindi ? 'लॉगिन भूमिका (Role)' : 'Login Authorization Scope'}
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as UserRole)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRINCIPAL">{isHindi ? 'प्रधानाचार्य' : 'Principal / Head of School'}</option>
                  <option value="ADMIN">{isHindi ? 'स्कूल प्रबंधन / निदेशक' : 'School Management / Director'}</option>
                  <option value="TEACHER">{isHindi ? 'शिक्षक पोर्टल' : 'Teacher Portal'}</option>
                  <option value="ACCOUNTANT">{isHindi ? 'लेखाधिकारी' : 'Accountant'}</option>
                  <option value="STAFF">{isHindi ? 'कार्यालय सहायक' : 'Office Staff / Clerk'}</option>
                  <option value="TRANSPORT">{isHindi ? 'परिवहन प्रभारी / बस चालक' : 'Transport / Bus Driver'}</option>
                  <option value="PARENT">{isHindi ? 'अभिभावक पोर्टल' : 'Parent Portal'}</option>
                  <option value="STUDENT">{isHindi ? 'विद्यार्थी पोर्टल' : 'Student Portal'}</option>
                  <option value="SUPER_ADMIN">{isHindi ? 'सॉस प्लेटफॉर्म मास्टर एडमिन' : 'i2A Platform Central Operator'}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isHindi ? 'स्कूल पोर्टल खोलें' : 'Access School Portal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
