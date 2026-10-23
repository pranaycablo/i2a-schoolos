/**
 * i2A SchoolOS — SEO, Canonical & Meta Tag Management
 */

export interface MetaConfig {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article';
}

const BASE_URL = 'https://schoolos.i2a.in';

const ROUTE_META_MAP: Record<string, MetaConfig> = {
  home: {
    title: 'i2A SchoolOS — India’s Premier Autonomous Multi-Tenant School ERP & Operating System',
    description: 'Centralized school management operating system for Indian K-12 schools, educational trusts, colleges, coaching institutes, and preschools. CBSE/ICSE evaluation, attendance, fees, GPS, and parent app.',
    canonical: `${BASE_URL}/`
  },
  product: {
    title: 'Product Architecture & Technology — i2A SchoolOS',
    description: 'Explore the high-availability, multi-tenant cloud architecture of i2A SchoolOS. Zero-trust security, tenant data isolation, offline-sync, and automated failover.',
    canonical: `${BASE_URL}/product`
  },
  features: {
    title: 'Features & Modules Matrix — i2A SchoolOS',
    description: 'Comprehensive module inventory: Student SIS, Biometric Attendance, CBSE Report Cards, Online Fee Gateway, Fleet GPS Tracking, Staff Payroll, and LMS.',
    canonical: `${BASE_URL}/features`
  },
  solutions: {
    title: 'Solutions by Institution Category — i2A SchoolOS',
    description: 'Tailored ERP operating systems for K-12 Schools, Multi-Branch Trusts, Degree Colleges, Coaching Institutes, Tuition Centers, Preschools, and Sports Academies.',
    canonical: `${BASE_URL}/solutions`
  },
  pricing: {
    title: 'Transparent Pricing & Plans — i2A SchoolOS',
    description: 'No hidden setup fees. Flexible per-student pricing with Starter, Professional, and Enterprise tiers. Interactive quote calculator with 14-day free trial.',
    canonical: `${BASE_URL}/pricing`
  },
  about: {
    title: 'About Us & Engineering Mission — i2A SchoolOS',
    description: 'Learn about i2A SchoolOS: Built in India for Indian educational institutions with uncompromising standards for privacy, reliability, and local curriculum support.',
    canonical: `${BASE_URL}/about`
  },
  contact: {
    title: 'Contact Sales & Request a Campus Demo — i2A SchoolOS',
    description: 'Schedule a personalized walkthrough of i2A SchoolOS. Connect with our institutional advisors for migration assistance, hardware quotes, and trial setup.',
    canonical: `${BASE_URL}/contact`
  },
  faq: {
    title: 'Frequently Asked Questions (FAQ) — i2A SchoolOS',
    description: 'Got questions about setup, hardware compatibility, data security under DPDP Act, migration from legacy ERPs, or billing? Find comprehensive answers here.',
    canonical: `${BASE_URL}/faq`
  },
  privacy: {
    title: 'Privacy Policy & DPDP Act 2023 Compliance — i2A SchoolOS',
    description: 'Comprehensive privacy policy detailing data fiduciary responsibilities, student personal data safeguards, parental consent protocols, and grievance redressal.',
    canonical: `${BASE_URL}/privacy`
  },
  terms: {
    title: 'Terms of Service & SLA Agreement — i2A SchoolOS',
    description: 'Review our institutional software service agreement, 99.9% uptime SLA commitments, data ownership clauses, and transparent cancellation guidelines.',
    canonical: `${BASE_URL}/terms`
  },
  security: {
    title: 'Security, Data Protection & Cryptography — i2A SchoolOS',
    description: 'Enterprise security posture: AES-256 encryption at rest, TLS 1.3 in transit, strict tenant schema boundaries, role-based access control, and immutable audit logs.',
    canonical: `${BASE_URL}/security`
  },
  register: {
    title: 'Start 14-Day Free Institutional Trial — i2A SchoolOS',
    description: 'Apply for instant trial access for your school, college, or coaching institute. No credit card required. Onboarding team provides free data import assistance.',
    canonical: `${BASE_URL}/register`
  }
};

/**
 * Updates document title and HTML meta tags according to active route
 */
export function updatePageMeta(route: string, customMeta?: Partial<MetaConfig>): void {
  if (typeof document === 'undefined') return;

  const baseMeta = ROUTE_META_MAP[route] || ROUTE_META_MAP.home;
  const meta: MetaConfig = {
    title: customMeta?.title || baseMeta.title,
    description: customMeta?.description || baseMeta.description,
    canonical: customMeta?.canonical || baseMeta.canonical,
    ogType: customMeta?.ogType || 'website'
  };

  // Update title
  document.title = meta.title;

  // Helper to upsert meta tags
  const setMetaTag = (attrName: string, attrValue: string, content: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaTag('name', 'description', meta.description);
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:type', meta.ogType || 'website');
  if (meta.canonical) {
    setMetaTag('property', 'og:url', meta.canonical);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', meta.canonical);
  }
}
