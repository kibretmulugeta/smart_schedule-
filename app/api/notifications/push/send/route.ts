import { NextRequest, NextResponse } from 'next/server';
import { sendLockScreenPushNotification } from '@/lib/web-push';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    const delaySeconds = Number(body.delaySeconds) || 0;
    if (delaySeconds > 0) {
      setTimeout(async () => {
        try {
          await sendLockScreenPushNotification({
            title: body.title,
            message: body.message || 'Scheduled routine or meeting is starting now.',
            url: body.url || '/',
            eventId: body.eventId,
          });
        } catch (e) {
          console.warn('Delayed push error:', e);
        }
      }, delaySeconds * 1000);

      return NextResponse.json({
        success: true,
        scheduled: true,
        delaySeconds,
        message: `Scheduled lock-screen push notification in ${delaySeconds} seconds. Lock your phone screen now!`,
      });
    }

    const result = await sendLockScreenPushNotification({
      title: body.title,
      message: body.message || 'Scheduled routine or meeting is starting now.',
      url: body.url || '/',
      eventId: body.eventId,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: `Dispatched lock-screen push notification to ${result.sent} device(s).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch push notification' },
      { status: 500 }
    );
  }
}
