import { format } from 'date-fns';

export type EmailNotificationType =
  | 'meeting_created_creator'
  | 'appointment_invite'
  | 'meeting_reminder'
  | 'schedule_reminder'
  | 'forward_invite'
  | 'rsvp_update'
  | 'schedule_created'
  | 'daily_digest';

export interface EmailNotificationPayload {
  to: string;
  recipientName?: string;
  subject: string;
  type: EmailNotificationType;
  eventTitle: string;
  eventDescription?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
  hostName?: string;
  hostEmail?: string;
  actionUrl?: string;
  attendees?: { name?: string; email: string; status?: string }[];
  rsvpStatus?: string;
  reminderLeadMinutes?: number;
}

/**
 * Generates responsive, executive-grade HTML email templates for Antigravity AI notifications
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
  let badgeLabel = 'NOTIFICATION ALERT';

  switch (payload.type) {
    case 'meeting_created_creator':
      badgeColor = '#10B981';
      badgeLabel = 'MEETING SCHEDULED (HOST CONFIRMATION)';
      break;
    case 'appointment_invite':
      badgeColor = '#06B6D4';
      badgeLabel = 'NEW MEETING INVITATION';
      break;
    case 'meeting_reminder':
      badgeColor = '#F59E0B';
      badgeLabel = '⏰ MEETING REMINDER ALERT';
      break;
    case 'schedule_reminder':
      badgeColor = '#EC4899';
      badgeLabel = '⏰ SCHEDULE REMINDER DUE';
      break;
    case 'forward_invite':
      badgeColor = '#8B5CF6';
      badgeLabel = '↪️ FORWARDED MEETING INVITATION';
      break;
    case 'rsvp_update':
      badgeColor = '#3B82F6';
      badgeLabel = 'RSVP STATUS UPDATE';
      break;
    case 'schedule_created':
      badgeColor = '#14B8A6';
      badgeLabel = 'SCHEDULE CREATED';
      break;
    case 'daily_digest':
      badgeColor = '#10B981';
      badgeLabel = 'DAILY AGENDA DIGEST';
      break;
  }

  // Generate attendee HTML pills if provided
  let attendeesHtml = '';
  if (payload.attendees && payload.attendees.length > 0) {
    const attendeeItems = payload.attendees
      .map((att) => {
        const statusBadge = att.status
          ? `<span style="display:inline-block; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px; background:#1e293b; color:#94a3b8; text-transform:uppercase;">${att.status}</span>`
          : '';
        return `
          <div style="display:inline-block; margin:4px 6px 4px 0; padding:6px 12px; background:#0f172a; border:1px solid #334155; border-radius:8px; font-size:12px; color:#e2e8f0;">
            <strong>${att.name || att.email.split('@')[0]}</strong> <span style="color:#64748b; font-size:11px;">(${att.email})</span>
            ${statusBadge}
          </div>
        `;
      })
      .join('');

    attendeesHtml = `
      <div style="margin-top:16px; padding-top:14px; border-top:1px solid #1e293b;">
        <div style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
          Invited Attendees (${payload.attendees.length})
        </div>
        <div>${attendeeItems}</div>
      </div>
    `;
  }

  // Contextual intro message
  let introMessage = '';
  if (payload.type === 'meeting_created_creator') {
    introMessage = `You have successfully scheduled <strong>"${payload.eventTitle}"</strong> with your team. Your calendar and your invitees’ notifications have been dispatched immediately.`;
  } else if (payload.type === 'appointment_invite') {
    introMessage = `<strong>${payload.hostName || 'A team member'}</strong> (${payload.hostEmail || 'Host'}) has invited you to a scheduled meeting:`;
  } else if (payload.type === 'meeting_reminder') {
    introMessage = `This is an automated reminder that your scheduled meeting with <strong>${payload.hostName || 'your team'}</strong> is due:`;
  } else if (payload.type === 'schedule_reminder') {
    introMessage = `This is an automated screen and email reminder that your scheduled routine is starting now:`;
  } else if (payload.type === 'forward_invite') {
    introMessage = `<strong>${payload.hostName || 'A colleague'}</strong> has forwarded a meeting invitation to you:`;
  } else if (payload.type === 'rsvp_update') {
    introMessage = `An attendee has updated their RSVP response to <strong>${payload.rsvpStatus?.toUpperCase() || 'UPDATED'}</strong> for your scheduled meeting:`;
  } else if (payload.type === 'schedule_created') {
    introMessage = `You have successfully created a new recurring schedule block in your calendar:`;
  } else {
    introMessage = 'You have an upcoming scheduled activity:';
  }

  const appUrl = payload.actionUrl || 'https://smart-schedule-lfpf.vercel.app';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 30px auto; background: #0f172a; border-radius: 18px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .header { padding: 32px 40px; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-bottom: 1px solid #1e293b; text-align: center; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; background-color: ${badgeColor}25; color: ${badgeColor}; border: 1px solid ${badgeColor}60; margin-bottom: 12px; text-transform: uppercase; }
    .title { font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 6px 0; letter-spacing: -0.02em; }
    .subtitle { font-size: 12px; color: #94a3b8; margin: 0; }
    .content { padding: 35px 40px; }
    .event-card { background: #020617; border-radius: 14px; border: 1px solid #334155; padding: 22px; margin: 22px 0; }
    .event-title { font-size: 18px; font-weight: 800; color: #f8fafc; margin-bottom: 8px; }
    .event-time { font-size: 13px; font-weight: 700; color: #a5b4fc; font-family: monospace; display: flex; align-items: center; }
    .event-desc { font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-top: 14px; border-top: 1px solid #1e293b; padding-top: 14px; white-space: pre-line; }
    .btn { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; margin-top: 20px; box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
    .footer { padding: 24px 40px; background: #020617; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; }
    .channel-tag { display: inline-block; padding: 3px 8px; border-radius: 6px; background: #1e293b; color: #a5b4fc; font-size: 10px; font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${badgeLabel}</div>
      <h1 class="title">Antigravity AI Scheduling</h1>
      <p class="subtitle">Multi-Party Appointments · Instant Recurrence · Real-Time Alerts</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; color: #f1f5f9; margin-top: 0;">
        Hello <strong>${payload.recipientName || 'there'}</strong>,
      </p>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
        ${introMessage}
      </p>

      <div class="event-card">
        <div class="event-title">${payload.eventTitle}</div>
        <div class="event-time">⏰ ${timeRange}</div>
        ${
          payload.hostName
            ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Organized by: <strong style="color:#e2e8f0;">${payload.hostName}</strong> ${payload.hostEmail ? `(${payload.hostEmail})` : ''}</div>`
            : ''
        }
        ${
          payload.eventDescription
            ? `<div class="event-desc">${payload.eventDescription}</div>`
            : ''
        }
        ${attendeesHtml}
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}" class="btn">
          View & Respond in Antigravity Calendar →
        </a>
      </div>
      <div style="text-align: center; margin-top: 10px;">
        <span class="channel-tag">✓ Dual-Channel: Screen Alert & Email Dispatched</span>
      </div>
    </div>
    <div class="footer">
      This notification was automatically generated and dispatched to <strong>${payload.to}</strong>.<br>
      Antigravity AI Engine · PostgreSQL Row Level Security · Instant Email & Screen Alert Delivery
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string with high-priority VALARM.
 * When received on mobile devices (iOS / Android), this causes phone mail clients
 * and calendar daemons to fire native lock-screen alarms and wake the phone screen.
 */
