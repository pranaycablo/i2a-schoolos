import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { PublicRoute } from '../../types';
import { updatePageMeta } from '../../utils/seo';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { AdSlot } from './AdSlot';
import { ConsentBanner } from './ConsentBanner';

import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { SecurityPage } from './pages/SecurityPage';
import { RegisterTrialPage } from './pages/RegisterTrialPage';

const VALID_ROUTES: PublicRoute[] = [
  'home',
  'product',
  'features',
  'solutions',
  'category-detail',
  'pricing',
  'about',
  'contact',
  'faq',
  'privacy',
  'terms',
  'security',
  'register'
];

function parseHashRoute(): { route: PublicRoute; slug?: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return null;
  const [routePart, slugPart] = raw.split('/');
  if (VALID_ROUTES.includes(routePart as PublicRoute)) {
    return { route: routePart as PublicRoute, slug: slugPart || undefined };
  }
  return null;
}

interface PublicWebsiteShellProps {
  initialRoute?: PublicRoute;
  initialSlug?: string;
  onOpenLoginModal?: () => void;
}

export const PublicWebsiteShell: React.FC<PublicWebsiteShellProps> = ({
  initialRoute = 'home',
  initialSlug = 'k12-schools',
  onOpenLoginModal
}) => {
  const { language, setLanguage, setViewMode } = useSchool();
  const isHindi = language === 'hi';

  const [currentRoute, setCurrentRoute] = useState<PublicRoute>(() => {
    const fromHash = parseHashRoute();
    return fromHash?.route || initialRoute;
  });
  const [categorySlug, setCategorySlug] = useState<string>(() => {
    const fromHash = parseHashRoute();
    return fromHash?.slug || initialSlug;
  });

  const handleOpenLogin = () => {
    if (onOpenLoginModal) {
      onOpenLoginModal();
    } else {
      setViewMode('LOGIN');
    }
  };

  useEffect(() => {
    updatePageMeta(currentRoute);
  }, [currentRoute]);

  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace(/^#\/?/, '').trim();
      if (raw === 'login') {
        handleOpenLogin();
        return;
      }
      const parsed = parseHashRoute();
      if (parsed) {
        setCurrentRoute(parsed.route);
        if (parsed.slug) {
          setCategorySlug(parsed.slug);
        }
      } else if (!window.location.hash || window.location.hash === '#') {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (route: PublicRoute, slug?: string) => {
    setCurrentRoute(route);
    if (slug) {
      setCategorySlug(slug);
      window.location.hash = `#${route}/${slug}`;
    } else {
      window.location.hash = route === 'home' ? '' : `#${route}`;
    }
    updatePageMeta(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleToggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const renderActivePage = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onOpenLogin={handleOpenLogin} isHindi={isHindi} />;
      case 'product':
        return <ProductPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'features':
        return <FeaturesPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'solutions':
        return <SolutionsPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'category-detail':
        return <CategoryDetailPage slug={categorySlug} onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'pricing':
        return <PricingPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'faq':
        return <FaqPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'terms':
        return <TermsPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'security':
        return <SecurityPage onNavigate={handleNavigate} isHindi={isHindi} />;
      case 'register':
        return <RegisterTrialPage onNavigate={handleNavigate} onOpenLogin={handleOpenLogin} isHindi={isHindi} />;
      default:
        return <HomePage onNavigate={handleNavigate} onOpenLogin={handleOpenLogin} isHindi={isHindi} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Universal Public Navigation Header */}
      <PublicHeader
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenLogin={handleOpenLogin}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderActivePage()}
      </main>

      {/* Ethical Non-Intrusive Partner Spotlight / Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 my-8 w-full">
        <AdSlot isHindi={isHindi} />
      </div>

      {/* Universal Footer */}
      <PublicFooter
        onNavigate={handleNavigate}
        language={language}
      />

      {/* DPDP Act 2023 Compliant Consent Banner */}
      <ConsentBanner isHindi={isHindi} />
    </div>
  );
};
