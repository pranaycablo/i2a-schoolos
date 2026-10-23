import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { PublicWebsiteShell } from './PublicWebsiteShell';
import { UserRole } from '../../types';
import { X, School } from 'lucide-react';

export const PublicSaasLandingPage: React.FC = () => {
  const {
    tenants,
    loginToSchool,
    language,
    setViewMode
  } = useSchool();

  const isHindi = language === 'hi';
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginSchoolId, setLoginSchoolId] = useState(tenants[0]?.id || 'I2A-SCH-000001');
  const [loginRole, setLoginRole] = useState<UserRole>('PRINCIPAL');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginToSchool(loginSchoolId, loginRole);
    setShowLoginModal(false);
  };

  return (
    <>
      <PublicWebsiteShell
        onOpenLoginModal={() => setViewMode('LOGIN')}
      />

      {/* Quick Portal Switcher Modal if triggered */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-fade-in relative text-xs text-slate-100">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close login modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                {isHindi ? 'पोर्टल प्रमाणीकरण' : 'Portal Authentication'}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {isHindi ? 'स्कूल पोर्टल में लॉगिन करें' : 'Sign In to School Portal'}
              </h2>
              <p className="text-slate-400 mt-1">
                {isHindi ? 'अपना पंजीकृत विद्यालय एवं अधिकृत भूमिका चुनें।' : 'Select your registered school & user authorization scope.'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {isHindi ? 'पंजीकृत स्कूल चुनें' : 'Select Registered School'}
                </label>
                <select
                  value={loginSchoolId}
                  onChange={(e) => setLoginSchoolId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {isHindi ? 'लॉगिन भूमिका (Role)' : 'Login Authorization Scope'}
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as UserRole)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRINCIPAL">{isHindi ? 'प्रधानाचार्य' : 'Principal / Head of School'}</option>
                  <option value="ADMIN">{isHindi ? 'स्कूल प्रबंधन / निदेशक' : 'School Management / Director'}</option>
                  <option value="TEACHER">{isHindi ? 'शिक्षक पोर्टल' : 'Teacher Portal'}</option>
                  <option value="ACCOUNTANT">{isHindi ? 'लेखाधिकारी' : 'Accountant'}</option>
                  <option value="STAFF">{isHindi ? 'कार्यालय सहायक' : 'Office Staff / Clerk'}</option>
                  <option value="TRANSPORT">{isHindi ? 'परिवहन प्रभारी / बस चालक' : 'Transport / Bus Driver'}</option>
                  <option value="PARENT">{isHindi ? 'अभिभावक पोर्टल' : 'Parent Portal'}</option>
                  <option value="STUDENT">{isHindi ? 'विद्यार्थी पोर्टल' : 'Student Portal'}</option>
                  <option value="SUPER_ADMIN">{isHindi ? 'सॉस प्लेटफॉर्म मास्टर एडमिन' : 'i2A Platform Central Operator'}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isHindi ? 'स्कूल पोर्टल खोलें' : 'Access School Portal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicSaasLandingPage;
