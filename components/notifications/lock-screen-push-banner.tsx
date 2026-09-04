'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, BellRing, CheckCircle2, ShieldCheck, Zap, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/toast-context';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function LockScreenPushBanner() {
  const { showToast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast(
          'Permission Denied',
          'Please allow notifications in your browser or phone settings to receive lock-screen alerts.',
          'warning',
          true
        );
        setLoading(false);
        return;
      }

      // 2. Fetch VAPID key
      const keyRes = await fetch('/api/notifications/push/subscribe');
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        throw new Error('VAPID public key not found on server');
      }

      // 3. Register SW & Subscribe to PushManager
      const reg = await navigator.serviceWorker.ready;
      const convertedVapidKey = urlBase64ToUint8Array(keyData.publicKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 4. Send subscription to server
      const saveRes = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (saveRes.ok) {
        setIsSubscribed(true);
        showToast(
          '📱 Lock-Screen Push Active! 🎉',
          'Your phone is now registered to receive alerts and wake up even when the screen is locked!',
          'success',
          true
        );
      }
    } catch (error: any) {
      showToast('Push Registration Error', error.message || 'Could not register push', 'error', true);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLockScreenAlert = async () => {
    setLoading(true);
    setCountdown(5);

    try {
      const res = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⏰ Smart Scheduling Phone Lock-Screen Alert',
          message: 'Wake-up alert! Your upcoming scheduled appointment is starting now.',
          delaySeconds: 5,
        }),
      });

      if (res.ok) {
        showToast(
          '🔒 Lock Your Phone Screen Now!',
          'Test alert scheduled! Turn off / lock your phone screen in 5 seconds to test.',
          'warning',
          true
        );

        let remaining = 5;
        const interval = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(interval);
            setCountdown(null);
            setLoading(false);
          } else {
            setCountdown(remaining);
          }
        }, 1000);
      } else {
        setLoading(false);
        setCountdown(null);
      }
    } catch (e) {
      setLoading(false);
      setCountdown(null);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-2 text-xs text-slate-400">
        <Smartphone className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span>For lock-screen alerts on iPhone, tap <strong>Share → Add to Home Screen</strong> first.</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white">Phone Lock-Screen Push Notifications</h4>
              {isSubscribed ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ready to Enable
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Wakes your phone screen, vibrates, and displays persistent alert cards even when your phone is locked or browser is closed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-1">
        {!isSubscribed ? (
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Enable Phone Lock-Screen Alerts</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTestLockScreenAlert}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {countdown !== null ? `Lock Screen Now (${countdown}s)...` : 'Test Lock-Screen Alert (5s Delay)'}
              </span>
            </button>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Device registered for wake & vibration
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
