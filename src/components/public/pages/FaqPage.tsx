import React, { useState } from 'react';
import {
  ChevronDown,
  HelpCircle,
  Search,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface FaqPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
  category: 'onboarding' | 'security' | 'hardware' | 'billing';
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate, isHindi = false }) => {
  const [activeId, setActiveId] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqs: FaqItem[] = [
    {
      category: 'onboarding',
      question: isHindi ? 'i2A SchoolOS को चालू (Setup) करने में कितना समय लगता है?' : 'How long does implementation and setup take?',
      answer: isHindi
        ? 'अधिकांश संस्थानों के लिए सेटअप 24 से 48 घंटों में पूरा हो जाता है। हमारे स्वचालित एक्सेल / सीएसवी इम्पोर्टर की मदद से छात्र, शिक्षक और फीस लेजर रिकॉर्ड कुछ ही मिनटों में लोड हो जाते हैं।'
        : 'Most schools and colleges are up and running within 24 to 48 hours. Our automated CSV/Excel migration engine ingests your entire student roll, staff bio-data, and past fee ledger in minutes.'
    },
    {
      category: 'onboarding',
      question: isHindi ? 'क्या हम अपने पुराने सॉफ्टवेयर से छात्र डेटा माइग्रेट कर सकते हैं?' : 'Can we migrate existing student databases from our previous software?',
      answer: isHindi
        ? 'हाँ, बिल्कुल। हमारा ऑनबोर्डिंग दल आपके पुराने सॉफ़्टवेयर से डेटा सुरक्षित रूप से निर्यात और सत्यापित करने में निःशुल्क सहायता प्रदान करता है।'
        : 'Yes. Our specialized onboarding engineers assist in safely transforming and importing records from any legacy system with zero data loss.'
    },
    {
      category: 'security',
      question: isHindi ? 'हमारा डेटा कहाँ संग्रहीत होता है और डेटा का वास्तविक स्वामी कौन है?' : 'Where is our data stored and who owns our institutional data?',
      answer: isHindi
        ? 'डेटा केवल भारत की सीमाओं के भीतर टियर-4 डेटा केंद्रों में AES-256 एनक्रिप्शन के साथ सुरक्षित रहता है। आपका संस्थान अपने 100% डेटा का एकमात्र स्वामी है और आप इसे कभी भी डाउनलोड कर सकते हैं।'
        : '100% of data is stored within sovereign Indian borders in ISO 27001 certified Tier-4 data facilities. Your institution retains 100% ownership and can trigger full data exports at any time.'
    },
    {
      category: 'security',
      question: isHindi ? 'क्या यह भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 का पालन करता है?' : 'Is i2A SchoolOS compliant with the Digital Personal Data Protection (DPDP) Act 2023?',
      answer: isHindi
        ? 'हाँ, i2A SchoolOS DPDP Act 2023 के तहत आवश्यक डेटा फिड्यूशियरी सुरक्षा, नाबालिग छात्रों हेतु अभिभावक सहमति, और भूमिका-आधारित पहुंच नियंत्रण का सख्ती से पालन करता है।'
        : 'Yes. The platform is architected around DPDP Act 2023 mandates, including verifiable parental consent for minors, explicit purpose limitation, and comprehensive audit logs.'
    },
    {
      category: 'hardware',
      question: isHindi ? 'कौन सी बायोमेट्रिक और आरएफआईडी मशीनें समर्थित हैं?' : 'Which biometric and RFID attendance machines are compatible?',
      answer: isHindi
        ? 'बाजार में उपलब्ध लगभग सभी लोकप्रिय टीसीपी/आईपी और यूएसबी मशीनें (जैसे ZKTeco, eSSL, Realtime) बिना किसी महंगे मालिकाना कनवर्टर के स्वतः कनेक्ट होती हैं।'
        : 'Standard commercial TCP/IP and USB attendance devices from ZKTeco, eSSL, and Realtime sync directly with our background connector daemon.'
    },
    {
      category: 'hardware',
      question: isHindi ? 'यदि स्कूल का इंटरनेट बंद हो जाए तो क्या उपस्थिति रुक जाती है?' : 'What happens if our school broadband connection goes down?',
      answer: isHindi
        ? 'बिल्कुल नहीं। बायोमेट्रिक मशीनें व बस जीपीएस डिवाइस स्थानीय बफर (Store-and-Forward) में पंच सहेजते हैं और इंटरनेट बहाल होते ही बिना डेटा हानि के स्वतः क्लाउड पर सिंक हो जाते हैं।'
        : 'No. The hardware connectors operate on a fail-safe store-and-forward architecture. Punches are buffered securely on local storage and synced automatically once connection is restored.'
    },
    {
      category: 'billing',
      question: isHindi ? 'क्या रिपोर्ट कार्ड या प्रवेश फॉर्म प्रिंट करने का कोई अतिरिक्त शुल्क है?' : 'Are there extra charges for report cards or admissions processing?',
      answer: isHindi
        ? 'नहीं। आपके सब्सक्रिप्शन प्लान में असीमित रिपोर्ट कार्ड, असीमित प्रवेश पूछताछ और संपूर्ण परीक्षा प्रबंधन शामिल हैं।'
        : 'No. Unlimited report cards, admissions processing, and exam grade calculations are included with zero per-transaction penalties.'
    },
    {
      category: 'billing',
      question: isHindi ? 'क्या हम अपनी सदस्यता किसी भी समय रद्द या अपग्रेड कर सकते हैं?' : 'Can we upgrade or cancel our subscription at any time?',
      answer: isHindi
        ? 'हाँ। आप छात्र संख्या बढ़ने पर आसानी से अपग्रेड कर सकते हैं। कोई अनुबंध लॉक-इन या रद्दीकरण शुल्क नहीं है।'
        : 'Yes. You can upgrade tiers anytime as enrollment expands. We do not enforce restrictive lock-in contracts or termination fees.'
    }
  ];

  const filtered = faqs.filter(f => {
    const matchesCat = activeCategory === 'all' || f.category === activeCategory;
    const matchesQuery = f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12 font-sans">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'मदद व समाधान' : 'Frequently Asked Questions'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'प्रायः पूछे जाने वाले प्रश्न' : 'Got Questions? We Have Answers.'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'ऑनबोर्डिंग, डेटा सुरक्षा, बायोमेट्रिक एकीकरण और बिलिंग से संबंधित सभी आवश्यक जानकारी यहाँ उपलब्ध है।'
            : 'Everything you need to know about setting up i2A SchoolOS, safeguarding student privacy, and integrating campus hardware.'}
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto pt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHindi ? 'प्रश्न खोजें...' : 'Search questions...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {[
            { id: 'all', label: isHindi ? 'सभी' : 'All' },
            { id: 'onboarding', label: isHindi ? 'ऑनबोर्डिंग' : 'Onboarding & Migration' },
            { id: 'security', label: isHindi ? 'डेटा सुरक्षा' : 'Security & DPDP' },
            { id: 'hardware', label: isHindi ? 'हार्डवेयर व नेटवर्क' : 'Hardware Sync' },
            { id: 'billing', label: isHindi ? 'बिलिंग व योजना' : 'Billing & Pricing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeCategory === tab.id ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filtered.map((faq, idx) => {
          const isOpen = activeId === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition"
            >
              <button
                onClick={() => setActiveId(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-indigo-300 transition cursor-pointer"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-4 h-4 text-indigo-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Have Questions Box */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
        <h3 className="text-base font-bold text-white">
          {isHindi ? 'क्या आपका कोई अन्य विशिष्ट प्रश्न है?' : 'Have a Question Not Listed Here?'}
        </h3>
        <p className="text-xs text-slate-400">
          {isHindi ? 'हमारी तकनीकी सहायता टीम से तुरंत संपर्क करें।' : 'Our institutional specialists are available to answer your technical questions.'}
        </p>
        <button
          onClick={() => onNavigate('contact')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
        >
          {isHindi ? 'सपोर्ट टीम से बात करें' : 'Contact Support'}
        </button>
      </div>
    </div>
  );
};
