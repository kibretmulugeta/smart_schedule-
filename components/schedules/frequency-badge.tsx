'use client';

import React from 'react';
import { FrequencyType, CustomRuleJson } from '@/types/database.types';
import { formatFrequencyLabel } from '@/lib/recurrence-engine';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Calendar,
  Sparkles,
  Repeat,
  Sun,
  Layers,
  Flame,
  CalendarDays,
  Zap,
} from 'lucide-react';

interface FrequencyBadgeProps {
  frequency: FrequencyType;
  intervalValue?: number | null;
  customRule?: CustomRuleJson | null;
  className?: string;
}

export function FrequencyBadge({
  frequency,
  intervalValue,
  customRule,
  className,
}: FrequencyBadgeProps) {
  const label = formatFrequencyLabel(frequency, intervalValue, customRule);

  const getIcon = () => {
    switch (frequency) {
      case 'custom_minutes':
      case 'hourly':
        return <Clock className="w-3 h-3 text-cyan-400" />;
      case 'daily':
        return <Sun className="w-3 h-3 text-amber-400" />;
      case 'weekly':
      case 'couple_of_weeks':
        return <Calendar className="w-3 h-3 text-indigo-400" />;
      case 'first_day_of_month':
      case 'last_day_of_month':
        return <Sparkles className="w-3 h-3 text-purple-400" />;
      case 'beginning_five_days':
      case 'last_three_days':
        return <Layers className="w-3 h-3 text-emerald-400" />;
      case 'weekends':
        return <Flame className="w-3 h-3 text-rose-400" />;
      case 'custom_multi_times_per_day':
        return <Zap className="w-3 h-3 text-yellow-400" />;
      default:
        return <Repeat className="w-3 h-3 text-slate-400" />;
    }
  };

  const getVariant = () => {
    switch (frequency) {
      case 'first_day_of_month':
      case 'last_day_of_month':
        return 'purple';
      case 'custom_multi_times_per_day':
      case 'daily':
        return 'warning';
      case 'weekends':
        return 'danger';
      case 'beginning_five_days':
      case 'last_three_days':
        return 'success';
      case 'custom_minutes':
      case 'hourly':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {getIcon()}
      <span>{label}</span>
    </Badge>
  );
}
