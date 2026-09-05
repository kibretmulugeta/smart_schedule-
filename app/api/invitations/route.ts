import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/server-db';
import { Invitation, AppointmentParticipantWithProfile } from '@/types/database.types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const db = readDatabase();

    if (token) {
      const invite = db.invitations.find((i) => i.token === token);
      if (!invite) {
        return NextResponse.json({ error: 'Invitation token not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: invite });
    }

    if (email) {
      const targetEmail = email.trim().toLowerCase();
      const userInvites = db.invitations.filter(
        (i) => i.email.toLowerCase() === targetEmail && i.status === 'pending'
      );

      // Populate appointment and inviter details
      const populated = userInvites.map((inv) => {
        const inviter = db.profiles.find((p) => p.id === inv.inviter_id) || null;
        const appt = inv.appointment_id
          ? db.appointments.find((a) => a.id === inv.appointment_id) || null
          : null;
        return {
          ...inv,
          inviter_profile: inviter,
          appointment: appt,
        };
      });

      return NextResponse.json({ success: true, data: populated });
    }

    return NextResponse.json({ success: true, data: db.invitations });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, invitation_type, inviter_id, appointment_id, can_reshare } = body;

    if (!email || !inviter_id) {
      return NextResponse.json(
        { error: 'Missing required invitation fields (email, inviter_id)' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const targetEmail = email.trim().toLowerCase();
    const token = `token-${invitation_type || 'formal'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newInvite: Invitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: targetEmail,
      invitation_type: invitation_type || 'formal',
      inviter_id,
      appointment_id: appointment_id || null,
      can_reshare: can_reshare !== false,
      status: 'pending',
      token,
      created_at: new Date().toISOString(),
    };

    db.invitations.unshift(newInvite);
    writeDatabase(db);

    const inviterProfile = db.profiles.find((p) => p.id === inviter_id);
    const origin = req.headers.get('origin') || 'https://smart-schedule-lfpf.vercel.app';
    const actionUrl = `${origin}/auth/login?mode=register&email=${encodeURIComponent(targetEmail)}&token=${encodeURIComponent(token)}&type=${newInvite.invitation_type}${appointment_id ? `&appointmentId=${appointment_id}` : ''}`;

    // Dispatch email notification to recipient
    let emailSubject = '✉️ Formal Invitation to Join Smart Schedule';
    let emailType: any = 'formal_invite';
    let eventTitle = 'Platform Account Membership';
    let eventDesc = `${inviterProfile?.full_name || 'A team member'} has formally invited you to join Smart Schedule. Register your account using this link to get instant access.`;
    let startTime = new Date().toISOString();
    let endTime: string | undefined = undefined;

    if (newInvite.invitation_type === 'appointment' && appointment_id) {
      const appt = db.appointments.find((a) => a.id === appointment_id);
      if (appt) {
        emailSubject = `📅 Meeting Invitation: ${appt.title}`;
        emailType = 'unregistered_appointment_invite';
        eventTitle = appt.title;
        eventDesc = appt.description || 'You have been invited to a scheduled meeting.';
        startTime = appt.start_time;
        endTime = appt.end_time;
      }
    }

    try {
      fetch(`${origin}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          recipientName: targetEmail.split('@')[0],
          subject: emailSubject,
          type: emailType,
          eventTitle,
          eventDescription: eventDesc,
          startTime,
          endTime,
          hostName: inviterProfile?.full_name || 'Smart Schedule Team',
          hostEmail: inviterProfile?.email,
          actionUrl,
          invitationToken: token,
        }),
      }).catch(() => {});
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: newInvite,
      message: `Invitation generated and dispatched to ${targetEmail}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, userId } = body;

    if (action === 'claim' && email && userId) {
      const db = readDatabase();
      const targetEmail = email.trim().toLowerCase();
      const userProfile = db.profiles.find((p) => p.id === userId);

      let claimedCount = 0;
      const claimedAppointments: string[] = [];

      db.invitations = db.invitations.map((inv) => {
        if (inv.email.toLowerCase() === targetEmail && inv.status === 'pending') {
          claimedCount++;
          if (inv.invitation_type === 'appointment' && inv.appointment_id) {
            claimedAppointments.push(inv.appointment_id);
            // Add user to appointment participants if not already added
            const exists = db.participants.some(
              (p) => p.appointment_id === inv.appointment_id && p.user_id === userId
            );
            if (!exists) {
              const newPart: AppointmentParticipantWithProfile = {
                id: `part-${Date.now()}-claimed`,
                appointment_id: inv.appointment_id,
                user_id: userId,
                invited_by: inv.inviter_id,
                status: 'pending',
                can_reshare: inv.can_reshare !== false,
                created_at: new Date().toISOString(),
                profile: userProfile,
              };
              db.participants.push(newPart);
            }
          }
          return { ...inv, status: 'accepted' };
        }
        return inv;
      });

      writeDatabase(db);

      return NextResponse.json({
        success: true,
        claimedCount,
        claimedAppointments,
        message: `Claimed ${claimedCount} invitation(s) for user ${userId}`,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to claim invitation' },
      { status: 500 }
    );
  }
}
