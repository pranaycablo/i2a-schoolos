import React, { useState, useEffect } from 'react';
import { School, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Building2, UserCheck, KeyRound, CheckCircle2, X } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { UserRole } from '../types';
import { authApi, setAuthToken } from '../services/apiClient';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Card, CardContent } from '../design-system/components/Card';
import { Badge } from '../design-system/components/Badge';

export interface LoginPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel }) => {
  const { tenants, activeTenant, loginToSchool, setCurrentRole, setViewMode, syncWithBackend } = useSchool();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(activeTenant?.id || 'I2A-SCH-000001');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PRINCIPAL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP' | 'SET_PASSWORD' | 'DONE'>('REQUEST_OTP');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Account Activation Modal State
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [actEmail, setActEmail] = useState('');
  const [actToken, setActToken] = useState('');
  const [actPassword, setActPassword] = useState('');
  const [actLoading, setActLoading] = useState(false);
  const [actMsg, setActMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Automatically read token or recovery query parameters from URL
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('activateToken') || params.get('invitationToken');
      const emailParam = params.get('email');
      const resetOtpParam = params.get('otp') || params.get('resetOtp');
      const action = params.get('action');

      if (token) {
        setActToken(token);
        if (emailParam) setActEmail(emailParam);
        setIsActivateModalOpen(true);
      } else if (action === 'activate' || window.location.pathname.includes('/activate')) {
        setIsActivateModalOpen(true);
      }

      if (resetOtpParam || action === 'reset-password' || window.location.pathname.includes('/reset-password')) {
        if (emailParam) setForgotEmail(emailParam);
        if (resetOtpParam) {
          setForgotOtp(resetOtpParam);
          setForgotStep('VERIFY_OTP');
        } else {
          setForgotStep('REQUEST_OTP');
        }
        setIsForgotModalOpen(true);
      }
    } catch {}
  }, []);

  const demoAccounts: { label: string; role: UserRole; email: string; pass: string; badge: string }[] = [
    { label: 'Principal', role: 'PRINCIPAL', email: 'principal@abcpublicschool.edu.in', pass: 'Principal@2026#', badge: 'Leadership' },
    { label: 'School Admin', role: 'ADMIN', email: 'admin@abcpublicschool.edu.in', pass: 'Admin@2026#', badge: 'Operations' },
    { label: 'Teacher', role: 'TEACHER', email: 'sunita.mishra@abcpublicschool.edu.in', pass: 'Teacher@2026#', badge: 'Instructional' },
    { label: 'Student', role: 'STUDENT', email: 'rahul.kumar@abcpublicschool.edu.in', pass: 'Student@2026#', badge: 'Learner' },
    { label: 'Platform Admin', role: 'SUPER_ADMIN', email: 'superadmin@i2aschoolos.com', pass: 'SuperAdmin@2026#', badge: 'Root' },
  ];

  const handleFillDemo = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setSelectedRole(demo.role);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login({
        email: email.trim(),
        password
      });

      if (res.ok && res.data?.token) {
        setAuthToken(res.data.token);
        const verifiedRole = (res.data.user.role as UserRole) || selectedRole;
        const targetSchoolId =
          res.data.user.schoolId && res.data.user.schoolId !== 'ALL'
            ? res.data.user.schoolId
            : selectedSchoolId;

        loginToSchool(targetSchoolId, verifiedRole, res.data.user as any);
        await syncWithBackend();
        onSuccess?.();
      } else {
        // Fail closed: Never grant portal session on authentication failure
        if (res.status === 429) {
          setErrorMessage('Account is temporarily locked due to too many failed attempts. Please try again later.');
        } else if (res.status === 401 || res.status === 403) {
          setErrorMessage(res.error || (res.data as any)?.error || 'Invalid email or password. Authentication failed.');
        } else if (res.status >= 500) {
          setErrorMessage('Authentication server encountered an unexpected error. Please try again later.');
        } else {
          setErrorMessage(res.error || (res.data as any)?.error || 'Authentication failed. Please verify your credentials.');
        }
      }
    } catch (err: any) {
      console.warn('Login request network failure:', err);
      // Fail closed: Network or server error must not bypass authentication
      setErrorMessage('Network error: Unable to connect to authentication server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotMsg({ text: 'Please enter your registered email address.', isError: true });
      return;
    }
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      if (res.ok) {
        setForgotStep('VERIFY_OTP');
        setForgotMsg({
          text: (res.data as any)?.debugOtp
            ? `OTP code generated! (Dev Preview: ${(res.data as any).debugOtp})`
            : 'If your email is registered, a 6-digit verification code has been dispatched.',
          isError: false
        });
      } else {
        setForgotMsg({ text: res.error || 'Failed to dispatch verification code.', isError: true });
      }
    } catch {
      setForgotMsg({ text: 'Connection error while contacting recovery service.', isError: true });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setForgotMsg({ text: 'Please enter the 6-digit code received.', isError: true });
      return;
    }
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await authApi.verifyOtp(forgotEmail.trim(), forgotOtp.trim());
      if (res.ok && res.data?.resetToken) {
        setForgotResetToken(res.data.resetToken);
        setForgotStep('SET_PASSWORD');
        setForgotMsg({ text: 'Code verified successfully. Please enter your new password.', isError: false });
      } else {
        setForgotMsg({ text: res.error || 'Invalid verification code. Please try again.', isError: true });
      }
    } catch {
      setForgotMsg({ text: 'Connection error during code verification.', isError: true });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotMsg({ text: 'Password must be at least 8 characters long.', isError: true });
      return;
    }
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await authApi.resetPassword(forgotEmail.trim(), forgotResetToken, forgotNewPassword);
      if (res.ok) {
        setForgotStep('DONE');
        setForgotMsg({ text: 'Password reset complete! You can now log in with your new credentials.', isError: false });
      } else {
        setForgotMsg({ text: res.error || 'Password reset failed.', isError: true });
      }
    } catch {
      setForgotMsg({ text: 'Connection error while saving new password.', isError: true });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actToken.trim() || !actPassword) {
      setActMsg({ text: 'Invitation token and new password are required.', isError: true });
      return;
    }
    if (actPassword.length < 8) {
      setActMsg({ text: 'Password must be at least 8 characters with upper, lower, number and symbol.', isError: true });
      return;
    }
    setActLoading(true);
    setActMsg(null);
    try {
      const res = await authApi.activateAccount({
        invitationToken: actToken.trim(),
        newPassword: actPassword,
        email: actEmail.trim() || undefined
      });
      if (res.ok && res.data?.token) {
        setActMsg({ text: 'Account activated successfully! Logging you in...', isError: false });
        setAuthToken(res.data.token);
        const verifiedRole = (res.data.user.role as UserRole) || selectedRole;
        loginToSchool(res.data.user.schoolId || selectedSchoolId, verifiedRole, res.data.user as any);
        await syncWithBackend();
        setTimeout(() => {
          setIsActivateModalOpen(false);
          onSuccess?.();
        }, 1200);
      } else {
        setActMsg({ text: res.error || 'Account activation failed. Verify your invitation token.', isError: true });
      }
    } catch {
      setActMsg({ text: 'Network connection failure during account activation.', isError: true });
    } finally {
      setActLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
            <School className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            i2A SchoolOS
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Operating System for Modern Educational Institutions
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">
                Institutional Single Sign-On
              </span>
              <Badge variant="brand" size="sm">
                256-bit SSL
              </Badge>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Institution Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Institution / Branch
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-100 p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id} • {t.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <Input
                id="login-email-input"
                label="Registered Email or Login ID"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. principal@abcpublicschool.edu.in"
                leftIcon={<Mail className="h-4 w-4 text-slate-500" />}
                className="bg-slate-800/80 border-slate-700 text-slate-100"
              />

              {/* Password */}
              <div>
                <Input
                  id="login-password-input"
                  label="Secret Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="h-4 w-4 text-slate-500" />}
                  className="bg-slate-800/80 border-slate-700 text-slate-100"
                />
                <div className="flex items-center justify-between text-[11px] pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setForgotStep('REQUEST_OTP');
                      setForgotMsg(null);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActivateModalOpen(true);
                      setActMsg(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium cursor-pointer"
                  >
                    Activate account with token →
                  </button>
                </div>
              </div>

              {/* Persona Quick Fill Tabs — Dev Only */}
              {import.meta.env.DEV && (
                <div>
                  <span className="block text-[11px] font-semibold text-amber-500 mb-2">
                    Quick-Fill Demo Persona (Dev Only):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {demoAccounts.map((d) => (
                      <button
                        key={d.role}
                        type="button"
                        onClick={() => handleFillDemo(d)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium text-left border transition-colors ${
                          selectedRole === d.role
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="truncate">{d.label}</div>
                        <div className="text-[9px] text-slate-500 truncate">{d.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                id="login-submit-btn"
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="mt-2"
              >
                Authenticate & Enter Portal
              </Button>
            </form>

            {onCancel && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Back to Public Overview
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Protected by AES-256 Encryption & Zero-Bypass Multi-Tenant Scoping</span>
        </div>
      </div>

      {/* ─── MODAL 1: Forgot Password Recovery ────────────────────────────────── */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <KeyRound className="w-4 h-4" /> Account Password Recovery
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  forgotMsg.isError
                    ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                }`}
              >
                {forgotMsg.isError ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotStep === 'REQUEST_OTP' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered email address. If an active account matches, a 6-digit verification code will be dispatched.
                </p>
                <Input
                  label="Registered Email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. user@school.edu.in"
                  className="bg-slate-800 border-slate-700"
                />
                <Button type="submit" fullWidth isLoading={forgotLoading}>
                  Send Verification Code
                </Button>
              </form>
            )}

            {forgotStep === 'VERIFY_OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the 6-digit verification code sent to <strong className="text-slate-200">{forgotEmail}</strong>. Code expires in 10 minutes.
                </p>
                <Input
                  label="6-Digit Verification Code"
                  type="text"
                  maxLength={6}
                  required
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="bg-slate-800 border-slate-700 text-center tracking-widest font-mono text-base"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setForgotStep('REQUEST_OTP')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" isLoading={forgotLoading} className="flex-1">
                    Verify Code
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === 'SET_PASSWORD' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose a new strong password (minimum 8 characters with uppercase, lowercase, numbers, and symbols).
                </p>
                <Input
                  label="New Password"
                  type="password"
                  required
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-slate-800 border-slate-700"
                />
                <Button type="submit" fullWidth isLoading={forgotLoading}>
                  Save New Password
                </Button>
              </form>
            )}

            {forgotStep === 'DONE' && (
              <div className="text-center space-y-4 py-2">
                <div className="inline-flex p-3 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-300">
                  Your password has been updated securely. You can now log in with your new credentials.
                </p>
                <Button
                  type="button"
                  fullWidth
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setEmail(forgotEmail);
                  }}
                >
                  Return to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Account Activation with Single-Use Token ────────────────── */}
      {isActivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" /> Activate Invitation Account
              </div>
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  actMsg.isError
                    ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                }`}
              >
                {actMsg.isError ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                <span>{actMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleActivateAccount} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                If you received an invitation email from your school, enter your email and the 64-character activation token provided in the link.
              </p>
              <Input
                label="Registered Email (Optional)"
                type="email"
                value={actEmail}
                onChange={(e) => setActEmail(e.target.value)}
                placeholder="e.g. ananya@abcschool.in"
                className="bg-slate-800 border-slate-700"
              />
              <Input
                id="activate-token-input"
                label="Single-Use Invitation Token"
                type="text"
                required
                value={actToken}
                onChange={(e) => setActToken(e.target.value.trim())}
                placeholder="32-byte cryptographic token (64 hex characters)"
                className="bg-slate-800 border-slate-700 font-mono text-xs"
              />
              <Input
                id="activate-password-input"
                label="Choose Your Password"
                type="password"
                required
                value={actPassword}
                onChange={(e) => setActPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-slate-800 border-slate-700"
              />
              <p className="text-[10px] text-slate-500">
                Requirement: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
              </p>
              <Button id="activate-submit-btn" type="submit" fullWidth isLoading={actLoading}>
                Activate Account & Enter Portal
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
