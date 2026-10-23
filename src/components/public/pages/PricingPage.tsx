import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Sparkles,
  Calculator,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Zap,
  Building2,
  Users
} from 'lucide-react';
import { PublicRoute } from '../../../types';
import { pricingApi, PricingPlanItem, PricingQuoteItem } from '../../../services/apiClient';

interface PricingPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, isHindi = false }) => {
  const [plans, setPlans] = useState<PricingPlanItem[]>([]);
  const [billingCycle, setBillingCycle] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');
  const [studentCount, setStudentCount] = useState<number>(500);
  const [selectedPlanId, setSelectedPlanId] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [quote, setQuote] = useState<PricingQuoteItem | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await pricingApi.getPlans();
        if (res.ok && res.data?.plans) {
          setPlans(res.data.plans);
        }
      } catch {
        // Fallback
      }
    }
    loadPlans();
  }, []);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await pricingApi.getQuote({
          planId: selectedPlanId,
          studentCount,
          durationYears: 1,
          billingCycle
        });
        if (res.ok && res.data?.quote) {
          setQuote(res.data.quote);
        }
      } catch {
        // Fallback
      }
    }
    fetchQuote();
  }, [selectedPlanId, studentCount, billingCycle]);

  const comparisonFeatures = [
    { name: isHindi ? 'छात्र प्रवेश व बायोडाटा रिपॉजिटरी' : 'Student Admissions & Bio-Data SIS', starter: true, pro: true, ent: true },
    { name: isHindi ? 'दैनिक उपस्थिति (वेब व मोबाइल ऐप)' : 'Daily Attendance (Web & Mobile App)', starter: true, pro: true, ent: true },
    { name: isHindi ? 'शुल्क संरचना, चालान व रसीदें' : 'Fee Schedules, Invoicing & Receipts', starter: true, pro: true, ent: true },
    { name: isHindi ? 'सीबीएसई/स्टेट बोर्ड रिपोर्ट कार्ड' : 'CBSE/State Board Report Cards', starter: true, pro: true, ent: true },
    { name: isHindi ? 'अभिभावक-शिक्षक मोबाइल ऐप' : 'Parent Mobile Communication App', starter: true, pro: true, ent: true },
    { name: isHindi ? 'बायोमेट्रिक मशीन सिंक (ZKTeco / eSSL)' : 'Physical Biometric Attendance Sync', starter: false, pro: true, ent: true },
    { name: isHindi ? 'स्कूल बस जीपीएस व लाइव ट्रैकिंग' : 'Live Fleet GPS & Speed Geofencing', starter: false, pro: true, ent: true },
    { name: isHindi ? 'एआई प्रश्न बैंक व ऑनलाइन सीबीटी परीक्षा' : 'AI Question Bank & CBT Exams', starter: false, pro: true, ent: true },
    { name: isHindi ? 'स्टाफ पेरोल व अवकाश प्रबंधन' : 'Staff Workforce & Biometric Payroll', starter: false, pro: true, ent: true },
    { name: isHindi ? 'पुस्तकालय प्रबंधन व बारकोड' : 'Library Management & Barcode Scanners', starter: false, pro: true, ent: true },
    { name: isHindi ? 'मल्टी-ब्रांच ट्रस्ट ट्रेजरी डैशबोर्ड' : 'Multi-Campus Trust Headquarters Portal', starter: false, pro: false, ent: true },
    { name: isHindi ? 'कस्टम सबडोमेन व एसएसएल' : 'Custom Subdomain & Automated SSL', starter: false, pro: false, ent: true },
    { name: isHindi ? 'समर्पित कस्टमर सक्सेस आर्किटेक्ट' : 'Dedicated Technical Account Manager', starter: false, pro: false, ent: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16 font-sans">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'पारदर्शी मूल्य निर्धारण' : 'Transparent Institutional Pricing'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'कोई छिपे शुल्क नहीं। बिना जोखिम 14-दिवसीय ट्रायल।' : 'Simple Per-Student Pricing with Zero Hidden Costs'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'केवल सक्रिय छात्रों के आधार पर पारदर्शी गणना। कोई सेटअप फीस नहीं, कोई अनिवार्य हार्डवेयर लॉक-इन नहीं।'
            : 'Predictable billing scaled strictly to enrolled students. Includes automatic software upgrades, cloud backups, and standard support.'}
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${billingCycle === 'YEARLY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>{isHindi ? 'वार्षिक बिलिंग' : 'Annual Billing'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {isHindi ? '2 माह निःशुल्क (20% बचत)' : '2 Months Free'}
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${billingCycle === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {isHindi ? 'मासिक बिलिंग' : 'Monthly Billing'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Pricing Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isHindi ? 'इंटरएक्टिव छात्र संख्या कैलकुलेटर' : 'Interactive Enrollment Quote Estimator'}
              </h2>
              <p className="text-xs text-slate-400">
                {isHindi ? 'अपने संस्थान के कुल छात्रों के अनुसार त्वरित लागत अनुमान प्राप्त करें।' : 'Slide to your student strength to calculate precise annual subscription & GST.'}
              </p>
            </div>
          </div>

          {/* Plan Selector Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as const).map(pid => (
              <button
                key={pid}
                onClick={() => setSelectedPlanId(pid)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${selectedPlanId === pid ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {pid}
              </button>
            ))}
          </div>
        </div>

        {/* Slider & Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="student-slider" className="font-bold text-slate-300">
              {isHindi ? 'कुल नामांकित छात्र संख्या:' : 'Estimated Student Strength:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="student-count-input"
                type="number"
                min="50"
                max="10000"
                value={studentCount}
                onChange={(e) => setStudentCount(Math.max(50, Math.min(10000, Math.floor(Number(e.target.value)) || 50)))}
                className="w-24 px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-white text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Student count"
              />
              <span className="text-slate-400">{isHindi ? 'छात्र' : 'Students'}</span>
            </div>
          </div>

          <input
            id="student-slider"
            type="range"
            min="50"
            max="3000"
            step="25"
            value={studentCount}
            onChange={(e) => setStudentCount(Math.floor(Number(e.target.value)))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            aria-label="Student strength slider"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>50 Students</span>
            <span>500 Students</span>
            <span>1,000 Students</span>
            <span>2,000 Students</span>
            <span>3,000+ Students</span>
          </div>
        </div>

        {/* Calculated Breakdown Cards */}
        {quote && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-slate-400">{isHindi ? 'प्रति छात्र प्रभावी दर' : 'Per-Student Rate'}</div>
              <div className="text-lg font-bold text-white">
                ₹{quote.effectiveMonthlyPerStudent} <span className="text-[11px] text-slate-400">/mo</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-slate-400">{isHindi ? 'वॉल्यूम छूट' : 'Volume Discount'}</div>
              <div className="text-lg font-bold text-emerald-400">
                {quote.totalDiscountPercent}% Off
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Save ₹{quote.discountAmount.toLocaleString('en-IN')}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-slate-400">{isHindi ? 'जीएसटी (18%)' : 'GST (18% Input Credit)'}</div>
              <div className="text-lg font-bold text-slate-200">
                ₹{quote.gstAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 space-y-1">
              <div className="text-indigo-300 font-bold">{isHindi ? 'वार्षिक कुल देय' : 'Annual Total (with GST)'}</div>
              <div className="text-xl font-black text-white">
                ₹{quote.grandTotalWithGst.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">14-Day Free Trial First</div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center italic mt-4 max-w-3xl mx-auto">
          {isHindi
            ? '* नोट: उपरोक्त गणना एक सांकेतिक अनुमान है। वास्तविक बिलिंग में चुने गए अतिरिक्त मॉड्यूल्स (जैसे बस जीपीएस सिम या कस्टम एसएमएस गेटवे) और अंतिम इनवॉइसिंग शर्तें लागू होंगी। 18% जीएसटी इनपुट टैक्स क्रेडिट (ITC) योग्य है।'
            : '* Note: The calculated total represents a provisional pricing estimate based on standard cloud tiers. Final commercial invoices may vary based on hardware telemetry add-ons (GPS SIM/biometric clocks) and custom institutional service level agreements. 18% GST is eligible for Input Tax Credit (ITC).'}
        </p>
      </div>

      {/* 3 Tier Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan */}
        <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Starter Tier
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {isHindi ? 'स्टार्टर योजना' : 'Starter Plan'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? 'प्रीस्कूल, कोचिंग व ट्यूशन हब हेतु' : 'For tuition academies, preschools & micro-schools'}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-3xl font-black text-white">
                ₹{billingCycle === 'YEARLY' ? '20,000' : '2,000'}
                <span className="text-xs font-normal text-slate-400">/{billingCycle === 'YEARLY' ? 'year base' : 'month'}</span>
              </div>
              <div className="text-xs text-indigo-400 font-semibold mt-1">
                + ₹{billingCycle === 'YEARLY' ? '120' : '12'}/student/{billingCycle === 'YEARLY' ? 'year' : 'month'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Up to 300 students • 25 staff accounts</div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Student SIS & Digital Admissions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Daily Mobile Attendance</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fee Invoicing & Payment Receipts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>CBSE / State Report Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Parent Mobile Experience</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('register')}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            {isHindi ? 'स्टार्टर ट्रायल शुरू करें' : 'Start Free Starter Trial'}
          </button>
        </div>

        {/* Professional Plan (Highlighted) */}
        <div className="p-7 rounded-3xl bg-slate-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-950/40 relative flex flex-col justify-between space-y-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider shadow-md">
            Most Popular for K-12
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Professional Tier
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {isHindi ? 'प्रोफेशनल योजना' : 'Professional Plan'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isHindi ? 'मुख्यधारा K-12 स्कूल व प्रतियोगी कोचिंग हेतु' : 'Full ERP suite for K-12 CBSE/ICSE schools & institutes'}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-3xl font-black text-white">
                ₹{billingCycle === 'YEARLY' ? '40,000' : '4,000'}
                <span className="text-xs font-normal text-slate-400">/{billingCycle === 'YEARLY' ? 'year base' : 'month'}</span>
              </div>
              <div className="text-xs text-indigo-400 font-semibold mt-1">
                + ₹{billingCycle === 'YEARLY' ? '100' : '10'}/student/{billingCycle === 'YEARLY' ? 'year' : 'month'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Up to 1,500 students • 100 staff accounts</div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">All Starter Features Included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Biometric Machine Hardware Sync</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>School Bus Live Fleet GPS Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Question Bank & CBT Online Exams</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Staff Biometric Payroll & Leave Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Online Payment Gateway (UPI / QR)</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('register')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition cursor-pointer"
          >
            {isHindi ? '14-दिवसीय प्रोफेशनल ट्रायल शुरू करें' : 'Start 14-Day Free Trial'}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Enterprise Tier
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {isHindi ? 'एंटरप्राइज योजना' : 'Enterprise Plan'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? 'मल्टी-ब्रांच ट्रस्ट्स, कॉलेज व बड़ी संस्थाओं हेतु' : 'Multi-campus trusts, degree colleges & education groups'}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-3xl font-black text-white">
                ₹{billingCycle === 'YEARLY' ? '80,000' : '8,000'}
                <span className="text-xs font-normal text-slate-400">/{billingCycle === 'YEARLY' ? 'year base' : 'month'}</span>
              </div>
              <div className="text-xs text-indigo-400 font-semibold mt-1">
                + ₹{billingCycle === 'YEARLY' ? '80' : '8'}/student/{billingCycle === 'YEARLY' ? 'year' : 'month'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Up to 10,000 students • Unlimited staff</div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">All Professional Features Included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Campus Trust Headquarters Portal</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Consolidated Cross-Branch Treasury</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom Subdomain & Automated SSL</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dedicated Success Architect & 99.9% SLA</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            {isHindi ? 'एंटरप्राइज प्रस्ताव का अनुरोध करें' : 'Contact Enterprise Sales'}
          </button>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {isHindi ? 'विस्तृत योजना तुलना' : 'Detailed Plan Feature Comparison'}
          </h2>
          <p className="text-xs text-slate-400">
            {isHindi ? 'प्रत्येक योजना में उपलब्ध क्षमताओं की स्पष्ट व पारदर्शी तुलना।' : 'Side-by-side feature matrix to help you select the exact right tier.'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4 sm:p-5">Platform Feature</th>
                <th className="p-4 text-center">Starter</th>
                <th className="p-4 text-center bg-indigo-950/20 text-indigo-300">Professional</th>
                <th className="p-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {comparisonFeatures.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 sm:p-5 font-medium text-slate-200">{f.name}</td>
                  <td className="p-4 text-center">
                    {f.starter ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-4 text-center bg-indigo-950/10">
                    {f.pro ? (
                      <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {f.ent ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
