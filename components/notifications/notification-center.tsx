'use client';

import React, { useState } from 'react';
import { useNotification, NotificationItem } from '@/context/notification-context';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import { EmailPreviewModal } from './email-preview-modal';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Check,
  Trash2,
  X,
  Users,
  Calendar,
  Clock,
  Mail,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Share2,
  Send,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
    testScreenAndEmailAlert,
  } = useNotification();

  const { currentUser } = useAuth();
  const { respondToAppointment } = useSchedule();

  const [activeTab, setActiveTab] = useState<'all' | 'meetings' | 'reminders' | 'emails'>('all');
  const [previewItem, setPreviewItem] = useState<NotificationItem | null>(null);

  if (!isNotificationCenterOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'meetings') {
      return (
        n.category === 'meeting_created' ||
        n.category === 'appointment_invite' ||
        n.category === 'forward_invite' ||
        n.category === 'rsvp_update'
      );
    }
    if (activeTab === 'reminders') {
      return n.category === 'meeting_reminder' || n.category === 'schedule_reminder';
    }
    if (activeTab === 'emails') {
      return n.emailDispatched || Boolean(n.recipientEmail);
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting_created':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'appointment_invite':
        return <Users className="w-4 h-4 text-cyan-400" />;
      case 'meeting_reminder':
      case 'schedule_reminder':
        return <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'forward_invite':
        return <Share2 className="w-4 h-4 text-purple-400" />;
      case 'rsvp_update':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case 'schedule_created':
        return <Calendar className="w-4 h-4 text-teal-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleTestTrigger = async () => {
    await testScreenAndEmailAlert(currentUser?.email, currentUser?.full_name || undefined);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in"
          onClick={() => setIsNotificationCenterOpen(false)}
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Screen Notifications & Alerts
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Dual-Channel Delivery: Screen Banners & Email Dispatches
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsNotificationCenterOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar Controls */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                {/* Audio chime toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    soundEnabled
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title={soundEnabled ? 'Chime sound is active' : 'Chime sound is muted'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
                </button>

                {/* Instant Dual-Channel Test Trigger Button */}
                <button
                  type="button"
                  onClick={handleTestTrigger}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:from-amber-500/30 text-xs font-bold transition-all shadow-sm"
                  title="Fire an immediate test alert to verify screen chime, modal banner, and email dispatch."
                >
                  <Send className="w-3 h-3 text-amber-400" />
                  <span>Test Dual Alert</span>
                </button>

                <div className="flex items-center gap-1 ml-auto">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                      title="Mark all notifications as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Clear all notifications"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'meetings', label: 'Meetings & Invites' },
                  { id: 'reminders', label: 'Reminders' },
                  { id: 'emails', label: 'Email Logs' },
                ].map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredNotifications.map((notif) => {
                let timeAgo = 'Just now';
                try {
                  timeAgo = formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true });
                } catch (e) {}

                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-950/90 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5'
                    }`}
                  >
                    {!notif.read && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Dual Channel Badges: Screen + Email */}
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Screen Displayed
                          </span>

                          {notif.recipientEmail && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300">
                              <Mail className="w-2.5 h-2.5 text-indigo-400" />
                              Email to: <span className="font-mono text-white">{notif.recipientEmail}</span>
                            </span>
                          )}

                          {notif.emailMode && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400">
                              {notif.emailMode === 'resend_live' ? 'Resend Live' : 'Verified Dispatch'}
                            </span>
                          )}
                        </div>

                        {/* Actions & HTML Preview Button */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>

                          <div className="flex items-center gap-2">
                            {notif.htmlPreview && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewItem(notif);
                                }}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Preview Email
                              </button>
                            )}

                            {notif.category === 'appointment_invite' && notif.eventId && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    respondToAppointment(notif.eventId!, 'accepted');
                                    markAsRead(notif.id);
                                  }}
                                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    respondToAppointment(notif.eventId!, 'declined');
                                    markAsRead(notif.id);
                                  }}
                                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredNotifications.length === 0 && (
                <div className="p-10 text-center bg-slate-950/40 border border-slate-800 rounded-3xl space-y-2 mt-8">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
                  <h4 className="text-xs font-bold text-slate-300">No notifications in this view</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    When meetings are scheduled, invitations forwarded, or reminders arrive, screen alerts and email delivery receipts appear here.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestTrigger}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Send className="w-3 h-3" /> Send Test Alert
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HTML Email Preview Modal */}
      {previewItem && (
        <EmailPreviewModal
          isOpen={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          htmlContent={previewItem.htmlPreview || null}
          recipientEmail={previewItem.recipientEmail}
          subject={previewItem.title}
          dispatchedAt={previewItem.timestamp}
          mode={previewItem.emailMode}
        />
      )}
    </>
  );
}
