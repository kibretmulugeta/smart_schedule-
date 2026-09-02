'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import { useToast } from '@/context/toast-context';
import { parseNaturalLanguageInput } from '@/lib/ai-scheduler';
import { ScheduleModal } from '@/components/schedules/schedule-modal';
import { AppointmentModal } from '@/components/appointments/appointment-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import {
  Sparkles,
  Search,
  Bell,
  User,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Layers,
  Zap,
  Clock,
  LogOut,
  LogIn,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Navbar() {
  const { currentUser, allProfiles, switchUser, isAdmin, isAuthenticated, signOut } = useAuth();
  const { participants, createSchedule, createAppointment } = useSchedule();
  const { showToast } = useToast();

  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Pending invites count for current user
  const pendingInvitesCount = currentUser
    ? participants.filter((p) => p.user_id === currentUser.id && p.status === 'pending').length
    : 0;

  const handleQuickAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsProcessingAi(true);
    try {
      const parsed = parseNaturalLanguageInput(aiPrompt.trim());

      if (parsed.type === 'schedule') {
        await createSchedule({
          title: parsed.title,
          description: parsed.description,
          category_id: null,
          frequency: parsed.frequency || 'daily',
          interval_value: parsed.interval_value || null,
          custom_rule_json: parsed.custom_rule_json || null,
          start_time: parsed.suggestedStartTime,
          end_time: parsed.suggestedEndTime,
          is_completed: false,
        });
        showToast(
          'Antigravity AI Scheduled',
          `Parsed "${parsed.title}" with recurrence [${parsed.frequency}].`,
          'success'
        );
      } else {
        await createAppointment(
          {
            title: parsed.title,
            description: parsed.description,
            start_time: parsed.suggestedStartTime,
            end_time: parsed.suggestedEndTime,
          },
          []
        );
        showToast('Antigravity AI Meeting Created', `Created "${parsed.title}".`, 'success');
      }

      setAiPrompt('');
    } catch (err) {
      showToast('AI Parsing Error', 'Could not parse input. Please try again.', 'error');
    } finally {
      setIsProcessingAi(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow-primary/40 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                ANTIGRAVITY <span className="text-indigo-400 font-mono text-xs">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium tracking-wide">
                Dynamic Scheduling Engine
              </span>
            </div>
          </Link>
        </div>

        {/* AI Smart Command Bar */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-4">
          <form onSubmit={handleQuickAiSubmit} className="relative">
            <div className="relative flex items-center">
              <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask Antigravity AI (e.g., 'Schedule focus block every weekday at 10am', 'Sync with Elena this Friday')..."
                className="w-full pl-10 pr-24 py-2 bg-slate-900/90 border border-slate-800 focus:border-indigo-500/60 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim() || isProcessingAi}
                className="absolute right-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
              >
                {isProcessingAi ? 'Parsing...' : 'AI Add'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Section: Persona Switcher & Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick 3-Min Test Reminder Button */}
          <button
            type="button"
            onClick={async () => {
              const targetTime = new Date(Date.now() + 3 * 60 * 1000);
              await createSchedule({
                title: '⚡ Quick Test Reminder (3-Minute Alert)',
                description: 'This is an automatic test reminder triggered 3 minutes after creation.',
                category_id: null,
                frequency: 'daily',
                interval_value: 1,
                custom_rule_json: null,
                start_time: targetTime.toISOString(),
                end_time: new Date(targetTime.getTime() + 15 * 60 * 1000).toISOString(),
                is_completed: false,
              });
              showToast(
                '3-Min Reminder Scheduled! ⏰',
                `Alert will pop up at ${targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with chime & visual alert.`,
                'success'
              );
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Schedule a test reminder 3 minutes from now"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>+3m Test Alert</span>
          </button>

          {/* Invites notification badge */}
          <Link
            href="/appointments"
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
            title={`${pendingInvitesCount} Pending Meeting Invitations`}
          >
            <Bell className="w-4 h-4" />
            {pendingInvitesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-pulse" />
            )}
          </Link>

          {/* Quick Login / Register Modal trigger */}
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Auth Center</span>
          </button>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-800 border border-indigo-500/40">
                {currentUser?.avatar_url ? (
                  <Image
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-400 m-1.5" />
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {currentUser?.full_name?.split(' ')[0] || 'Guest'}
                </div>
                <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  {isAdmin ? (
                    <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                  ) : (
                    <User className="w-2.5 h-2.5 text-slate-400" />
                  )}
                  {currentUser?.role || 'Guest'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Persona Switcher Dropdown Menu */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Interactive Persona Switcher
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Test RLS policies, admin roles & forwarding permissions.
                  </div>
                </div>

                <div className="space-y-1">
                  {allProfiles.map((profile) => {
                    const isSelected = profile.id === currentUser?.id;
                    return (
                      <button
                        key={profile.id}
                        onClick={() => {
                          switchUser(profile.id);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-800">
                            {profile.avatar_url && (
                              <Image
                                src={profile.avatar_url}
                                alt={profile.full_name || 'User'}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold truncate max-w-[130px]">
                              {profile.full_name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                              {profile.email}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                            profile.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {profile.role}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Explicit Sign Out & Register Button */}
                <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
                  <Link
                    href="/auth/login"
                    onClick={() => setShowPersonaMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-950/40 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Full Auth & Registration Page
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Auth Modal Popup */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
}
