import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' | 'custom';
  customBg?: string;
  className?: string;
}

export function Badge({ children, variant = 'neutral', customBg, className }: BadgeProps) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors';

  const variants = {
    primary: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    custom: '',
  };

  return (
    <span
      className={cn(base, variants[variant], className)}
      style={customBg ? { backgroundColor: `${customBg}20`, borderColor: `${customBg}60`, color: customBg } : undefined}
    >
      {children}
    </span>
  );
}
