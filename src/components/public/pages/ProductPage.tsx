import React from 'react';
import {
  Server,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  HardDrive
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface ProductPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const ProductPage: React.FC<ProductPageProps> = ({ onNavigate, isHindi = false }) => {
  const architecturalPillars = [
    {
      icon: Database,
      title: isHindi ? 'शून्य-बाईपास मल्टी-टेनेंट पृथक्करण' : 'Zero-Bypass Tenant Isolation',
      desc: isHindi
        ? 'प्रत्येक संस्थान का डेटा लॉजिकली पृथक है। सर्वर स्तर पर अनिवार्य टेनेंट फिल्टर प्रत्येक डेटाबेस क्वेरी में स्वचालित रूप से इंजेक्ट होता है, जिससे किसी भी क्रॉस-स्कूल डेटा लीकेज की संभावना शून्य हो जाती है।'
        : 'Every school or branch operates within an airtight cryptographic tenant boundary. Mandatory server-side middleware automatically injects authoritative tenant scopes into every query.'
    },
    {
      icon: Lock,
      title: isHindi ? 'डीपीडीपी अधिनियम 2023 व डेटा संप्रभुता' : 'DPDP Act 2023 & In-Country Data Residency',
      desc: isHindi
        ? 'छात्रों और अभिभावकों के सभी व्यक्तिगत रिकॉर्ड भारत के भीतर अत्याधुनिक टियर-4 डेटा केंद्रों में एनक्रिप्टेड (AES-256) रूप में संग्रहीत होते हैं। नाबालिग छात्रों के डेटा हेतु सत्यापन योग्य सहमति प्रोटोकॉल।'
        : '100% of student, parent, and institutional data resides within sovereign Indian borders. End-to-end AES-256 encryption at rest and TLS 1.3 in transit with granular audit logs.'
    },
    {
      icon: RefreshCw,
      title: isHindi ? 'हाइब्रिड स्टोर-एंड-फॉरवर्ड ऑफलाइन सिंक' : 'Hybrid Store-and-Forward Hardware Sync',
      desc: isHindi
        ? 'इंटरनेट बाधित होने पर भी बायोमेट्रिक टर्नस्टाइल और बस आरएफआईडी मशीनें स्थानीय बफर में पंच रिकॉर्ड करती हैं और कनेक्टिविटी बहाल होते ही स्वतः क्लाउड सर्वर पर सिंक करती हैं।'
        : 'Physical biometric scanners and fleet GPS devices continuously buffer attendance punches locally, guaranteeing zero data loss even during broadband outages.'
    },
    {
      icon: Layers,
      title: isHindi ? '9 स्तरीय भूमिका-आधारित अभिगम नियंत्रण (RBAC)' : '9-Tier Role-Based Access Control (RBAC)',
      desc: isHindi
        ? 'प्रधानाचार्य, प्रशासक, शिक्षक, लेखापाल, परिवहन चालक, छात्र व अभिभावक हेतु अलग-अलग सुरक्षित दृश्य। संवेदनशील वित्तीय व गोपनीय ग्रेड केवल अधिकृत कर्मचारियों तक सीमित।'
        : 'Fine-grained permission matrices strictly partition administrative, financial, teaching, and parental contexts, preventing privilege escalation.'
    }
  ];

  const techSpecs = [
    { label: isHindi ? 'डेटाबेस' : 'Database Engine', value: 'MongoDB Distributed Replica Set with ACID Transactions' },
    { label: isHindi ? 'प्रमाणीकरण' : 'Session & Auth', value: 'Hashed JWT with Multi-Process Redis/MongoDB Blacklist' },
    { label: isHindi ? 'एनक्रिप्शन' : 'Cryptographic Cipher', value: 'AES-256-GCM (Rest) & TLS 1.3 (Transit)' },
    { label: isHindi ? 'आपदा रिकवरी' : 'Disaster Recovery (RPO/RTO)', value: isHindi ? 'लक्ष्य: आरपीओ < 15 मिनट, आरटीओ < 1 घंटा' : 'Target SLA: RPO < 15 mins, RTO < 1 hr' },
    { label: isHindi ? 'एपीआई संरचना' : 'API Architecture', value: 'RESTful Micro-Services with Strict NoSQL Injection Sanitization' },
    { label: isHindi ? 'अपटाइम लक्ष्य' : 'High Availability Target', value: isHindi ? '99.9% मॉनिटर्ड अपटाइम लक्ष्य' : '99.9% Monitored Uptime Target SLA' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16 font-sans">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'प्लेटफॉर्म आर्किटेक्चर' : 'Engineering Architecture'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'सुरक्षित, स्केलेबल व विश्वसनीय क्लाउड तकनीक' : 'Enterprise SaaS Engineered for Resilience & Zero-Trust Security'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'i2A SchoolOS को भारतीय शैक्षणिक संस्थानों की व्यावहारिक आवश्यकताओं, नेटवर्क चुनौतियों और कड़े डेटा संरक्षण कानूनों को ध्यान में रखकर बनाया गया है।'
            : 'Designed from the ground up to withstand erratic school broadband, peak morning admission rushes, and multi-campus financial consolidation without slowdowns.'}
        </p>
      </div>

      {/* Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {architecturalPillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-indigo-500/40 transition">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">{p.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Architecture Topology View */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>{isHindi ? 'सिस्टम टोपोलॉजी व सुरक्षा परत' : 'Multi-Tier System Topology'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isHindi ? 'सुरक्षित क्लाउड व ऑन-प्रिमाइसेस कनेक्टिविटी लेयर्स' : 'Encrypted edge, authoritative business logic, and isolated storage boundaries'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
            Live Health: Verified Online
          </span>
        </div>

        {/* Visual Layers Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">1. Client & Hardware Layer</div>
            <p className="text-slate-400 leading-relaxed">
              Responsive React Web App, iOS & Android Parent/Staff Apps, ZKTeco/eSSL Biometric Readers, Bus GPS Trackers.
            </p>
            <div className="pt-2 text-[10px] text-emerald-400 font-mono">TLS 1.3 Strict HTTPS</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">2. Application & API Gateway</div>
            <p className="text-slate-400 leading-relaxed">
              Express.js Micro-Services, NoSQL Injection Filter, Revoked-Token Blacklist Engine, Distributed Mutex, Fencing Tokens.
            </p>
            <div className="pt-2 text-[10px] text-purple-400 font-mono">JWT + RBAC + Tenant Middleware</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-pink-300 uppercase tracking-wider text-[11px]">3. Isolated Data Persistence</div>
            <p className="text-slate-400 leading-relaxed">
              MongoDB Replica Set with Read-Write Majority, Multi-Document ACID Transactions, Automated Continuous Snapshots.
            </p>
            <div className="pt-2 text-[10px] text-pink-400 font-mono">AES-256 Storage Encryption</div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Matrix */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          {isHindi ? 'तकनीकी विनिर्देश (Specifications)' : 'Verified System Specifications'}
        </h3>
        <div className="divide-y divide-slate-800">
          {techSpecs.map((item, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-slate-300">{item.label}</span>
              <span className="font-mono text-indigo-300 sm:text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center space-y-4 pt-4">
        <h3 className="text-xl font-bold text-white">
          {isHindi ? 'तकनीकी डेमो या सुरक्षा श्वेतपत्र का अनुरोध करें' : 'Request a Technical Deep-Dive or Security Whitepaper'}
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('contact')}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {isHindi ? 'इंजीनियरिंग टीम से संपर्क करें' : 'Talk to Systems Architect'}
          </button>
          <button
            onClick={() => onNavigate('pricing')}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition cursor-pointer"
          >
            {isHindi ? 'सब्सक्रिप्शन योजनाएँ देखें' : 'View Pricing Plans'}
          </button>
        </div>
      </div>
    </div>
  );
};