export function generateIcsCalendarInvite(payload: EmailNotificationPayload): string {
  const formatIcsTime = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = new Date();
  const start = payload.startTime ? new Date(payload.startTime) : now;
  const end = payload.endTime ? new Date(payload.endTime) : new Date(start.getTime() + 30 * 60 * 1000);
  const uid = `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@smart-schedule`;

  const cleanTitle = (payload.eventTitle || 'Scheduled Event').replace(/[\\;,]/g, ' ');
  const cleanDesc = (payload.eventDescription || 'Antigravity AI Scheduled Event').replace(/[\\;,]/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antigravity AI//Smart Schedule Lock Screen Notifier//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsTime(now)}`,
    `DTSTART:${formatIcsTime(start)}`,
    `DTEND:${formatIcsTime(end)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    'PRIORITY:1',
    'CLASS:PUBLIC',
    'STATUS:CONFIRMED',
    `ORGANIZER;CN=${payload.hostName || 'Antigravity Host'}:mailto:${payload.hostEmail || 'onboarding@resend.dev'}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${payload.recipientName || 'Invitee'}:mailto:${payload.to}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:⏰ URGENT LOCK-SCREEN ALERT: ${cleanTitle}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT10M',
    'ACTION:DISPLAY',
    `DESCRIPTION:⏰ 10-Minute Reminder: ${cleanTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

