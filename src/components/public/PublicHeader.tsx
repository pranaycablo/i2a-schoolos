import React, { useState } from 'react';
import {
  School,
  Menu,
  X,
  ChevronDown,
  Globe,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  GraduationCap,
  Target,
  BookOpen,
  Baby,
  Trophy
} from 'lucide-react';
import { PublicRoute } from '../../types';

interface PublicHeaderProps {
  currentRoute: PublicRoute;
  onNavigate: (route: PublicRoute, slug?: string) => void;
  onOpenLogin: () => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentRoute,
  onNavigate,
  onOpenLogin,
  language,
  onToggleLanguage
}) => {
  const isHindi = language === 'hi';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);

  const categories = [
    { slug: 'k12-schools', name: isHindi ? 'K-12 स्कूल (CBSE / ICSE)' : 'K-12 Schools (CBSE / ICSE)', icon: School },
    { slug: 'school-groups-trusts', name: isHindi ? 'स्कूल ग्रुप्स व ट्रस्ट्स' : 'School Groups & Trusts', icon: Building2 },
    { slug: 'colleges-higher-ed', name: isHindi ? 'कॉलेज व उच्च शिक्षा' : 'Colleges & Higher Ed', icon: GraduationCap },
    { slug: 'coaching-institutes', name: isHindi ? 'कोचिंग व टेस्ट-प्रेप' : 'Coaching Institutes', icon: Target },
    { slug: 'tuition-centres', name: isHindi ? 'ट्यूशन सेंटर्स' : 'Tuition Centres', icon: BookOpen },
    { slug: 'preschools', name: isHindi ? 'प्रीस्कूल व डेकेयर' : 'Preschools & Daycare', icon: Baby },
    { slug: 'sports-arts-academies', name: isHindi ? 'स्पोर्ट्स व आर्ट्स एकेडमी' : 'Sports & Arts Academies', icon: Trophy }
  ];

  const handleNav = (route: PublicRoute, slug?: string) => {
    onNavigate(route, slug);
    setMobileMenuOpen(false);
    setSolutionsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl p-0.5 sm:p-1 shrink-0"
          aria-label="i2A SchoolOS Home"
        >
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <School className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                i2A SchoolOS
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xl:block">
              {isHindi ? 'भारत का अग्रणी स्वायत्त स्कूल ऑपरेटिंग सिस्टम' : 'Autonomous Multi-Tenant School ERP'}
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold text-slate-300" aria-label="Main Navigation">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${currentRoute === 'home' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
          >
            {isHindi ? 'होम' : 'Home'}
          </button>

          <button
            onClick={() => handleNav('product')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${currentRoute === 'product' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
          >
            {isHindi ? 'प्रोडक्ट' : 'Product'}
          </button>

          <button
            onClick={() => handleNav('features')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${currentRoute === 'features' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
          >
            {isHindi ? 'सुविधाएं' : 'Features'}
          </button>

          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSolutionsDropdownOpen(!solutionsDropdownOpen)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${currentRoute === 'solutions' || currentRoute === 'category-detail' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
              aria-expanded={solutionsDropdownOpen}
              aria-haspopup="true"
            >
              <span>{isHindi ? 'समाधान (श्रेणियाँ)' : 'Solutions'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${solutionsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {solutionsDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/80 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                  {isHindi ? 'संस्थान अनुसार समाधान' : 'By Institution Type'}
                </div>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => handleNav('category-detail', cat.slug)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
                <div className="pt-1 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => handleNav('solutions')}
                    className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold py-1.5 rounded-lg hover:bg-indigo-950/30 transition cursor-pointer"
                  >
                    {isHindi ? 'सभी श्रेणियां देखें →' : 'View All 7 Categories →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => handleNav('pricing')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${currentRoute === 'pricing' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
          >
            {isHindi ? 'कीमतें' : 'Pricing'}
          </button>

          <button
            onClick={() => handleNav('about')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${currentRoute === 'about' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
          >
            {isHindi ? 'परिचय' : 'About'}
          </button>

          <button
            onClick={() => handleNav('contact')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${currentRoute === 'contact' ? 'text-indigo-400 bg-indigo-950/40 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
          >
            {isHindi ? 'संपर्क' : 'Contact'}
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] sm:text-xs font-semibold border border-slate-800 transition cursor-pointer"
            title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isHindi ? 'EN' : 'हिन्दी'}</span>
          </button>

          {/* Login Button */}
          <button
            id="public-header-login-btn"
            onClick={onOpenLogin}
            className="px-2.5 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            {isHindi ? 'लॉगिन' : 'Sign In'}
          </button>

          {/* Trial / Register CTA */}
          <button
            onClick={() => handleNav('register')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <span>{isHindi ? 'निःशुल्क ट्रायल' : 'Free Trial'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            id="public-header-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs font-semibold animate-fade-in">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'home' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'होम (मुख्य पृष्ठ)' : 'Home'}
          </button>
          <button
            onClick={() => handleNav('product')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'product' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'प्रोडक्ट आर्किटेक्चर' : 'Product & Architecture'}
          </button>
          <button
            onClick={() => handleNav('features')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'features' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'मॉड्यूल्स व सुविधाएं' : 'Features & Modules'}
          </button>
          <button
            onClick={() => handleNav('solutions')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'solutions' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'समाधान (7 शैक्षणिक श्रेणियां)' : 'Solutions (7 Categories)'}
          </button>
          <button
            onClick={() => handleNav('pricing')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'pricing' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'सब्सक्रिप्शन प्लान्स व कैलकुलेटर' : 'Pricing & Calculator'}
          </button>
          <button
            onClick={() => handleNav('about')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'about' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'हमारे बारे में' : 'About Us'}
          </button>
          <button
            onClick={() => handleNav('contact')}
            className={`w-full text-left px-3 py-2 rounded-xl ${currentRoute === 'contact' ? 'text-indigo-400 bg-slate-900' : 'text-slate-300'}`}
          >
            {isHindi ? 'संपर्क व कैंपस डेमो' : 'Contact & Demo'}
          </button>
          <button
            onClick={() => handleNav('register')}
            className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-center block shadow-lg shadow-indigo-600/30"
          >
            {isHindi ? '14-दिवसीय निःशुल्क ट्रायल शुरू करें' : 'Start 14-Day Free Trial'}
          </button>
        </div>
      )}
    </header>
  );
};
