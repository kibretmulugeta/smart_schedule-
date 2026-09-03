import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/web-push';
import { readDatabase } from '@/lib/server-db';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BC54yAuZnBYupdxBv5bEQ0Q5m7ekODr79uj7k5WJBgSBrMhQTG6mZgn_1q6mNDuLNmO-6zJjsgOkQ3g8Hm16GTc';

export async function GET() {
  const db = readDatabase() as any;
  const subscriptionsCount = (db.pushSubscriptions || []).length;

  return NextResponse.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY,
    subscriptionsCount,
    message: 'VAPID public key for phone lock-screen push subscription.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid PushSubscription format. Missing endpoint or keys.' },
        { status: 400 }
      );
    }

    const saved = savePushSubscription({
      endpoint: body.endpoint,
      keys: body.keys,
      userId: body.userId,
      device: body.device || 'mobile-phone',
    });

    if (saved) {
      return NextResponse.json({
        success: true,
        message: 'Phone registered for lock-screen push notifications.',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to save subscription in server database.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Subscription processing failed' },
      { status: 500 }
    );
  }
}
