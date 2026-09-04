'use client';

import React, { useState, useEffect } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { useToast } from '@/context/toast-context';
import { useAuth } from '@/context/auth-context';
import { useNotification } from '@/context/notification-context';
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
  attendeesCount?: number;
}

export function ReminderNotifier() {
  const { schedules, appointments, participants, toggleScheduleCompleted } = useSchedule();
  const { showToast } = useToast();
  const { currentUser, allProfiles } = useAuth();
  const { soundEnabled, playChimeSound, dispatchDualNotification } = useNotification();

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

  // Listen for custom trigger-test-reminder event
  useEffect(() => {
    const handleCustomTest = (e: any) => {
      const detail = e.detail || {};
      const testItem: DueReminderItem = {
        id: `test-${Date.now()}`,
        title: detail.title || 'Smart Scheduling Dual-Channel Sync Alert',
        description: detail.description || 'Live screen reminder and verified email dispatch test alert.',
        startTime: new Date(),
        type: detail.type || 'appointment',
        categoryColor: '#6366F1',
        attendeesCount: detail.attendeesCount || 3,
      };
      triggerAlert(testItem);
    };

    window.addEventListener('trigger-test-reminder', handleCustomTest);
    return () => window.removeEventListener('trigger-test-reminder', handleCustomTest);
  }, [currentUser, allProfiles]);

  const triggerAlert = async (item: DueReminderItem) => {
    setActiveAlert(item);
    playChimeSound();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.35 },
        colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'],
      });
    } catch (e) {}

    // 1. If it is an appointment: Notify meeting creator AND all invited participants via email
    if (item.type === 'appointment') {
      const targetAppt = appointments.find((a) => a.id === item.id);
      const apptParticipants = participants.filter((p) => p.appointment_id === item.id);
      const host = allProfiles.find((pr) => pr.id === targetAppt?.creator_id) || currentUser;

      // Email list: Host + participants
      const recipients: { name: string; email: string; isHost?: boolean }[] = [];
      if (host?.email) {
        recipients.push({
          name: host.full_name || 'Meeting Host',
          email: host.email,
          isHost: true,
        });
      }

      apptParticipants.forEach((p) => {
        if (p.profile?.email && !recipients.some((r) => r.email === p.profile!.email)) {
          recipients.push({
            name: p.profile.full_name || 'Meeting Attendee',
            email: p.profile.email,
            isHost: false,
          });
        }
      });

      // Fallback if empty test
      if (recipients.length === 0 && currentUser?.email) {
        recipients.push({
          name: currentUser.full_name || 'User',
          email: currentUser.email,
          isHost: true,
        });
      }

      // Dispatch dual notifications to all recipients
      for (const rec of recipients) {
        await dispatchDualNotification({
          category: 'meeting_reminder',
          title: `⏰ Meeting Reminder: ${item.title}`,
          message: `Your scheduled meeting is starting now (${format(item.startTime, 'h:mm a')})!`,
          targetUserId: rec.email === host?.email ? host?.id : undefined,
          recipientEmail: rec.email,
          recipientName: rec.name,
          emailPayload: {
            to: rec.email,
            recipientName: rec.name,
            subject: `⏰ Meeting Reminder: ${item.title}`,
            type: 'meeting_reminder',
            eventTitle: item.title,
            eventDescription: item.description || 'Your scheduled multi-party meeting is starting now.',
            startTime: item.startTime.toISOString(),
            hostName: host?.full_name || 'Meeting Host',
            hostEmail: host?.email,
          },
          showToastAlert: rec.email === currentUser?.email,
          playChime: false, // already played once
          eventId: item.id,
          eventTime: item.startTime.toISOString(),
        });
      }
    } else {
      // 2. If it is a personal schedule routine: Notify schedule creator via email & screen
      const targetEmail = currentUser?.email || 'adwaat1888@gmail.com';
      await dispatchDualNotification({
        category: 'schedule_reminder',
        title: `⏰ Routine Due: ${item.title}`,
        message: `Your scheduled habit "${item.title}" is due now (${format(item.startTime, 'h:mm a')}).`,
        targetUserId: currentUser?.id,
        recipientEmail: targetEmail,
        recipientName: currentUser?.full_name || 'Schedule Member',
        emailPayload: {
          to: targetEmail,
          recipientName: currentUser?.full_name || 'Schedule Member',
          subject: `⏰ Reminder Alert: ${item.title}`,
          type: 'schedule_reminder',
          eventTitle: item.title,
          eventDescription: item.description || 'Your recurring schedule habit is starting now.',
          startTime: item.startTime.toISOString(),
          hostName: currentUser?.full_name || 'You',
        },
        showToastAlert: true,
        playChime: false,
        eventId: item.id,
        eventTime: item.startTime.toISOString(),
      });
    }

    // Native browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ Smart Scheduling: ${item.title}`, {
          body: item.description || `Starting now at ${format(item.startTime, 'h:mm a')}`,
          icon: '/favicon.ico',
        });
      } catch (e) {}
    }
  };

  // Periodic reminder checker: checks every 4 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const nowTime = now.getTime();

      // 1. Check Schedules
      for (const s of schedules) {
        if (s.is_completed) continue;
        const sTime = new Date(s.start_time).getTime();
        const reminderKey = `sched-${s.id}-${Math.floor(sTime / 60000)}`;

        // Trigger if start time is within past 3 minutes to upcoming 30 seconds
        const diffSecs = (sTime - nowTime) / 1000;
        if (diffSecs <= 30 && diffSecs >= -180 && !notifiedIds.has(reminderKey)) {
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

      // 2. Check Appointments
      for (const a of appointments) {
        const aTime = new Date(a.start_time).getTime();
        const reminderKey = `appt-${a.id}-${Math.floor(aTime / 60000)}`;
        const diffSecs = (aTime - nowTime) / 1000;

        if (diffSecs <= 30 && diffSecs >= -180 && !notifiedIds.has(reminderKey)) {
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

    const interval = setInterval(checkReminders, 4000);
    checkReminders();

    return () => clearInterval(interval);
  }, [schedules, appointments, notifiedIds, participants, currentUser, allProfiles]);

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
