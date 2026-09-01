'use client';

import React from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import {
  Calendar,
  Sparkles,
  Users,
  Repeat,
  Flame,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { schedules, appointments, getUserAppointments } = useSchedule();
  const { currentUser } = useAuth();

  const userAppointments = getUserAppointments();
  const completedHabits = schedules.filter((s) => s.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Master Interactive Calendar */}
      <CalendarView />
    </div>
  );
}
