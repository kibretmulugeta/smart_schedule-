'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import {
  Calendar,
  Repeat,
  Users,
  Sparkles,
  Shield,
  Settings,
  Flame,
  CheckCircle2,
  Database,
  Lock,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, isAdmin } = useAuth();
  const { schedules, appointments, categories } = useSchedule();

  const activeSchedulesCount = schedules.length;
  const completedCount = schedules.filter((s) => s.is_completed).length;

  const navLinks = [
    {
      href: '/',
      label: 'Master Calendar',
      icon: <Calendar className="w-4 h-4" />,
      badge: undefined,
    },
    {
      href: '/schedules',
      label: 'Schedules & Habits',
      icon: <Repeat className="w-4 h-4" />,
      badge: activeSchedulesCount > 0 ? activeSchedulesCount : undefined,
    },
    {
      href: '/appointments',
      label: 'Appointments & Invites',
      icon: <Users className="w-4 h-4" />,
      badge: appointments.length > 0 ? appointments.length : undefined,
    },
    {
      href: '/ai',
      label: 'AI Scheduler & Optimizer',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      badge: 'AI',
    },
    {
      href: '/admin',
      label: 'Admin Control Center',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      badge: isAdmin ? 'Admin' : 'Restricted',
    },
    {
      href: '/settings',
      label: 'Settings & Categories',
      icon: <Settings className="w-4 h-4" />,
      badge: undefined,
    },
    {
      href: '/auth/login',
      label: 'Registration & Auth',
      icon: <Lock className="w-4 h-4 text-indigo-400" />,
      badge: 'Auth',
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-800 bg-slate-950/60 backdrop-blur-md min-h-[calc(100vh-4rem)] p-4 space-y-6">
      {/* Navigation Menu */}
      <div className="space-y-1">
        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {link.icon}
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : link.badge === 'AI'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : link.badge === 'Admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Productivity & Consistency Widget */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Daily Habits
          </span>
          <span className="text-xs font-mono font-bold text-indigo-400">
            {completedCount}/{activeSchedulesCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
            style={{
              width: `${
                activeSchedulesCount > 0 ? (completedCount / activeSchedulesCount) * 100 : 0
              }%`,
            }}
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {completedCount === activeSchedulesCount && activeSchedulesCount > 0
            ? '🔥 All routine blocks completed today!'
            : 'Keep building momentum across your recurring workflows.'}
        </p>
      </div>

      {/* PostgreSQL & Supabase Status Badge */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL 16
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Lock className="w-2.5 h-2.5" /> RLS Strict
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          14 Frequency Types Engine
        </div>
      </div>
    </aside>
  );
}
