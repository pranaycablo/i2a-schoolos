import React, { useState, useEffect } from 'react';
import {
  School,
  Building2,
  GraduationCap,
  Target,
  BookOpen,
  Baby,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Users,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { PublicRoute } from '../../../types';
import { categoriesApi, CategoryItem } from '../../../services/apiClient';

interface CategoryDetailPageProps {
  slug: string;
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  School,
  Building2,
  GraduationCap,
  Target,
  BookOpen,
  Baby,
  Trophy
};

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  slug,
  onNavigate,
  isHindi = false
}) => {
  const [category, setCategory] = useState<CategoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await categoriesApi.getBySlug(slug);
        if (res.ok && res.data?.category) {
          setCategory(res.data.category);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4" />
        <p>{isHindi ? 'श्रेणी विवरण लोड हो रहा है...' : 'Loading category configuration...'}</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">{isHindi ? 'श्रेणी नहीं मिली' : 'Category Not Found'}</h2>
        <p className="text-xs text-slate-400">
          {isHindi ? 'अनुरोधित शैक्षणिक श्रेणी उपलब्ध नहीं है।' : `The requested category slug '${slug}' does not exist.`}
        </p>
        <button
          onClick={() => onNavigate('solutions')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          {isHindi ? 'सभी समाधान देखें' : 'View All Solutions'}
        </button>
      </div>
    );
  }

  const Icon = ICON_MAP[category.icon] || School;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 font-sans">
      {/* Back button */}
      <button
        onClick={() => onNavigate('solutions')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{isHindi ? 'सभी शैक्षणिक श्रेणियां' : 'Back to All Solutions'}</span>
      </button>

      {/* Category Hero Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                {category.recommendedPlan} Plan Optimized
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-indigo-300 mt-0.5">
                {category.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer shrink-0"
          >
            {isHindi ? 'इस श्रेणी हेतु निःशुल्क ट्रायल' : 'Start Trial for this Category'}
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl border-t border-slate-800/80 pt-4">
          {category.description}
        </p>

        {/* Target Audience Badges */}
        {category.targetAudience && category.targetAudience.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{isHindi ? 'लक्षित हितधारक:' : 'Built for:'}</span>
            </span>
            {category.targetAudience.map((aud, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                {aud}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tailored Workflow Stages */}
      {category.workflowHighlights && category.workflowHighlights.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">
              {isHindi ? 'विशिष्ट परिचालन कार्यप्रवाह (Workflow Highlights)' : 'Operational Workflow Blueprint'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {category.workflowHighlights.map((wf, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-indigo-400">Step 0{idx + 1}</div>
                <h3 className="font-bold text-sm text-white">{wf.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{wf.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Core Features & Modules Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          {isHindi ? 'इस श्रेणी के अंतर्गत सक्रिय मॉड्यूल्स' : 'Pre-Configured Core Modules'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {category.keyFeatures?.map((feat, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-medium">{feat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Statutory & Board Compliance Badges */}
      {category.complianceStandards && category.complianceStandards.length > 0 && (
        <section className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              {isHindi ? 'बोर्ड व वैधानिक अनुपालन मानक' : 'Regulatory & Board Compliance Standards'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {isHindi
              ? 'यह कॉन्फ़िगरेशन भारतीय शिक्षा प्राधिकरणों और संबंधित बोर्डों के नवीनतम नियमों के अनुसार पूर्व-परीक्षित है।'
              : 'Pre-calibrated report card formats, statutory log retention, and audit exports aligned with national norms.'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {category.complianceStandards.map((std, idx) => (
              <span key={idx} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-950 text-emerald-300 border border-emerald-900/50 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{std}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Box */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">
          {isHindi ? `अपने ${category.name} हेतु 14-दिवसीय निःशुल्क ट्रायल शुरू करें` : `Ready to deploy i2A SchoolOS for your ${category.name}?`}
        </h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          {isHindi
            ? 'कोई क्रेडिट कार्ड आवश्यक नहीं। हमारी तकनीकी टीम आपका मौजूदा डेटा निःशुल्क सेटअप करेगी।'
            : 'Get instant access with preloaded sample data for your category. Migration assistance included.'}
        </p>
        <button
          onClick={() => onNavigate('register')}
          className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition cursor-pointer"
        >
          {isHindi ? 'निःशुल्क ट्रायल आवेदन पत्र भरें' : 'Start 14-Day Free Trial'}
        </button>
      </div>
    </div>
  );
};
