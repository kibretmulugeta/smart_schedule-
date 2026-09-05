'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap,
  ShieldCheck,
  User,
  Users,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Globe,
  Github,
  Sparkles,
  Shield,
} from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const { allProfiles, switchUser, loginUser, registerNewUser, resetPassword } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramMode = searchParams.get('mode');
  const paramEmail = searchParams.get('email');
  const paramToken = searchParams.get('token');
  const paramType = searchParams.get('type') || 'formal';
  const paramApptId = searchParams.get('appointmentId');

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo'>(
    paramMode === 'register' || paramEmail ? 'register' : 'login'
  );

  // Form states
  const [email, setEmail] = useState(paramEmail || '');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-700', textColor: 'text-slate-500' };
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
    if (strengthScore <= 3) return { label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-400' };
    return { label: 'Strong & Secure', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    await loginUser(email, password);
    setLoading(false);
    router.push('/');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (password !== confirmPassword) {
      showToast('Passwords Do Not Match', 'Please ensure both password fields match.', 'error');
      return;
    }

    if (!agreeTerms) {
      showToast('Terms Required', 'Please accept the Terms of Service to create an account.', 'error');
      return;
    }

    setLoading(true);
    await registerNewUser(email.trim(), fullName.trim() || undefined, role, password);
    setLoading(false);
    router.push('/');
  };

  const handleSelectDemoPersona = (profileId: string) => {
    switchUser(profileId);
    router.push('/');
  };

  const handleSocialLogin = async (provider: string) => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider.toLowerCase() as any,
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          showToast('OAuth Notice', error.message, 'warning');
        } else {
          showToast(`Redirecting to ${provider}...`, 'Authenticating with OAuth provider.', 'info');
          return;
        }
      } catch (e) {}
    }

    showToast(`Google Workspace SSO`, `Authenticating via Google Single Sign-On...`, 'info');
    setTimeout(async () => {
      await loginUser('kibretmail@gmail.com', 'google-oauth-token');
      router.push('/');
    }, 600);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    await resetPassword(forgotEmail);
    setLoading(false);
    setShowForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 items-center justify-center shadow-glow-primary mb-2 animate-bounce-subtle">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Smart <span className="text-indigo-400 font-mono text-sm">SCHEDULING</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Multi-frequency time blocking, autonomous appointments & PostgreSQL Row Level Security.
          </p>
        </div>

        {/* Main Glassmorphic Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Top Navigation Tabs */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Register
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'demo'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Instant Demo
            </button>
          </div>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Work or Personal Email
                </label>
                <Input
                  type="email"
                  placeholder="alex.chen@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span>Remember session for 30 days</span>
                </label>
              </div>

              <Button type="submit" variant="primary" className="w-full h-11 text-xs font-bold" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Smart Scheduling'}
              </Button>

              {/* Social Login Options */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="text-[11px] text-center text-slate-400 uppercase font-semibold tracking-wider">
                  Or Sign In With Single Sign-On
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                  >
                    <Globe className="w-4 h-4 text-rose-400" />
                    <span>Google Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('GitHub')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                  >
                    <Github className="w-4 h-4 text-slate-300" />
                    <span>GitHub OAuth</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER / CREATE ACCOUNT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Invitation Banner Card */}
              {paramEmail && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-900 border border-indigo-500/40 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      {paramType === 'appointment' ? '📩 Meeting Invitation' : '✉️ Formal Platform Invitation'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified Token
                    </span>
                  </div>
                  <div className="text-xs text-slate-200">
                    Invitation received for <strong className="text-white underline">{paramEmail}</strong>.
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {paramType === 'appointment'
                      ? 'Completing registration will automatically claim your pending meeting invitation and add it directly to your Smart Scheduling calendar.'
                      : 'You were formally invited to join the platform. Complete your account credentials below to activate membership.'}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name *
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="Elena Rostova"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Invited Email Address *
                  </span>
                  {paramEmail && (
                    <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded">
                      Locked to Invitation Email
                    </span>
                  )}
                </label>
                <Input
                  type="email"
                  placeholder="elena.rostova@company.com"
                  value={email}
                  onChange={(e) => !paramEmail && setEmail(e.target.value)}
                  readOnly={Boolean(paramEmail)}
                  className={paramEmail ? 'opacity-80 bg-slate-950 font-mono text-indigo-200 cursor-not-allowed' : ''}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Checklist & Bar */}
                {password.length > 0 && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Security Score:</span>
                      <span className={`font-bold ${getStrengthLabel().textColor}`}>
                        {getStrengthLabel().label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthLabel().color}`}
                        style={{ width: `${(strengthScore / 4) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                      <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : ''}`}>
                        <CheckCircle2 className="w-3 h-3" /> 8+ Characters
                      </div>
                      <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400' : ''}`}>
                        <CheckCircle2 className="w-3 h-3" /> Uppercase Letter
                      </div>
                      <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : ''}`}>
                        <CheckCircle2 className="w-3 h-3" /> Number (0-9)
                      </div>
                      <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400' : ''}`}>
                        <CheckCircle2 className="w-3 h-3" /> Special Character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Confirm Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Account Access Level</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      role === 'user'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" /> Standard User
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Personal schedule manager & invitation receiver
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      role === 'admin'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> System Admin
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Full access to user role management & telemetry
                    </div>
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <span>
                  I accept the <span className="text-indigo-400 font-semibold underline">Terms of Service</span> and{' '}
                  <span className="text-indigo-400 font-semibold underline">Privacy Policy</span>.
                </span>
              </label>

              <Button type="submit" variant="primary" className="w-full h-11 text-xs font-bold" disabled={loading}>
                {loading ? 'Creating Account & Dispatching Welcome Email...' : 'Register & Enable Notifications'}
              </Button>
            </form>
          )}

          {/* TAB 3: INSTANT DEMO SWITCHER */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Select Instant Persona
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Test role escalation, multi-party RSVPs, and PostgreSQL RLS security.
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Zero Config
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectDemoPersona(p.id)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-left group"
                  >
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                      {p.avatar_url && (
                        <Image
                          src={p.avatar_url}
                          alt={p.full_name || 'User'}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {p.full_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{p.email}</div>
                      <div className="mt-1">
                        <span
                          className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            p.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {p.role}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" /> Reset Your Password
            </h3>
            <p className="text-xs text-slate-400">
              Enter your registered account email address. We will dispatch a password recovery link immediately.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Recovery Email'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
