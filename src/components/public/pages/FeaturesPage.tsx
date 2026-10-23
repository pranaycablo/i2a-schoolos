import React, { useState } from 'react';
import {
  School,
  GraduationCap,
  CreditCard,
  Clock,
  Bus,
  Sparkles,
  Users,
  BookOpen,
  ShoppingBag,
  Check,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface FeaturesPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate, isHindi = false }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const modules = [
    {
      id: 'sis',
      category: 'academic',
      icon: School,
      title: isHindi ? 'छात्र सूचना प्रणाली (SIS) व डिजिटल प्रवेश' : 'Student Information System (SIS) & Paperless Admissions',
      features: [
        'अनुकूलन योग्य ऑनलाइन प्रवेश फॉर्म व पूछताछ पाइपलाइन',
        'छात्र डिजिटल बायो-डेटा, पूर्व विद्यालय रिकॉर्ड व दस्तावेज तिजोरी',
        'स्वचालित रोल नंबर व वर्ग-धारा (Section) आवंटन',
        'स्थानांतरण प्रमाण पत्र (TC) व चरित्र प्रमाण पत्र का एक-क्लिक जनरेशन',
        'अभिभावक व आपातकालीन संपर्क डेटाबेस'
      ]
    },
    {
      id: 'fees',
      category: 'finance',
      icon: CreditCard,
      title: isHindi ? 'स्वचालित फीस ट्रेजरी व बहु-माध्यम भुगतान' : 'Automated Fee Management & Digital Treasury',
      features: [
        'मासिक, त्रैमासिक व वार्षिक फीस संरचनाओं का लचीला निर्माण',
        'छात्रवृत्ति, भाई-बहन रियायत व विशेष छूट नियम',
        'स्वचालित विलंब शुल्क (Late Fee) नियम व रिमाइंडर एसएमएस',
        'यूपीआई (UPI), नेट बैंकिंग, कार्ड्स व क्यूआर कोड एकीकरण',
        'ब्रांडेड डिजिटल रसीदें (PDF) व बैंक स्टेटमेंट समाधान'
      ]
    },
    {
      id: 'attendance',
      category: 'operations',
      icon: Clock,
      title: isHindi ? 'मल्टी-मॉडल उपस्थिति व बायोमेट्रिक सिंक' : 'Multi-Modal Attendance & Biometric Integration',
      features: [
        'ZKTeco व eSSL फिंगरप्रिंट व फेस-रीडर मशीनों से स्वचालित सिंक',
        'कक्षा शिक्षक हेतु एक-क्लिक मोबाइल ऐप उपस्थिति',
        'अनुपस्थिति पर अभिभावकों को स्वतः एसएमएस/व्हाट्सएप सूचना',
        'मासिक छात्र व स्टाफ उपस्थिति प्रतिशत रिपोर्ट',
        'ऑफलाइन स्टोर-एंड-फॉरवर्ड बफर (इंटरनेट बाधित होने पर भी सुरक्षित)'
      ]
    },
    {
      id: 'academic',
      category: 'academic',
      icon: GraduationCap,
      title: isHindi ? 'सीबीएसई व राज्य बोर्ड मूल्यांकन व रिपोर्ट कार्ड' : 'Academic Evaluation & Board-Compliant Report Cards',
      features: [
        'सीबीएसई सतत एवं समग्र मूल्यांकन (CCE) व टर्म-वाइज परीक्षा सेटअप',
        'सह-शैक्षिक (Co-scholastic) व अनुशासन ग्रेडिंग रूब्रिक्स',
        'विभिन्न आकर्षक थीम में रंगीन बोर्ड-अनुरूप प्रगति पत्र (Report Card)',
        'विषय-वार अंक प्रविष्टि व स्वचालित रैंक/प्रतिशत गणना',
        'डिजिटल हस्ताक्षर व स्कूल मुहर (Seal) एकीकरण'
      ]
    },
    {
      id: 'transport',
      category: 'operations',
      icon: Bus,
      title: isHindi ? 'स्कूल बस जीपीएस ट्रैकिंग व रूट प्रबंधन' : 'School Bus Fleet GPS & Route Safety',
      features: [
        'चालक हेतु सरल मोबाइल ऐप व लाइव स्थान प्रसारण',
        'मार्ग-वार स्टॉप्स, पिकअप/ड्रॉप समय व बस किराया आवंटन',
        'अभिभावकों हेतु बस के निकट आने पर स्वचालित अलर्ट',
        'ओवर-स्पीडिंग व रूट विचलन का त्वरित अलर्ट',
        'वाहन बीमा, फिटनेस व प्रदूषण प्रमाण पत्र नवीनीकरण ट्रैकर'
      ]
    },
    {
      id: 'ai-exam',
      category: 'academic',
      icon: Sparkles,
      title: isHindi ? 'एआई प्रश्न बैंक व ऑनलाइन सीबीटी परीक्षा' : 'AI Question Bank & Computer-Based Tests (CBT)',
      features: [
        'अध्याय व कठिनाई स्तर के अनुसार स्वतः प्रश्न पत्र निर्माण',
        'टाइमर आधारित सुरक्षित ऑनलाइन कंप्यूटर आधारित परीक्षा (CBT)',
        'ऑटो-मूल्यांकन व तत्काल परसेंटाइल व रैंक कार्ड',
        'गलत उत्तरों का विस्तृत शैक्षणिक विश्लेषण',
        'सीबीएसई व प्रतियोगी परीक्षा (JEE/NEET) प्रश्न बैंक समर्थन'
      ]
    },
    {
      id: 'staff',
      category: 'operations',
      icon: Users,
      title: isHindi ? 'स्टाफ कार्यबल, पेरोल व अवकाश प्रबंधन' : 'Staff HR, Biometric Payroll & Service Book',
      features: [
        'शिक्षक व गैर-शैक्षणिक स्टाफ प्रोफाइल व योग्यता दस्तावेज',
        'बायोमेट्रिक पंच आधारित मासिक वेतन (Payroll) गणना',
        'भविष्य निधि (PF), टीडीएस व कटौतियों की विस्तृत पे-स्लिप',
        'अवकाश (CL, ML, EL) आवेदन व अनुमोदन वर्कफ़्लो',
        'शिक्षक कक्षा टाइमटेबल व दैनिक प्रतिस्थापन (Substitution) इंजन'
      ]
    },
    {
      id: 'lms',
      category: 'academic',
      icon: BookOpen,
      title: isHindi ? 'डिजिटल होमवर्क व अभिभावक मोबाइल ऐप' : 'Digital Homework & Connected Parent Experience',
      features: [
        'शिक्षकों द्वारा विषय-वार होमवर्क, वर्कशीट व वीडियो लिंक पोस्टिंग',
        'अभिभावक ऐप में तत्काल होमवर्क नोटिफिकेशन व जमा स्थिति',
        'स्कूल परिपत्र (Notice), अवकाश कैलेंडर व इवेंट गैलरी',
        'अभिभावक-शिक्षक प्रत्यक्ष संदेश संवाद',
        'दो-तरफा शिकायत निवारण व प्रतिक्रिया मॉड्यूल'
      ]
    }
  ];

  const filteredModules = activeCategory === 'all'
    ? modules
    : modules.filter(m => m.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12 font-sans">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'मॉड्यूल्स मैट्रिक्स' : 'Comprehensive Module Suite'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'आपके स्कूल के प्रत्येक विभाग हेतु संपूर्ण स्वचालन' : 'Every Department Empowered by Unified Intelligence'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'प्रवेश से लेकर रिपोर्ट कार्ड, और दैनिक बस ट्रैकिंग से लेकर स्टाफ वेतन तक — एक ही सुरक्षित लॉगिन में।'
            : 'Explore our complete module inventory. Designed with modular microservices so you can activate what you need today and expand effortlessly tomorrow.'}
        </p>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'}`}
          >
            {isHindi ? 'सभी मॉड्यूल्स' : 'All Modules'}
          </button>
          <button
            onClick={() => setActiveCategory('academic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'academic' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'}`}
          >
            {isHindi ? 'शैक्षणिक व परीक्षा' : 'Academics & Exams'}
          </button>
          <button
            onClick={() => setActiveCategory('finance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'finance' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'}`}
          >
            {isHindi ? 'फीस व वित्त' : 'Fees & Finance'}
          </button>
          <button
            onClick={() => setActiveCategory('operations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'operations' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'}`}
          >
            {isHindi ? 'प्रशासन व परिवहन' : 'Operations & Fleet'}
          </button>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredModules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">{m.title}</h3>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {m.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => onNavigate('register')}
                  className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isHindi ? 'इस मॉड्यूल का ट्रायल लें' : 'Try this module free'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">
          {isHindi ? 'क्या आप किसी विशिष्ट मॉड्यूल के बारे में विस्तार से जानना चाहते हैं?' : 'Need a Custom Combination of Modules for Your Institution?'}
        </h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          {isHindi
            ? 'हमारे सलाहकार आपके स्कूल की वर्तमान आवश्यकताओं के अनुसार सर्वोत्तम योजना तैयार करने में मदद करेंगे।'
            : 'Our solutions team can customize the ERP suite according to your board, student strength, and hardware setup.'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('contact')}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {isHindi ? 'विशेषज्ञ से परामर्श करें' : 'Schedule Custom Walkthrough'}
          </button>
        </div>
      </div>
    </div>
  );
};
