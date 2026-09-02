import { format } from 'date-fns';

export interface EmailNotificationPayload {
  to: string;
  recipientName?: string;
  subject: string;
  type: 'appointment_invite' | 'schedule_reminder' | 'forward_invite' | 'daily_digest';
  eventTitle: string;
  eventDescription?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
  hostName?: string;
  actionUrl?: string;
}

/**
 * Generates responsive branded HTML email templates for Antigravity AI notifications
 */
export function generateEmailHtml(payload: EmailNotificationPayload): string {
  let startFormatted = 'Upcoming Scheduled Event';
  try {
    const d = payload.startTime ? new Date(payload.startTime) : new Date();
    if (!isNaN(d.getTime())) {
      startFormatted = format(d, 'EEEE, MMMM d, yyyy · h:mm a');
    }
  } catch (e) {}

  let endFormatted: string | null = null;
  if (payload.endTime) {
    try {
      const dEnd = new Date(payload.endTime);
      if (!isNaN(dEnd.getTime())) {
        endFormatted = format(dEnd, 'h:mm a');
      }
    } catch (e) {}
  }

  const timeRange = endFormatted ? `${startFormatted} – ${endFormatted}` : startFormatted;

  let badgeColor = '#6366F1';
  let badgeLabel = 'REMINDER ALERT';

  if (payload.type === 'appointment_invite' || payload.type === 'forward_invite') {
    badgeColor = '#06B6D4';
    badgeLabel = payload.type === 'forward_invite' ? 'FORWARDED INVITATION' : 'NEW MEETING INVITATION';
  } else if (payload.type === 'daily_digest') {
    badgeColor = '#10B981';
    badgeLabel = 'DAILY AGENDA DIGEST';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 30px auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { padding: 30px 40px; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-bottom: 1px solid #1e293b; text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; background-color: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}50; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 8px 0; }
    .content { padding: 35px 40px; }
    .event-card { background: #020617; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin: 20px 0; }
    .event-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
    .event-time { font-size: 13px; font-weight: 600; color: #a5b4fc; font-family: monospace; }
    .event-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-top: 12px; border-top: 1px solid #1e293b; padding-top: 12px; }
    .btn { display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 15px; }
    .footer { padding: 25px 40px; background: #020617; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${badgeLabel}</div>
      <h1 class="title">Antigravity AI Scheduling</h1>
    </div>
    <div class="content">
      <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">
        Hello <strong>${payload.recipientName || 'there'}</strong>,
      </p>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
        ${
          payload.type === 'appointment_invite'
            ? `<strong>${payload.hostName || 'A team member'}</strong> has invited you to a scheduled appointment:`
            : payload.type === 'forward_invite'
            ? `<strong>${payload.hostName || 'A colleague'}</strong> has forwarded a meeting invitation to you:`
            : 'You have an upcoming scheduled activity starting soon:'
        }
      </p>

      <div class="event-card">
        <div class="event-title">${payload.eventTitle}</div>
        <div class="event-time">⏰ ${timeRange}</div>
        ${
          payload.eventDescription
            ? `<div class="event-desc">${payload.eventDescription}</div>`
            : ''
        }
      </div>

      <div style="text-align: center;">
        <a href="${payload.actionUrl || 'https://smart-schedule-lfpf.vercel.app'}" class="btn">
          View in Antigravity Calendar →
        </a>
      </div>
    </div>
    <div class="footer">
      Sent automatically by Antigravity AI Scheduling Engine with PostgreSQL Row Level Security.<br>
      Antigravity AI · Automated Notification Service
    </div>
  </div>
</body>
</html>
  `.trim();
}
