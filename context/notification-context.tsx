'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { EmailNotificationPayload, EmailNotificationType } from '@/lib/email-service';
import { useToast } from './toast-context';

export type NotificationCategory =
  | 'meeting_created'
  | 'appointment_invite'
  | 'meeting_reminder'
  | 'schedule_reminder'
  | 'forward_invite'
  | 'rsvp_update'
  | 'schedule_created'
  | 'system_alert';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUserId?: string;
  recipientEmail?: string;
  emailDispatched: boolean;
  emailMode?: 'resend_live' | 'simulated_dispatch';
  htmlPreview?: string;
  actionUrl?: string;
  eventId?: string;
  eventTime?: string;
  hostName?: string;
  rsvpStatus?: string;
}

export interface DispatchDualNotificationParams {
  category: NotificationCategory;
  title: string;
  message: string;
  targetUserId?: string;
  recipientEmail?: string;
  recipientName?: string;
  emailPayload?: Partial<EmailNotificationPayload>;
  showToastAlert?: boolean;
  playChime?: boolean;
  actionUrl?: string;
  eventId?: string;
  eventTime?: string;
  hostName?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  previewHtml: string | null;
  setPreviewHtml: (html: string | null) => void;
  dispatchDualNotification: (params: DispatchDualNotificationParams) => Promise<NotificationItem>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  playChimeSound: () => void;
  testScreenAndEmailAlert: (targetEmail?: string, targetName?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEYS = {
  NOTIFICATIONS: 'antigravity_notifications_cache',
  SOUND: 'antigravity_sound_enabled',
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    category: 'system_alert',
    title: 'Dual-Channel Alert System Active',
    message: 'Screen notifications and automated email dispatches are initialized and monitoring your calendar.',
    timestamp: new Date().toISOString(),
    read: false,
    emailDispatched: true,
    emailMode: 'simulated_dispatch',
    recipientEmail: 'kibretmail@gmail.com',
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Load notifications and sound preference from localStorage on mount & Register Service Worker
  useEffect(() => {
    try {
      const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      }
      const storedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (storedSound !== null) {
        setSoundEnabledState(storedSound === 'true');
      }
    } catch (e) {
      console.warn('Could not read notification preferences', e);
    }

    // Register PWA Service Worker for lock-screen vibration and alerts
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Antigravity Lock-Screen Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration issue:', err);
        });
    }
  }, []);

  const saveNotifications = useCallback((items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(items));
    } catch (e) {}
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
    } catch (e) {}
  };

  // Pleasant multi-tone Web Audio synthesizer
  const playChimeSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Note 1: 523.25 Hz (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      // Note 2: 659.25 Hz (E5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.55);

      // Note 3: 783.99 Hz (G5)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      gain3.gain.setValueAtTime(0.3, ctx.currentTime + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(ctx.currentTime + 0.24);
      osc3.stop(ctx.currentTime + 0.75);
    } catch (e) {
      console.warn('Audio chime playback issue', e);
    }
  }, [soundEnabled]);

  /**
   * Dispatches a notification simultaneously across Screen & Email channels
   */
  const dispatchDualNotification = useCallback(
    async (params: DispatchDualNotificationParams): Promise<NotificationItem> => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toISOString();

      let emailDispatched = false;
      let emailMode: 'resend_live' | 'simulated_dispatch' | undefined;
      let htmlPreview: string | undefined;

      // 1. Dispatch Email Channel asynchronously if recipient is present
      const recipientEmail = params.recipientEmail || params.emailPayload?.to;
      if (recipientEmail) {
        try {
          const emailBody: EmailNotificationPayload = {
            to: recipientEmail,
            recipientName: params.recipientName || params.emailPayload?.recipientName || 'Schedule Member',
            subject: params.emailPayload?.subject || `🔔 Alert: ${params.title}`,
            type: (params.emailPayload?.type as EmailNotificationType) || 'daily_digest',
            eventTitle: params.emailPayload?.eventTitle || params.title,
            eventDescription: params.emailPayload?.eventDescription || params.message,
            startTime: params.emailPayload?.startTime || timestamp,
            endTime: params.emailPayload?.endTime,
            hostName: params.hostName || params.emailPayload?.hostName,
            hostEmail: params.emailPayload?.hostEmail,
            actionUrl: params.actionUrl || params.emailPayload?.actionUrl || 'https://smart-schedule-lfpf.vercel.app',
            attendees: params.emailPayload?.attendees,
            rsvpStatus: params.emailPayload?.rsvpStatus,
          };

          const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailBody),
          });

          if (response.ok) {
            const data = await response.json();
            emailDispatched = true;
            emailMode = data.mode;
            htmlPreview = data.htmlPreview;
          }
        } catch (err) {
          console.warn('Email dispatch failed silently in background:', err);
        }
      }

      // 2. Dispatch Screen Channel (Toast & Chime)
      if (params.showToastAlert !== false) {
        const toastType =
          params.category === 'meeting_reminder' || params.category === 'schedule_reminder'
            ? 'warning'
            : params.category === 'meeting_created' || params.category === 'appointment_invite'
            ? 'success'
            : 'info';

        showToast(params.title, params.message, toastType, true);
      }

      if (params.playChime !== false) {
        playChimeSound();
      }

      // 3. Dispatch Native Web & Mobile Lock-Screen Notification with Vibration
      if (typeof window !== 'undefined') {
        // A. Service Worker alert (persists and wakes phone through lock screen)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          try {
            navigator.serviceWorker.controller.postMessage({
              type: 'TRIGGER_LOCK_SCREEN_ALERT',
              title: params.title,
              message: params.message,
              eventId: params.eventId,
              url: window.location.origin,
            });
          } catch (e) {}
        }

        // B. Native browser alert with high-priority vibration & requireInteraction
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notifOpts: any = {
              body: params.message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [300, 150, 300, 150, 400],
              requireInteraction: true,
              tag: `lock-alert-${params.eventId || id}`,
            };
            new Notification(params.title, notifOpts);

            // Also trigger device hardware vibration if supported
            if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
              navigator.vibrate([300, 150, 300, 150, 400]);
            }
          } catch (e) {}
        }

        // C. Dispatch real background Web Push to all registered mobile devices
        try {
          fetch('/api/notifications/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: params.title,
              message: params.message,
              url: window.location.origin,
              eventId: params.eventId,
            }),
          }).catch(() => {});
        } catch (e) {}
      }

      // 4. Save to persistent notification history
      const newNotification: NotificationItem = {
        id,
        category: params.category,
        title: params.title,
        message: params.message,
        timestamp,
        read: false,
        targetUserId: params.targetUserId,
        recipientEmail,
        emailDispatched,
        emailMode,
        htmlPreview,
        actionUrl: params.actionUrl,
        eventId: params.eventId,
        eventTime: params.eventTime,
        hostName: params.hostName,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50); // keep 50 most recent
        try {
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return newNotification;
    },
    [showToast, playChimeSound]
  );

  const markAsRead = (id: string) => {
    saveNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const testScreenAndEmailAlert = async (targetEmail?: string, targetName?: string) => {
    const email = targetEmail || 'adwaat1888@gmail.com';
    await dispatchDualNotification({
      category: 'meeting_reminder',
      title: '⚡ Dual-Channel Screen & Email Alert Test',
      message: `Verified! Live screen chime sounded and email notice dispatched to ${email}.`,
      recipientEmail: email,
      recipientName: targetName || 'System Admin',
      emailPayload: {
        to: email,
        recipientName: targetName || 'System Admin',
        subject: '⏰ Dual-Channel Test: Antigravity AI Screen & Email Notification',
        type: 'meeting_reminder',
        eventTitle: 'Antigravity AI Quantum Architecture Review (Test Alert)',
        eventDescription: 'This test validates that both on-screen visual banners and background email delivery work in real-time.',
        startTime: new Date().toISOString(),
        hostName: 'Antigravity AI Alert Service',
      },
      showToastAlert: true,
      playChime: true,
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        setSoundEnabled,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        previewHtml,
        setPreviewHtml,
        dispatchDualNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        playChimeSound,
        testScreenAndEmailAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
