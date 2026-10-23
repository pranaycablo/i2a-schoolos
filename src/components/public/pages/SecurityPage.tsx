import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck2,
  Server,
  Database,
  Terminal,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { PublicRoute } from '../../../types';

interface SecurityPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate, isHindi = false }) => {
  const securityControls = [
    {
      icon: Lock,
      title: 'AES-256 & TLS 1.3 Encryption',
      desc: 'All stored databases, file attachments, and nightly snapshots are encrypted with AES-256. Web and API traffic requires mandatory TLS 1.3.'
    },
    {
      icon: Database,
      title: 'Zero-Bypass Tenant Boundaries',
      desc: 'Middleware automatically validates user scope and enforces authoritative tenant query filters, eliminating cross-school data leaks.'
    },
    {
      icon: KeyRound,
      title: 'Cryptographic Token Revocation',
      desc: 'Multi-process SHA-256 hashed blacklist in MongoDB and Redis instantly terminates sessions upon logout or password modification.'
    },
    {
      icon: Terminal,
      title: 'Fail-Closed NoSQL Injection Guard',
      desc: 'Strict middleware proactively inspects query, params, and body payloads, rejecting any NoSQL operator tampering with HTTP 400.'
    },
    {
      icon: FileCheck2,
      title: 'Immutable Audit Logging',
      desc: 'All administrative changes, fee collections, grade overrides, and parent notifications are logged with actor ID, timestamp, and IP address.'
    },
    {
      icon: Server,
      title: 'Automated Disaster Recovery',
      desc: 'Architectural target: Continuous snapshotting with point-in-time recovery targets an RPO under 15 minutes and an RTO under 1 hour in production disaster recovery environments.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16 font-sans">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'सुरक्षा श्वेतपत्र' : 'Security Posture & Cryptography'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'संस्थागत डेटा हेतु उच्चतम सुरक्षा मानक' : 'Defense-in-Depth for India’s Educational Institutions'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'i2A SchoolOS को शून्य-विश्वास (Zero-Trust) सिद्धांतों पर तैयार किया गया है ताकि छात्रों और स्कूलों का डेटा सदैव सुरक्षित रहे।'
            : 'Explore the cryptographic architecture, access boundaries, and statutory compliance controls protecting your campus records.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityControls.map((ctrl, idx) => {
          const Icon = ctrl.icon;
          return (
            <div key={idx} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white">{ctrl.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{ctrl.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">
          Responsible Vulnerability Disclosure
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          i2A welcomes independent security researchers to audit our public endpoints responsibly. If you discover a potential vulnerability, please report it to our security engineering team at <code className="text-indigo-400">security@i2a.in</code> with a reproducible proof-of-concept. We commit to acknowledging receipt within 24 hours.
        </p>
      </div>
    </div>
  );
};
