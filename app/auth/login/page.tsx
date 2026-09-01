'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, ShieldCheck, User, Users, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { allProfiles, switchUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      'Authentication Initialized',
      `Simulated ${isSignUp ? 'Registration' : 'Login'} for ${email}. Using active persona store.`,
      'success'
    );
    router.push('/');
  };

  const handleSelectDemoPersona = (profileId: string) => {
    switchUser(profileId);
    router.push('/');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 items-center justify-center shadow-glow-primary mb-2">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Antigravity AI Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Autonomous multi-frequency time blocking and collaborative appointments with PostgreSQL Row Level Security.
          </p>
        </div>

        {/* 1-Click Interactive Demo Personas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Select Instant Demo Persona
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Experience role escalation, multi-party RSVPs, and RLS security.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectDemoPersona(p.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-left group"
              >
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
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
                      className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        p.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Live Supabase Auth Form */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Supabase Credentials Login
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full">
              {isSignUp ? 'Create Supabase Account' : 'Sign In with Supabase'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
