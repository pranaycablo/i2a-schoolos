import React from 'react';
import {
  School,
  ShieldCheck,
  Heart,
  Lock,
  Globe2,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { PublicRoute } from '../../types';

interface PublicFooterProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  language: 'en' | 'hi';
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate, language }) => {
  const isHindi = language === 'hi';

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-auto font-sans" aria-label="Site Footer">
      {/* Upper Trust Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{isHindi ? 'डीपीडीपी अधिनियम 2023' : 'DPDP Act 2023'}</div>
              <div className="text-[11px] text-slate-400">{isHindi ? 'संपूर्ण भारतीय डेटा संप्रभुता' : 'Indian Data Residency'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{isHindi ? 'मल्टी-टेनेंट पृथक्करण' : 'Tenant Isolation'}</div>
              <div className="text-[11px] text-slate-400">{isHindi ? 'क्रिप्टोग्राफिक सत्र सुरक्षा' : 'Zero-Cross-Leakage DB'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{isHindi ? '99.9% अपटाइम एसएलए' : '99.9% Uptime SLA'}</div>
              <div className="text-[11px] text-slate-400">{isHindi ? 'स्वचालित आपदा रिकवरी' : 'Geo-Redundant Backup'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{isHindi ? 'भारत में निर्मित' : 'Built for India'}</div>
              <div className="text-[11px] text-slate-400">{isHindi ? 'सीबीएसई, आईसीएसई व स्टेट बोर्ड्स' : 'NEP 2020 Aligned'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-0.5 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <School className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">i2A SchoolOS</span>
              <span className="block text-[10px] text-indigo-400 font-semibold">Enterprise SaaS Platform</span>
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            {isHindi
              ? 'भारतीय स्कूलों, कॉलेजों, कोचिंग संस्थानों व शैक्षणिक ट्रस्ट्स हेतु बनाया गया आधुनिक, सुरक्षित व स्वायत्त स्कूल ऑपरेटिंग सिस्टम।'
              : 'Next-generation cloud ERP operating system uniting admissions, fees, attendance, CBCS/CBSE report cards, fleet tracking, and parent mobile engagement.'}
          </p>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Technology Innovation Hub, Patna, Bihar — 800001</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span>support@i2a.in / sales@i2a.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span>+91 1800-890-4226 (Toll Free)</span>
            </div>
          </div>
        </div>

        {/* Product Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-white uppercase tracking-wider">{isHindi ? 'प्लेटफॉर्म' : 'Product'}</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('product')} className="hover:text-white transition cursor-pointer">
                {isHindi ? 'आर्किटेक्चर व सुरक्षा' : 'Architecture & Security'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('features')} className="hover:text-white transition cursor-pointer">
                {isHindi ? 'मॉड्यूल्स इन्वेंट्री' : 'Modules Matrix'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('pricing')} className="hover:text-white transition cursor-pointer">
                {isHindi ? 'सब्सक्रिप्शन योजनाएँ' : 'Subscription Plans'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('security')} className="hover:text-white transition cursor-pointer">
                {isHindi ? 'डेटा संप्रभुता' : 'Data Protection'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('register')} className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer">
                {isHindi ? 'निःशुल्क ट्रायल शुरू करें' : 'Start 14-Day Trial'}
              </button>
            </li>
          </ul>
        </div>

        {/* Solutions Column (7 Categories) */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-white uppercase tracking-wider">{isHindi ? 'शैक्षणिक समाधान' : 'Solutions'}</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('category-detail', 'k12-schools')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'K-12 स्कूल (CBSE/ICSE)' : 'K-12 Schools'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('category-detail', 'school-groups-trusts')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'स्कूल ग्रुप्स व ट्रस्ट्स' : 'School Groups & Trusts'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('category-detail', 'colleges-higher-ed')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'कॉलेज व उच्च शिक्षा' : 'Higher Ed & Colleges'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('category-detail', 'coaching-institutes')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'कोचिंग व टेस्ट-प्रेप' : 'Coaching Institutes'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('category-detail', 'tuition-centres')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'ट्यूशन सेंटर्स' : 'Tuition Centres'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('category-detail', 'preschools')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'प्रीस्कूल व डेकेयर' : 'Preschools & Daycares'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('category-detail', 'sports-arts-academies')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'स्पोर्ट्स व कला एकेडमी' : 'Sports & Arts Academies'}
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-white uppercase tracking-wider">{isHindi ? 'वैधानिक व सुरक्षा' : 'Legal & Compliance'}</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('privacy')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'गोपनीयता नीति (DPDP 2023)' : 'Privacy Policy (DPDP 2023)'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('terms')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'सेवा की शर्तें (SaaS SLA)' : 'Terms of Service & SLA'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('security')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'सुरक्षा श्वेतपत्र' : 'Security Architecture'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('faq')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'प्रायः पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-white transition cursor-pointer text-left">
                {isHindi ? 'कैंपस डेमो अनुरोध' : 'Schedule Campus Demo'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} i2A Technologies Pvt. Ltd. All rights reserved. Registered under the Companies Act, 2013.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Security Architecture Aligned with ISO 27001 & SOC-2 Principles</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-400 font-semibold">Deployment Target: Sovereign In-Country Cloud Regions</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
