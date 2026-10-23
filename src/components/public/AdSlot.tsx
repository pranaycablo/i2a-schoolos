import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, Info, BookOpen, ShieldCheck } from 'lucide-react';
import { getStoredConsent } from './ConsentBanner';

export interface AdSlotProps {
  placement?: 'banner' | 'sidebar' | 'inline';
  isHindi?: boolean;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  placement = 'banner',
  isHindi = false,
  className = ''
}) => {
  const [hasAdConsent, setHasAdConsent] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      try {
        const consent = getStoredConsent();
        setHasAdConsent(Boolean(consent?.advertising));
      } catch {
        setHasAdConsent(false);
      }
    };

    checkConsent();

    const handleConsentUpdate = (e: Event) => {
      try {
        const customEvt = e as CustomEvent;
        setHasAdConsent(Boolean(customEvt.detail?.advertising));
      } catch {
        setHasAdConsent(false);
      }
    };

    window.addEventListener('i2a_consent_updated', handleConsentUpdate);
    return () => window.removeEventListener('i2a_consent_updated', handleConsentUpdate);
  }, []);

  if (hasError) {
    return null; // Silent fail-closed without UI disruption
  }

  // If user declined or hasn't accepted advertising consent, show educational platform initiative
  if (!hasAdConsent) {
    return (
      <div
        role="region"
        aria-label="i2A Education Initiative"
        className={`bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 text-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                {isHindi ? 'ज्ञान साझा मंच' : 'Educational Resources Hub'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                {isHindi ? 'निःशुल्क हैंडबुक' : 'Free Handbook'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isHindi
                ? 'राष्ट्रीय शिक्षा नीति (NEP 2020) व समग्र मूल्यांकन हेतु स्कूल कार्यान्वयन मार्गदर्शिका डाउनलोड करें।'
                : 'Download the comprehensive NEP 2020 School Implementation & Holistic Progress Card Blueprint.'}
            </p>
          </div>
        </div>

        <a
          href="#features"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs shrink-0 transition"
        >
          <span>{isHindi ? 'संसाधन देखें' : 'Explore Guide'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // When ethical partner spotlight is consented
  return (
    <div
      role="complementary"
      aria-label="Verified Partner Spotlight"
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-slate-800 border-b border-l border-slate-700 rounded-bl-lg text-[10px] font-medium text-slate-400 flex items-center gap-1">
        <Info className="w-3 h-3" />
        <span>{isHindi ? 'पार्टनर स्पॉटलाइट' : 'Partner Spotlight'}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs">
              {isHindi ? 'सत्यापित बायोमेट्रिक व आरएफआईडी हार्डवेयर' : 'Certified Biometric & RFID Hardware Partners'}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              Verified Plug & Play
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isHindi
              ? 'i2A SchoolOS के साथ स्वतः सिंक होने वाले ZKTeco व eSSL डिवाइस 1-वर्षीय ऑन-साइट वारंटी के साथ उपलब्ध।'
              : 'Direct-sync attendance turnstiles and bus RFID scanners certified for zero-configuration deployment.'}
          </p>
        </div>
      </div>

      <a
        href="#contact"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 shrink-0 transition"
      >
        <span>{isHindi ? 'हार्डवेयर पूछताछ' : 'Hardware Inquiries'}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
