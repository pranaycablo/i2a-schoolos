import React from 'react';
import {
  School,
  ShieldCheck,
  Heart,
  Target,
  Sparkles,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface AboutPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, isHindi = false }) => {
  const values = [
    {
      title: isHindi ? 'भारतीय डेटा संप्रभुता (Data Sovereignty)' : 'Uncompromising Indian Data Sovereignty',
      desc: isHindi
        ? 'भारतीय छात्रों और शैक्षणिक संस्थानों का डेटा केवल भारत की सीमाओं के भीतर टियर-4 डेटा केंद्रों में एनक्रिप्टेड संग्रहीत होता है। डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 का पूर्ण अनुपालन।'
        : 'All records remain strictly within sovereign Indian territory. We reject offshore data handling and enforce strict DPDP Act 2023 compliance.'
    },
    {
      title: isHindi ? 'शून्य हार्डवेयर लॉक-इन' : 'Zero Proprietary Hardware Lock-In',
      desc: isHindi
        ? 'स्कूल किसी भी मानक बायोमेट्रिक मशीन (ZKTeco, eSSL) या सामान्य स्मार्टफोन का उपयोग करने हेतु स्वतंत्र हैं। हम किसी महँगे मालिकाना हार्डवेयर को थोपने के सख्त विरोधी हैं।'
        : 'Schools are free to use standard turnstiles, biometric readers, and commodity Android phones without proprietary vendor traps.'
    },
    {
      title: isHindi ? 'पारदर्शी व न्यायसंगत मूल्य' : 'Transparent & Predictable Economics',
      desc: isHindi
        ? 'कोई छिपा हुआ सेटअप शुल्क नहीं, डेटा निर्यात पर कोई जबरन शुल्क नहीं। स्कूल का डेटा स्कूल की अपनी संपत्ति है, जिसे कभी भी पूर्ण रूप से निर्यात किया जा सकता है।'
        : 'Zero opaque onboarding fees, zero exit penalties. Schools own their data 100% and can export full databases at any moment.'
    },
    {
      title: isHindi ? 'व्यावहारिक भारतीय स्कूल परिस्थितियों हेतु अनुकूल' : 'Built for Real-World Campus Challenges',
      desc: isHindi
        ? 'धीमी इंटरनेट कनेक्टिविटी, सुबह की भीड़ और विभिन्न क्षेत्रीय भाषाओं (हिंदी व अंग्रेजी) में सहज संचालन हेतु विशेष रूप से अनुकूलित वास्तुकला।'
        : 'Architected with store-and-forward offline buffers to handle broadband drops and high-concurrency morning admission rushes smoothly.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16 font-sans">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'हमारा दृष्टिकोण' : 'Our Engineering Mission'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'भारतीय शिक्षा प्रणाली को सशक्त व आधुनिक बनाने की प्रतिबद्धता' : 'Empowering Indian Educational Institutions with World-Class Software'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'i2A SchoolOS की शुरुआत भारतीय स्कूलों को पुराने डेस्कटॉप सॉफ़्टवेयर, अविश्वसनीय विक्रेताओं और खंडित प्रणालियों से मुक्ति दिलाने के उद्देश्य से हुई।'
            : 'Born out of the frustration with fragile desktop databases, vendor lock-in, and generic Western software unfit for Indian boards and fee models.'}
        </p>
      </div>

      {/* Story Section */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          {isHindi ? 'पारंपरिक ईआरपी की कमियाँ और हमारा समाधान' : 'The Broken Reality of School ERPs & Why We Built SchoolOS'}
        </h2>
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            {isHindi
              ? 'दशकों से, भारतीय स्कूल या तो पुराने डेस्कटॉप-आधारित सॉफ़्टवेयर पर निर्भर थे जो स्थानीय कंप्यूटर क्रैश होने पर सारा डेटा खो देते थे, या ऐसे विदेशी सॉफ़्टवेयरों पर जो भारतीय बोर्डों (CBSE, ICSE, राज्य बोर्ड) के जटिल सतत मूल्यांकन नियमों को नहीं समझते थे।'
              : 'For decades, Indian principals and trustees struggled between fragile desktop ERPs that corrupted databases during power spikes, and cumbersome multinational tools completely divorced from CBSE rubrics, bus route realities, and quarterly fee cycles.'}
          </p>
          <p>
            {isHindi
              ? 'i2A SchoolOS को बिहार, दिल्ली, उत्तर प्रदेश और महाराष्ट्र के दर्जनों प्रिंसिपलों, शिक्षकों और ट्रस्टियों के प्रत्यक्ष सहयोग से तैयार किया गया है। इसका उद्देश्य केवल एक ईआरपी प्रदान करना नहीं, बल्कि एक ऐसा ऑपरेटिंग सिस्टम देना है जो संस्थान के दैनिक कार्यों को शून्य तनाव के साथ स्वतः संचालित कर सके।'
              : 'i2A SchoolOS was engineered through deep collaborative field trials with educators across India. We engineered a robust, fail-closed platform that gives institutional leadership total confidence over academic standards, regulatory compliance, and financial transparency.'}
          </p>
        </div>
      </div>

      {/* Core Engineering Values */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {isHindi ? 'हमारे मुख्य सिद्धांत' : 'Foundational Principles'}
          </h2>
          <p className="text-xs text-slate-400">
            {isHindi ? 'वे आदर्श जिन पर i2A SchoolOS का प्रत्येक कोड और निर्णय आधारित है।' : 'The ethical and technical commitments that govern our platform.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {values.map((v, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <h3 className="font-bold text-sm text-white">{v.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">
          {isHindi ? 'हमारे साथ जुड़ें और अपने स्कूल को डिजिटल रूप से सशक्त बनाएं' : 'Join Indian Institutions Transforming Their Operations'}
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          {isHindi ? '14 दिनों के निःशुल्क ट्रायल के साथ आज ही शुरुआत करें।' : 'Experience seamless admissions, grading, and fee management today.'}
        </p>
        <button
          onClick={() => onNavigate('register')}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          {isHindi ? 'निःशुल्क ट्रायल शुरू करें' : 'Start 14-Day Free Trial'}
        </button>
      </div>
    </div>
  );
};
