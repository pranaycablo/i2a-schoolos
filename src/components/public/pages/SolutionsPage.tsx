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
  ShieldCheck,
  CheckCircle2,
  Search,
  Sparkles
} from 'lucide-react';
import { PublicRoute } from '../../../types';
import { categoriesApi, CategoryItem } from '../../../services/apiClient';

interface SolutionsPageProps {
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

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ onNavigate, isHindi = false }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await categoriesApi.list();
        if (res.ok && res.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch {
        // Fallback handled gracefully
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12 font-sans">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'संस्थान अनुसार समाधान' : 'Category-Specific Solutions'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? '7 शैक्षणिक श्रेणियों हेतु विशेष रूप से तैयार' : 'Custom Architectures for 7 Distinct Educational Verticals'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'एक आकार सभी के लिए उपयुक्त नहीं होता। i2A SchoolOS प्रत्येक प्रकार के संस्थान हेतु अद्वितीय वर्कफ़्लो, अनुपालन मानक और मूल्यांकन मॉडल प्रदान करता है।'
            : 'Every institution has unique regulatory mandates, evaluation models, and workflows. Explore our dedicated configurations tailored for your exact institutional tier.'}
        </p>

        {/* Search Input */}
        <div className="max-w-md mx-auto pt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHindi ? 'श्रेणी या कीवर्ड खोजें (उदा. K-12, कॉलेज, कोचिंग)...' : 'Search categories (e.g. K-12, College, Coaching)...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || School;
          return (
            <div
              key={cat.id || cat.slug}
              className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {cat.recommendedPlan} Tier
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-white">{cat.name}</h3>
                  <div className="text-xs font-semibold text-indigo-400 mt-0.5">{cat.subtitle}</div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>

                {/* Key Features Bullet List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isHindi ? 'प्रमुख विशेषताएं' : 'Core Capabilities'}
                  </div>
                  {cat.keyFeatures?.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Compliance Badges */}
                {cat.complianceStandards && cat.complianceStandards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.complianceStandards.slice(0, 2).map((comp, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {comp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('category-detail', cat.slug)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isHindi ? 'विस्तृत वर्कफ़्लो देखें' : 'View Workflows'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigate('register')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                >
                  {isHindi ? 'ट्रायल आवेदन' : 'Start Trial'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
