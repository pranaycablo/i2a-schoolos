import React, { useEffect, useRef } from 'react';
import {
  CreditCard,
  Users,
  Bus,
  ClipboardList,
  Smartphone,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  Zap,
  Shield,
  TrendingUp,
  School,
  ChevronRight,
  Award,
  Globe2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface HomePageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  onOpenLogin: () => void;
  isHindi?: boolean;
}

/* ── Marquee animation via inline style injection ─────────────────────── */
const MARQUEE_STYLE = `
@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee { animation: marquee 28s linear infinite; }
.animate-marquee:hover { animation-play-state: paused; }

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }

@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
.animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
`;

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLogin, isHindi = false }) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!document.getElementById('hp-marquee-style')) {
      const el = document.createElement('style');
      el.id = 'hp-marquee-style';
      el.textContent = MARQUEE_STYLE;
      document.head.appendChild(el);
      styleRef.current = el;
    }
    return () => {
      // keep style alive while navigating; remove only on full unmount if needed
    };
  }, []);

  /* ── Data ──────────────────────────────────────────────────────────── */

  const features = [
    {
      icon: CreditCard,
      title: 'Fee Management',
      desc: 'Automated fee schedules, UPI payment links, instant digital receipts & arrear tracking.',
      color: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
    },
    {
      icon: Users,
      title: 'Smart Attendance',
      desc: 'Biometric & RFID integration, daily roll-call app, SMS absent alerts to parents.',
      color: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
    },
    {
      icon: Bus,
      title: 'Transport GPS',
      desc: 'Live bus tracking, route geofencing, driver app & real-time parent arrival alerts.',
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
    },
    {
      icon: ClipboardList,
      title: 'Online Exams',
      desc: 'AI question bank, CBSE/ICSE rubrics, CBT exams with instant ranking & reports.',
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
    },
    {
      icon: Smartphone,
      title: 'Parent Portal',
      desc: 'Mobile app with fees, attendance, homework, bus location & direct teacher chat.',
      color: 'from-cyan-500 to-teal-600',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
    },
    {
      icon: BarChart3,
      title: 'AI Reports',
      desc: 'Auto-generated board report cards, analytics dashboards & WhatsApp progress shares.',
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      text: 'text-violet-400',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Register Your School',
      desc: 'Sign up in minutes. Add school details, logo, branches and admin accounts.',
      icon: School,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      num: '02',
      title: 'Configure Classes & Fees',
      desc: 'Set classes, sections, subjects, fee structures and academic calendar.',
      icon: Zap,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      num: '03',
      title: 'Go Live Instantly',
      desc: 'Invite staff, parents & students. Collect fees, track attendance from Day 1.',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const stats = [
    { value: '500+', label: 'Schools Onboard', icon: School, color: 'text-indigo-400' },
    { value: '5L+', label: 'Students Managed', icon: Users, color: 'text-emerald-400' },
    { value: '₹50Cr+', label: 'Fee Collected', icon: CreditCard, color: 'text-amber-400' },
    { value: '4.9★', label: 'Average Rating', icon: Star, color: 'text-rose-400' },
  ];

  const testimonials = [
    {
      quote:
        'i2A SchoolOS transformed how we manage fees. Collection is up 40% and zero manual errors since we switched.',
      name: 'Mrs. Rekha Sharma',
      role: 'Principal',
      school: 'Delhi Public Academy, Noida',
      initials: 'RS',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      quote:
        'Parents love the real-time bus tracking and attendance alerts. Our parent satisfaction score jumped to 4.8 stars.',
      name: 'Mr. Arvind Nair',
      role: 'Director',
      school: 'Sunrise International School, Kochi',
      initials: 'AN',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      quote:
        'The AI-generated CBSE report cards saved our staff 200+ hours per term. Best EdTech decision we made.',
      name: 'Dr. Priya Iyer',
      role: 'Academic Head',
      school: 'Vidya Niketan CBSE School, Pune',
      initials: 'PI',
      color: 'from-rose-600 to-pink-600',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹2,999',
      period: '/month',
      desc: 'Perfect for small schools up to 300 students.',
      features: ['Fee Management', 'Attendance Module', 'Parent App', 'Basic Reports', 'Email Support'],
      cta: 'Start Free Trial',
      color: 'border-slate-700',
      badge: null,
      btnClass: 'bg-slate-800 hover:bg-slate-700 text-white',
    },
    {
      name: 'Professional',
      price: '₹6,999',
      period: '/month',
      desc: 'Full-featured for schools up to 1,500 students.',
      features: ['Everything in Starter', 'Transport GPS', 'Online Exams & CBT', 'AI Report Cards', 'WhatsApp Alerts', 'Priority Support'],
      cta: 'Start Free Trial',
      color: 'border-indigo-500',
      badge: 'Most Popular',
      btnClass: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For school groups, trusts & multi-campus setups.',
      features: ['Unlimited Students', 'Multi-Branch Dashboard', 'Custom Integrations', 'SLA Guarantee', 'Dedicated Manager'],
      cta: 'Contact Sales',
      color: 'border-slate-700',
      badge: null,
      btnClass: 'bg-slate-800 hover:bg-slate-700 text-white',
    },
  ];

  const schoolLogos = [
    'Delhi Public School', 'Ryan International', 'DAV Schools', 'Kendriya Vidyalaya',
    'Amity Schools', 'Bal Bharati', 'GD Goenka', 'Lotus Valley', 'Seth Anandram Jaipuria',
    'Mothers International', 'Blue Bells', 'Springdales',
  ];

  // Duplicate for seamless marquee loop
  const logoStrip = [...schoolLogos, ...schoolLogos];

  /* ── Module mock cards (hero screenshot area) ───────────────────────── */
  const mockModules = [
    { label: 'Fee Collection', value: '₹2.4L', sub: 'This Month', color: 'from-emerald-500/20 to-emerald-600/10', icon: CreditCard, iconColor: 'text-emerald-400' },
    { label: 'Attendance', value: '94.2%', sub: 'Today Present', color: 'from-indigo-500/20 to-indigo-600/10', icon: Users, iconColor: 'text-indigo-400' },
    { label: 'Bus Tracking', value: '12 Live', sub: 'Vehicles On Route', color: 'from-amber-500/20 to-amber-600/10', icon: Bus, iconColor: 'text-amber-400' },
    { label: 'Exam Results', value: '87.3%', sub: 'Class Average', color: 'from-rose-500/20 to-rose-600/10', icon: ClipboardList, iconColor: 'text-rose-400' },
    { label: 'Parent Msgs', value: '1,240', sub: 'Sent Today', color: 'from-cyan-500/20 to-cyan-600/10', icon: Smartphone, iconColor: 'text-cyan-400' },
    { label: 'AI Reports', value: '48', sub: 'Generated Today', color: 'from-violet-500/20 to-violet-600/10', icon: BarChart3, iconColor: 'text-violet-400' },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 sm:py-28 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #1e3a8a 75%, #1e1b4b 100%)' }}
        aria-label="Hero"
      >
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-1/3 right-10 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm">
            <span className="text-base">🇮🇳</span>
            <span>India's #1 School Management Platform</span>
            <span className="hidden sm:flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              TRUSTED
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]">
            Manage Your School
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)' }}
            >
              with Intelligence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Complete CBSE / ICSE / State board school ERP —&nbsp;
            <span className="text-white font-semibold">Fee, Attendance, Transport, Exams &amp; More</span>
            &nbsp;— all in one beautiful platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={() => onNavigate('register')}
              className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white text-slate-900 font-extrabold text-sm sm:text-base shadow-2xl hover:shadow-white/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              Start Free Trial
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-transparent border-2 border-white/30 text-white font-bold text-sm sm:text-base hover:bg-white/10 hover:border-white/50 transition-all duration-200 cursor-pointer backdrop-blur-sm"
            >
              <Play className="w-4 h-4 text-indigo-300 fill-indigo-300" />
              Watch Demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4">
            {[
              { icon: School, label: '500+ Schools' },
              { icon: Users, label: '5L+ Students' },
              { icon: Shield, label: '99.9% Uptime' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-300" />
                </div>
                {label}
              </div>
            ))}
          </div>

          {/* Hero product screenshot */}
          <div className="mt-10 sm:mt-14 max-w-3xl mx-auto animate-float">
            <div className="relative rounded-3xl bg-slate-900/80 border border-slate-700/50 shadow-2xl shadow-black/60 backdrop-blur-xl p-1.5 sm:p-2">
              {/* Fake browser bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <div className="flex-1 mx-3 h-4 bg-slate-800 rounded-md flex items-center px-2">
                  <span className="text-[9px] text-slate-500">app.i2aschoolos.in/dashboard</span>
                </div>
                <Globe2 className="w-3 h-3 text-slate-600" />
              </div>
              {/* Module grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                {mockModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.label}
                      className={`rounded-2xl bg-gradient-to-br ${mod.color} border border-slate-700/50 p-3 sm:p-4 text-left space-y-1.5 hover:scale-105 transition-transform duration-200`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mod.iconColor}`} />
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{mod.label}</span>
                      </div>
                      <div className="text-base sm:text-xl font-black text-white">{mod.value}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-500">{mod.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. MARQUEE TRUST LOGOS STRIP
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-slate-950 border-y border-slate-800/60 overflow-hidden" aria-label="Trusted Schools">
        <div className="text-center mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trusted by leading schools across India
          </p>
        </div>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #020617, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #020617, transparent)' }} />
          <div className="flex animate-marquee whitespace-nowrap">
            {logoStrip.map((name, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 mx-6 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs sm:text-sm font-semibold shrink-0 hover:border-indigo-500/40 hover:text-slate-200 transition"
              >
                <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. FEATURES GRID
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-950" aria-label="Features">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-block text-indigo-400 font-bold uppercase tracking-widest text-xs">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              Everything Your School Needs,{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc)' }}>
                In One Place
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              From admission to alumni — manage every workflow with powerful, easy-to-use modules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                >
                  {/* Gradient accent on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`} />
                  <div className={`inline-flex p-3 rounded-2xl ${f.bg} border ${f.border} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${f.text}`} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-indigo-200 transition-colors">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  <div className={`mt-5 flex items-center gap-1.5 text-xs font-semibold ${f.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Learn more <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6" style={{ background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)' }} aria-label="How it works">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="inline-block text-indigo-400 font-bold uppercase tracking-widest text-xs">
              Simple Onboarding
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              Up & Running in{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #34d399, #06b6d4)' }}>
                3 Easy Steps
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative text-center space-y-5">
                  {/* Connector line (not last) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] right-0 h-px bg-gradient-to-r from-indigo-500/40 to-transparent" />
                  )}
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} p-0.5 mx-auto shadow-xl`}>
                    <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-black text-slate-800 leading-none">{step.num}</div>
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-lg">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed px-2">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => onNavigate('register')}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. STATS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="py-16 sm:py-20 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)' }}
        aria-label="Stats"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center space-y-2 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/8 transition">
                  <div className={`flex justify-center mb-2`}>
                    <Icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <div className={`text-3xl sm:text-4xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-slate-300 text-xs sm:text-sm font-medium">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-950" aria-label="Testimonials">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="inline-block text-indigo-400 font-bold uppercase tracking-widest text-xs">
              School Success Stories
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              Loved by{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #f472b6, #818cf8)' }}>
                School Leaders
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col p-7 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.role} · {t.school}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. PRICING PREVIEW
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="py-20 sm:py-28 px-4 sm:px-6"
        style={{ background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)' }}
        aria-label="Pricing"
      >
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="inline-block text-indigo-400 font-bold uppercase tracking-widest text-xs">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              Plans for Every{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc)' }}>
                School Size
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              14-day free trial on all plans · No credit card required · Cancel anytime
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-7 sm:p-8 rounded-3xl bg-slate-900 border-2 ${plan.color} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${plan.name === 'Professional' ? 'shadow-2xl shadow-indigo-600/20 scale-[1.02]' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className="space-y-1 mb-6">
                  <h3 className="text-white font-black text-xl">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{plan.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.name === 'Enterprise' ? onNavigate('contact') : onNavigate('register')}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${plan.btnClass}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('pricing')}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 cursor-pointer transition-colors"
            >
              View full pricing & compare plans →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          8. FINAL CTA BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
        aria-label="Get Started"
      >
        {/* Decorative glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Get started in under 5 minutes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Ready to Transform{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)' }}
            >
              Your School?
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
            Join 500+ schools across India using i2A SchoolOS to automate administration,
            delight parents, and empower teachers. Start your free 14-day trial today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="group inline-flex items-center gap-2.5 px-8 py-4 sm:py-5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm sm:text-base shadow-2xl hover:shadow-white/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              Start Free Trial
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2.5 px-8 py-4 sm:py-5 rounded-2xl border-2 border-slate-700 text-slate-200 font-bold text-sm sm:text-base hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 cursor-pointer"
            >
              Talk to an Expert
            </button>
          </div>

          {/* Micro-trust row */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
            {[
              { icon: Shield, label: 'No Credit Card Required' },
              { icon: CheckCircle, label: '14-Day Free Trial' },
              { icon: TrendingUp, label: 'Cancel Anytime' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
