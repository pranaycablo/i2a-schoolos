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
  X
} from 'lucide-react';
import { UserRole } from '../../types';

export const PublicSaasLandingPage: React.FC = () => {
  const {
    tenants,
    registerSchool,
    loginToSchool,
    subscriptionPlans
  } = useSchool();

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
      setRegError('कृपया सभी आवश्यक जानकारी भरें (Please fill all required fields)');
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
    // Direct login to newly created school portal
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
    // Launch ABC Public School Sandbox Demo
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
                  SaaS Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Central Multi-Tenant School ERP & Operating System</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features & Modules</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Subscription Plans</a>
            <a href="#security" className="hover:text-indigo-400 transition-colors">Multi-Tenant Security</a>
            <a href="#support" className="hover:text-indigo-400 transition-colors">Help & Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchDemo}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/40 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" /> Live Demo Sandbox
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 transition-all"
            >
              Create Your School
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 -z-10" />
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Next-Gen Autonomous AI School ERP Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
            Transform Your School Operations with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              i2A SchoolOS
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Register your institution, customize your portal branding, generate AI question papers, manage admissions & fee receipts, auto-solve timetable conflicts, and calculate CBSE/ICSE results — all in one secure multi-tenant cloud platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setShowRegModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Register Your School Now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLaunchDemo}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> Explore Sandbox Demo (ABC School)
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-left">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-indigo-400 font-extrabold text-2xl">23+</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">Core ERP Modules</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-purple-400 font-extrabold text-2xl">100%</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">Multi-Tenant Isolation</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-pink-400 font-extrabold text-2xl">AI Engine</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">Auto Test & Timetable</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-emerald-400 font-extrabold text-2xl">CBSE/ICSE</div>
              <div className="text-slate-400 text-xs mt-0.5 font-medium">Board Compliant Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 px-6 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Built For Modern Indian Schools</span>
            <h2 className="text-3xl font-extrabold text-white">Comprehensive SaaS School Management</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              Everything your principal, accountants, teachers, parents, and students need to collaborate seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">School Onboarding & Branding</h3>
              <p className="text-slate-400 leading-relaxed">
                Configure your school identity, custom logo, fee headers, board affiliation (CBSE/ICSE), and academic session settings with an instant onboarding wizard.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Fee Receipts & Financial Ledger</h3>
              <p className="text-slate-400 leading-relaxed">
                Manage tuition, transport & activity fee structures, generate printable fee receipts, track outstanding balances, and log school expenses.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-pink-950 border border-pink-800 flex items-center justify-center text-pink-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">AI Question Paper & Exam Engine</h3>
              <p className="text-slate-400 leading-relaxed">
                Generate AI exam papers from NCERT digital books, manage teacher approvals, auto-evaluate objective tests, and compute CGPA & report cards.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Timetable & Conflict Engine</h3>
              <p className="text-slate-400 leading-relaxed">
                Automatic period allocation algorithm detecting teacher double-booking, room capacity constraints, workload limits, and daily substitutions.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Parent & Student Portals</h3>
              <p className="text-slate-400 leading-relaxed">
                Dedicated views for parents and students to monitor real-time attendance, homework submissions, fee invoices, report cards, and announcements.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Immutable Security & Audit Trail</h3>
              <p className="text-slate-400 leading-relaxed">
                Strict multi-tenant School ID context isolation, role-based authorization (RBAC), and full audit logging of marks modification and fee transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans & Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Transparent SaaS Pricing</span>
            <h2 className="text-3xl font-extrabold text-white">Select Your School Subscription Plan</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              Flexible pricing suited for small academies, growing schools, and large multi-campus institutions.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  billingCycle === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === 'YEARLY' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly Billing <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">Save 20%</span>
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
                      Most Popular For Schools
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Up to {plan.maxStudents === 999999 ? 'Unlimited' : plan.maxStudents} Students
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹{price.toLocaleString()}</span>
                      <span className="text-slate-400 font-medium">/ month</span>
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
                      setSelectedPlanId(plan.id);
                      setRegForm((prev) => ({ ...prev, planId: plan.id }));
                      setShowRegModal(true);
                    }}
                    className={`w-full py-3 rounded-2xl font-bold transition-all shadow-md ${
                      isPopular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    Select {plan.name} & Register
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Multi-Tenancy Section */}
      <section id="security" className="py-16 px-6 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 text-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-left">
            <h3 className="text-xl font-extrabold text-white">Enterprise Grade Tenant Isolation & Data Safety</h3>
            <p className="text-slate-400 leading-relaxed">
              Each registered school receives a globally unique, immutable School ID (e.g. <code className="text-indigo-300 font-mono">I2A-SCH-100234</code>). All database queries, student files, fee records, and exam papers are strictly scoped to your tenant context, ensuring zero cross-tenant data leaks.
            </p>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer id="support" className="mt-auto border-t border-slate-800 bg-slate-950 py-12 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-slate-300">i2A SchoolOS Platform</span>
            <span>• © 2026 i2A ERP Systems. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-slate-300 transition-colors">Contact Support</a>
            <button
              onClick={() => {
                loginToSchool('I2A-SCH-000001', 'SUPER_ADMIN');
              }}
              className="text-indigo-400 font-bold hover:underline"
            >
              Platform Admin Login
            </button>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-fade-in relative text-xs">
            <button
              onClick={() => setShowRegModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> School Registration Wizard
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Register Your School Portal</h2>
              <p className="text-slate-400 mt-1">
                Receive an instant unique School ID (<code className="text-indigo-300 font-mono">I2A-SCH-XXXXXX</code>) & start setup.
              </p>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 font-semibold">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">School Official Name *</label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier Senior Secondary School"
                  value={regForm.schoolName}
                  onChange={(e) => setRegForm({ ...regForm, schoolName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Principal / Admin Name *</label>
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
                  <label className="block text-slate-400 mb-1 font-medium">Official Email *</label>
                  <input
                    type="email"
                    placeholder="admin@stxaviers.edu.in"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mobile / WhatsApp *</label>
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
                  <label className="block text-slate-400 mb-1 font-medium">Board Affiliation</label>
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
                <label className="block text-slate-400 mb-1 font-medium">Selected Subscription Plan</label>
                <select
                  value={regForm.planId}
                  onChange={(e) => setRegForm({ ...regForm, planId: e.target.value as any })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STARTER">Starter Plan (Up to 250 Students)</option>
                  <option value="PROFESSIONAL">Professional Plan (Up to 1,000 Students)</option>
                  <option value="ENTERPRISE">Enterprise Plan (Unlimited)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all"
              >
                Complete Registration & Launch Portal
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
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">Portal Authentication</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Sign In to School Portal</h2>
              <p className="text-slate-400 mt-1">Select your registered school & user authorization scope.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Registered School</label>
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
                <label className="block text-slate-400 mb-1 font-medium">Login Authorization Scope</label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as UserRole)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRINCIPAL">Principal / Head of School</option>
                  <option value="ADMIN">School Management / Director</option>
                  <option value="TEACHER">Teacher Portal</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="STAFF">Office Staff / Clerk</option>
                  <option value="TRANSPORT">Transport / Bus Driver</option>
                  <option value="PARENT">Parent Portal</option>
                  <option value="STUDENT">Student Portal</option>
                  <option value="SUPER_ADMIN">i2A Platform Central Operator</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all"
              >
                Access School Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
