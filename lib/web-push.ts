import webpush from 'web-push';
import { readDatabase, writeDatabase } from './server-db';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BC54yAuZnBYupdxBv5bEQ0Q5m7ekODr79uj7k5WJBgSBrMhQTG6mZgn_1q6mNDuLNmO-6zJjsgOkQ3g8Hm16GTc';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'f9Mvl_aTQpjNV0QKCZDVnPfBVmQRyqqbSl0aXKiyUrM';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:kibretmail@gmail.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('VAPID setup warning:', e);
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  device?: string;
  created_at?: string;
}

/**
 * Saves a new device subscription for phone lock-screen push notifications
 */
export function savePushSubscription(sub: PushSubscriptionPayload): boolean {
  try {
    const db = readDatabase() as any;
    if (!db.pushSubscriptions) {
      db.pushSubscriptions = [];
    }

    // Deduplicate by endpoint
    const existingIndex = db.pushSubscriptions.findIndex(
      (s: any) => s.endpoint === sub.endpoint
    );
    if (existingIndex >= 0) {
      db.pushSubscriptions[existingIndex] = {
        ...db.pushSubscriptions[existingIndex],
        ...sub,
        updated_at: new Date().toISOString(),
      };
    } else {
      db.pushSubscriptions.push({
        ...sub,
        created_at: new Date().toISOString(),
      });
    }

    writeDatabase(db);
    return true;
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return false;
  }
}

/**
 * Sends a high-urgency lock-screen push notification to all subscribed mobile & desktop devices
 */
export async function sendLockScreenPushNotification(payload: {
  title: string;
  message: string;
  url?: string;
  eventId?: string;
}): Promise<{ sent: number; failed: number }> {
  const db = readDatabase() as any;
  const subs: PushSubscriptionPayload[] = db.pushSubscriptions || [];

  if (subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const notificationData = JSON.stringify({
    title: payload.title,
    message: payload.message,
    url: payload.url || '/',
    eventId: payload.eventId,
    timestamp: new Date().toISOString(),
  });

  let sent = 0;
  let failed = 0;
  const activeSubs: PushSubscriptionPayload[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        notificationData,
        {
          urgency: 'high', // Wakes the device and triggers lock-screen display immediately
          TTL: 86400,
        }
      );
      sent++;
      activeSubs.push(sub);
    } catch (err: any) {
      failed++;
      console.warn(`Push to ${sub.endpoint} failed (${err.statusCode || err.message})`);
      // If subscription expired or gone (410 / 404), remove it
      if (err.statusCode !== 410 && err.statusCode !== 404) {
        activeSubs.push(sub);
      }
    }
  }

  if (activeSubs.length !== subs.length) {
    db.pushSubscriptions = activeSubs;
    writeDatabase(db);
  }

  return { sent, failed };
}
