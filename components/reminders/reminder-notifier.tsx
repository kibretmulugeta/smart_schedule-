'use client';

import React, { useState, useEffect } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { useToast } from '@/context/toast-context';
import { useAuth } from '@/context/auth-context';
import { Schedule, Appointment } from '@/types/database.types';
import {
  BellRing,
  Clock,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  Calendar,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface DueReminderItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  type: 'schedule' | 'appointment';
  categoryColor?: string;
}

export function ReminderNotifier() {
  const { schedules, appointments, toggleScheduleCompleted } = useSchedule();
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [activeAlert, setActiveAlert] = useState<DueReminderItem | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  // Request browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Audio chime synthesizer using Web Audio API
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play dual chime (frequency 587.33 Hz (D5) -> 880 Hz (A5))
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (e) {
      console.warn('Audio chime issue', e);
    }
  };

  // Check every 5 seconds for due reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const nowTime = now.getTime();

      // Check schedules
      for (const s of schedules) {
        if (s.is_completed) continue;
        const sTime = new Date(s.start_time).getTime();
        const reminderKey = `sched-${s.id}-${Math.floor(sTime / 60000)}`;

        // Trigger if start time is within past 2 minutes to now (or upcoming 15 seconds)
        const diffSecs = (sTime - nowTime) / 1000;
        if (diffSecs <= 15 && diffSecs >= -120 && !notifiedIds.has(reminderKey)) {
          setNotifiedIds((prev) => new Set(prev).add(reminderKey));
          const reminderItem: DueReminderItem = {
            id: s.id,
            title: s.title,
            description: s.description,
            startTime: new Date(s.start_time),
            type: 'schedule',
            categoryColor: s.category?.color,
          };
          triggerAlert(reminderItem);
          return;
        }
      }

      // Check appointments
      for (const a of appointments) {
        const aTime = new Date(a.start_time).getTime();
        const reminderKey = `appt-${a.id}-${Math.floor(aTime / 60000)}`;
        const diffSecs = (aTime - nowTime) / 1000;

        if (diffSecs <= 15 && diffSecs >= -120 && !notifiedIds.has(reminderKey)) {
          setNotifiedIds((prev) => new Set(prev).add(reminderKey));
          const reminderItem: DueReminderItem = {
            id: a.id,
            title: a.title,
            description: a.description,
            startTime: new Date(a.start_time),
            type: 'appointment',
          };
          triggerAlert(reminderItem);
          return;
        }
      }
    };

    const triggerAlert = (item: DueReminderItem) => {
      setActiveAlert(item);
      playChimeSound();
      showToast(
        `⏰ Reminder Alert: ${item.title}`,
        `Your scheduled ${item.type} is starting now (${format(item.startTime, 'h:mm a')})!`,
        'warning'
      );

      // Dispatch Email reminder alert
      const targetRecipientEmail = currentUser?.email || 'kibretmail@gmail.com';
      try {
        fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetRecipientEmail,
            recipientName: currentUser?.full_name || 'Schedule Member',
            subject: `⏰ Screen Reminder Alert: ${item.title}`,
            type: 'schedule_reminder',
            eventTitle: item.title,
            eventDescription: item.description,
            startTime: item.startTime.toISOString(),
          }),
        }).catch(() => {});
      } catch (e) {}

      // System notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`⏰ Antigravity AI Reminder: ${item.title}`, {
            body: item.description || `Event starting now at ${format(item.startTime, 'h:mm a')}`,
            icon: '/favicon.ico',
          });
        } catch (e) {}
      }

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.3 },
          colors: ['#6366F1', '#EC4899', '#F59E0B'],
        });
      } catch (e) {}
    };

    const interval = setInterval(checkReminders, 4000);
    checkReminders(); // check immediately

    return () => clearInterval(interval);
  }, [schedules, appointments, notifiedIds, showToast]);

  if (!activeAlert) return null;

  const handleComplete = () => {
    if (activeAlert.type === 'schedule') {
      toggleScheduleCompleted(activeAlert.id);
    }
    setActiveAlert(null);
  };

  const handleSnooze = () => {
    showToast('Reminder Snoozed', 'Will alert again in 5 minutes.', 'info');
    setActiveAlert(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-lg animate-in fade-in"
        onClick={() => setActiveAlert(null)}
      />

      {/* Pulsing Alert Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-indigo-500/80 shadow-glow-primary p-6 z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Top Glow Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold animate-pulse">
            <BellRing className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span>ALARM / REMINDER DUE NOW</span>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 relative z-10">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Scheduled for: <span className="text-white font-bold">{format(activeAlert.startTime, 'h:mm a · MMMM d, yyyy')}</span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight leading-snug">
            {activeAlert.title}
          </h2>

          {activeAlert.description && (
            <p className="text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 leading-relaxed">
              {activeAlert.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSnooze}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
          >
            Snooze 5m
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:opacity-95 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {activeAlert.type === 'schedule' ? 'Mark Completed' : 'Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
}
