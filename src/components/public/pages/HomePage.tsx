import React from 'react';
import {
  School,
  Building2,
  GraduationCap,
  Target,
  BookOpen,
  Baby,
  Trophy,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Layers,
  Users,
  CreditCard,
  Bus,
  Clock,
  Play
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface HomePageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  onOpenLogin: () => void;
  isHindi?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLogin, isHindi = false }) => {
  const categories = [
    {
      slug: 'k12-schools',
      name: isHindi ? 'K-12 स्कूल' : 'K-12 Schools',
      subtitle: 'CBSE / ICSE / State Boards',
      tagline: isHindi ? 'प्रवेश से लेकर रिपोर्ट कार्ड व परिवहन तक संपूर्ण समाधान' : 'Admissions, continuous grading, fees & bus GPS',
      icon: School,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      slug: 'school-groups-trusts',
      name: isHindi ? 'स्कूल ग्रुप्स व ट्रस्ट्स' : 'School Groups & Trusts',
      subtitle: 'Multi-Branch Governance',
      tagline: isHindi ? 'केंद्रीय वित्तीय नियंत्रण व शाखा-वार मानकीकृत रिपोर्टिंग' : 'Centralized fee treasury & multi-campus oversight',
      icon: Building2,
      color: 'from-purple-600 to-indigo-600'
    },
    {
      slug: 'colleges-higher-ed',
      name: isHindi ? 'कॉलेज व उच्च शिक्षा' : 'Higher Ed Colleges',
      subtitle: 'NEP 2020 & CBCS Matrix',
      tagline: isHindi ? 'क्रेडिट आधारित ग्रेडिंग, विभाग आवंटन व प्लेसमेंट सेल' : 'Course electives, semester hall tickets & placements',
      icon: GraduationCap,
      color: 'from-cyan-600 to-blue-600'
    },
    {
      slug: 'coaching-institutes',
      name: isHindi ? 'कोचिंग व टेस्ट-प्रेप' : 'Coaching Institutes',
      subtitle: 'JEE / NEET / UPSC',
      tagline: isHindi ? 'बैच-वार टाइमटेबल, ऑनलाइन टेस्ट सीरीज व रैंक एनालिटिक्स' : 'Batch scheduling, CBT tests & percentile analytics',
      icon: Target,
      color: 'from-amber-600 to-orange-600'
    },
    {
      slug: 'tuition-centres',
      name: isHindi ? 'ट्यूशन सेंटर्स' : 'Tuition Centres',
      subtitle: 'Micro-Academies & Tutors',
      tagline: isHindi ? 'त्वरित मोबाइल अटेंडेंस, यूपीआई फीस व होमवर्क ब्रॉडकास्ट' : 'Fast check-in, UPI fee links & parent WhatsApp cards',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      slug: 'preschools',
      name: isHindi ? 'प्रीस्कूल व डेकेयर' : 'Preschools & Daycares',
      subtitle: 'Toddlers & Kindergarten',
      tagline: isHindi ? 'माइलस्टोन ट्रैकिंग, सुरक्षा लॉग्स व खुशहाल पेरेंट फीड' : 'Milestone logs, daily meal/nap notes & photo moments',
      icon: Baby,
      color: 'from-pink-600 to-rose-600'
    },
    {
      slug: 'sports-arts-academies',
      name: isHindi ? 'स्पोर्ट्स व कला एकेडमी' : 'Sports & Arts Academies',
      subtitle: 'Athletics & Performing Arts',
      tagline: isHindi ? 'कोर्ट/स्टुडियो स्लॉट शेड्यूलिंग, बेल्ट ग्रेडिंग व टूर्नामेंट रोस्टर' : 'Court reservations, belt assessments & competition rosters',
      icon: Trophy,
      color: 'from-violet-600 to-purple-600'
    }
  ];

  const highlights = [
    {
      icon: School,
      title: isHindi ? 'स्मार्ट छात्र सूचना प्रणाली (SIS)' : 'Comprehensive Student SIS',
      desc: isHindi ? 'डिजिटल प्रवेश फॉर्म, दस्तावेज सत्यापन और छात्र प्रोफाइल प्रबंधन।' : 'End-to-end digital admissions, document repository, and student biodata.'
    },
    {
      icon: CreditCard,
      title: isHindi ? 'स्वचालित फीस ट्रेजरी व यूपीआई' : 'Automated Fee Treasury & UPI',
      desc: isHindi ? 'मासिक/त्रैमासिक चालान, यूपीआई भुगतान लिंक और तत्काल डिजिटल रसीदें।' : 'Automated fee schedule generation, payment links, and instant receipts.'
    },
    {
      icon: Layers,
      title: isHindi ? 'सीबीएसई व बोर्ड रिपोर्ट कार्ड' : 'Board-Compliant Evaluation',
      desc: isHindi ? 'सीबीएसई, आईसीएसई व स्टेट बोर्ड के अनुसार मार्कशीट व समग्र मूल्यांकन।' : 'Pre-configured scholastic & co-scholastic rubrics for all major boards.'
    },
    {
      icon: Bus,
      title: isHindi ? 'लाइव स्कूल बस जीपीएस ट्रैकिंग' : 'Live Fleet GPS & Geofencing',
      desc: isHindi ? 'बस चालकों के लिए मोबाइल ऐप, गति अलर्ट और अभिभावकों हेतु लाइव मैप।' : 'Real-time vehicle tracking, route geofences, and parent arrival alerts.'
    },
    {
      icon: Clock,
      title: isHindi ? 'बायोमेट्रिक व आरएफआईडी अटेंडेंस' : 'Hardware Biometric Attendance',
      desc: isHindi ? 'ZKTeco व eSSL डिवाइसों से स्वचालित पंच सिंक और अनुपस्थिति एसएमएस।' : 'Direct integration with physical turnstiles, RFID cards, and biometric clocks.'
    },
    {
      icon: Sparkles,
      title: isHindi ? 'एआई क्वेश्चन बैंक व ऑनलाइन परीक्षा' : 'AI Question Bank & CBT Exams',
      desc: isHindi ? 'अध्याय-वार स्वतः प्रश्न पत्र निर्माण, टाइमर आधारित ऑनलाइन टेस्ट।' : 'Automated test paper generation and online CBT exams with instant ranking.'
    }
  ];

  return (
    <div className="space-y-20 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-8" aria-label="Hero">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-semibold animate-fade-in shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isHindi ? 'भारत का अग्रणी स्वायत्त स्कूल ऑपरेटिंग सिस्टम' : 'Next-Gen Multi-Tenant Education Operating System'}</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-300">DPDP Act 2023 Architecture Readiness</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          {isHindi ? (
            <>
              भारतीय शिक्षण संस्थानों हेतु{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                आधुनिक, स्वायत्त व सुरक्षित
              </span>{' '}
              क्लाउड ईआरपी
            </>
          ) : (
            <>
              The Autonomous ERP Operating System for{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Indian Schools & Institutions
              </span>
            </>
          )}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isHindi
            ? 'प्रवेश, दैनिक उपस्थिति, सीबीएसई मूल्यांकन, डिजिटल फीस, स्कूल बस ट्रैकिंग और अभिभावक ऐप — सभी 7 शैक्षणिक श्रेणियों के लिए एक एकीकृत, मजबूत प्लेटफॉर्म।'
            : 'Unite paperless admissions, automated fee reconciliation, board-compliant report cards, biometric attendance, fleet GPS, and parent mobile engagement in one ultra-reliable cloud platform.'}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
          >
            <span>{isHindi ? '14-दिवसीय निःशुल्क ट्रायल शुरू करें' : 'Start 14-Day Free Trial'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('solutions')}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center gap-2"
          >
            <span>{isHindi ? '7 शैक्षणिक श्रेणियां देखें' : 'Explore 7 Categories'}</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="px-5 py-3.5 rounded-2xl text-slate-400 hover:text-white font-semibold text-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 text-indigo-400" />
            <span>{isHindi ? 'स्कूल पोर्टल लॉगिन' : 'Institutional Sign In'}</span>
          </button>
        </div>

        {/* Factual Live Metrics Banner */}
        <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl font-black text-indigo-400">99.9%</div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">{isHindi ? 'क्लाउड अपटाइम एसएलए' : 'Uptime SLA'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl font-black text-emerald-400">7</div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">{isHindi ? 'संस्थान श्रेणियां' : 'Supported Verticals'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl font-black text-purple-400">100%</div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">{isHindi ? 'डेटा संप्रभुता (भारत)' : 'Indian Data Residency'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl font-black text-pink-400">14 Days</div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">{isHindi ? 'जोखिम-मुक्त ट्रायल' : 'Zero-Risk Full Trial'}</div>
          </div>
        </div>
      </section>

      {/* 7 Educational Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8" aria-label="Educational Categories">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
            {isHindi ? 'विशिष्ट शैक्षणिक श्रेणियां' : 'Purpose-Built Educational Modules'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isHindi ? 'प्रत्येक प्रकार के संस्थान हेतु अनुकूलित ऑपरेटिंग सिस्टम' : 'Engineered for Every Educational Institution Type'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isHindi
              ? 'चाहे सिंगल-कैंपस स्कूल हो या 50+ शाखाओं का एजुकेशनल ट्रस्ट, i2A SchoolOS प्रत्येक वर्कफ़्लो के अनुकूल है।'
              : 'From standalone preschools to university degree colleges and multi-branch educational trusts.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.slug}
                onClick={() => onNavigate('category-detail', cat.slug)}
                className="group p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {cat.subtitle}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {cat.tagline}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span>{isHindi ? 'वर्कफ़्लो देखें' : 'View Workflows'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('solutions')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
          >
            {isHindi ? 'सभी 7 श्रेणियों का विस्तृत तुलनात्मक चार्ट देखें →' : 'Compare all 7 categories and workflows in detail →'}
          </button>
        </div>
      </section>

      {/* Operational Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8" aria-label="Feature Highlights">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
            {isHindi ? 'प्लेटफॉर्म मुख्य क्षमताएं' : 'Operational Pillars'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isHindi ? 'एक ही डैशबोर्ड से संचालित करें संपूर्ण कैंपस' : 'Complete Campus Autonomy in One Dashboard'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isHindi
              ? 'बिखरे हुए सॉफ़्टवेयरों और कागज़ी रजिस्टरों को अलविदा कहें। आधुनिक भारतीय शिक्षा प्रणाली हेतु तैयार।'
              : 'Say goodbye to fragmented point solutions and paper registers with an all-in-one cloud foundation.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">{h.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6" aria-label="Get Started Banner">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              {isHindi ? 'क्या आप अपने संस्थान को आधुनिक बनाने हेतु तैयार हैं?' : 'Ready to Transform Your Campus Administration?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {isHindi
                ? 'बिना किसी क्रेडिट कार्ड के 14 दिनों का निःशुल्क ट्रायल प्राप्त करें। हमारा ऑनबोर्डिंग दल आपके मौजूदा डेटा को सुरक्षित रूप से माइग्रेट करने में सहायता करेगा।'
                : 'Experience full institutional access for 14 days without a credit card. Our specialists assist in zero-loss data migration.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('register')}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition cursor-pointer"
            >
              {isHindi ? 'निःशुल्क ट्रायल आवेदन भरें' : 'Apply for Free Trial'}
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition cursor-pointer"
            >
              {isHindi ? 'विशेषज्ञ से परामर्श लें' : 'Talk to Education Advisor'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
