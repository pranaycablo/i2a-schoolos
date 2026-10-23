import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Check, X, Settings2 } from 'lucide-react';
import { ConsentPreferences } from '../../types';

const STORAGE_KEY = 'i2a_consent_preferences';

export function getStoredConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConsent(prefs: ConsentPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('i2a_consent_updated', { detail: prefs }));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

interface ConsentBannerProps {
  isHindi?: boolean;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ isHindi = false }) => {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [advertisingEnabled, setAdvertisingEnabled] = useState(false);

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString()
    };
    saveConsent(prefs);
    setVisible(false);
  };

  const handleRejectOptional = () => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString()
    };
    saveConsent(prefs);
    setVisible(false);
  };

  const handleSaveCustom = () => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: analyticsEnabled,
      advertising: advertisingEnabled,
      timestamp: new Date().toISOString()
    };
    saveConsent(prefs);
    setShowCustomize(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-5 shadow-2xl shadow-black/60 text-slate-100 text-xs animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>{isHindi ? 'गोपनीयता व सहमति वरीयताएँ' : 'Data Privacy & Consent Settings'}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                DPDP Act 2023
              </span>
            </h3>
            <button
              onClick={() => setVisible(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close consent banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            {isHindi
              ? 'i2A SchoolOS भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 का पालन करता है। आवश्यक सत्र कुकीज़ सदैव सक्रिय रहती हैं। विश्लेषणात्मक व प्रचार सहायता आपकी स्पष्ट सहमति पर निर्भर है।'
              : 'i2A SchoolOS respects your privacy under the Indian Digital Personal Data Protection Act 2023. Essential security cookies are always on. Performance analytics and ethical partner spotlights require your voluntary consent.'}
          </p>

          {showCustomize && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">
                    {isHindi ? 'आवश्यक सुरक्षा कुकीज़' : 'Essential Security & Session'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isHindi ? 'सुरक्षित लॉगिन व टोकन प्रबंधन (अनिवार्य)' : 'Encrypted tokens & CSRF mitigation (Always active)'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-800">
                  {isHindi ? 'अनिवार्य' : 'Required'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200">
                    {isHindi ? 'विश्लेषिकी व प्रदर्शन' : 'Anonymous Analytics'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isHindi ? 'प्लेटफॉर्म उपयोग व लोड समय सुधारने हेतु' : 'Page load timing & aggregated usage metrics'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  aria-label="Toggle anonymous analytics"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200">
                    {isHindi ? 'शैक्षणिक पार्टनर स्पॉटलाइट' : 'Educational Partner Spotlight'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isHindi ? 'सार्वजनिक पृष्ठों पर सत्यापित शैक्षणिक सामग्री' : 'Non-intrusive ed-tech & book publisher banners'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={advertisingEnabled}
                  onChange={(e) => setAdvertisingEnabled(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  aria-label="Toggle partner spotlight"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!showCustomize ? (
              <>
                <button
                  onClick={handleAcceptAll}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  {isHindi ? 'सभी स्वीकारें' : 'Accept All'}
                </button>
                <button
                  onClick={handleRejectOptional}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                >
                  {isHindi ? 'केवल अनिवार्य' : 'Essential Only'}
                </button>
                <button
                  onClick={() => setShowCustomize(true)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'पसंद बदलें' : 'Customize'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveCustom}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  {isHindi ? 'वरीयता सुरक्षित करें' : 'Save Preferences'}
                </button>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                >
                  {isHindi ? 'वापस' : 'Back'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
