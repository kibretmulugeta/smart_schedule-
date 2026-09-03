import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/server-db';
import { Appointment, AppointmentParticipantWithProfile } from '@/types/database.types';

export async function GET(req: NextRequest) {
  try {
    const db = readDatabase();
    return NextResponse.json({
      success: true,
      data: {
        appointments: db.appointments,
        participants: db.participants,
      },
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.start_time || !body.end_time || !body.creator_id) {
      return NextResponse.json(
        { error: 'Missing required appointment fields (title, start_time, end_time, creator_id)' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const apptId = body.id || `appt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newAppointment: Appointment = {
      id: apptId,
      creator_id: body.creator_id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      start_time: body.start_time,
      end_time: body.end_time,
      created_at: new Date().toISOString(),
    };

    // Build participants
    const invitedUserIds: string[] = body.participantUserIds || [];
    const newParticipants: AppointmentParticipantWithProfile[] = [];

    // 1. Host row (accepted by default)
    const hostProfile = db.profiles.find((p) => p.id === body.creator_id);
    newParticipants.push({
      id: `part-${Date.now()}-host`,
      appointment_id: apptId,
      user_id: body.creator_id,
      invited_by: null,
      status: 'accepted',
      can_reshare: true,
      created_at: new Date().toISOString(),
      profile: hostProfile,
    });

    // 2. Invited attendees (pending by default)
    for (const uId of invitedUserIds) {
      if (uId === body.creator_id) continue;
      const userProfile = db.profiles.find((p) => p.id === uId);
      newParticipants.push({
        id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        appointment_id: apptId,
        user_id: uId,
        invited_by: body.creator_id,
        status: 'pending',
        can_reshare: body.can_reshare !== false,
        created_at: new Date().toISOString(),
        profile: userProfile,
      });
    }

    db.appointments.unshift(newAppointment);
    db.participants.push(...newParticipants);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: {
        appointment: newAppointment,
        participants: newParticipants,
      },
      message: 'Appointment successfully saved to server database.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDatabase();

    // Action: RSVP update
    if (body.action === 'rsvp') {
      const { appointmentId, userId, status } = body;
      const partIndex = db.participants.findIndex(
        (p) => p.appointment_id === appointmentId && p.user_id === userId
      );

      if (partIndex === -1) {
        return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
      }

      db.participants[partIndex].status = status;
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        data: db.participants[partIndex],
        message: `RSVP updated to ${status} in server database.`,
      });
    }

    // Action: Forward appointment
    if (body.action === 'forward') {
      const { appointmentId, targetUserId, inviterId, canReshare } = body;
      const existing = db.participants.find(
        (p) => p.appointment_id === appointmentId && p.user_id === targetUserId
      );

      if (existing) {
        return NextResponse.json(
          { error: 'User is already a participant in this appointment.' },
          { status: 400 }
        );
      }

      const targetProfile = db.profiles.find((p) => p.id === targetUserId);
      const newPart: AppointmentParticipantWithProfile = {
        id: `part-${Date.now()}-fwd`,
        appointment_id: appointmentId,
        user_id: targetUserId,
        invited_by: inviterId,
        status: 'pending',
        can_reshare: Boolean(canReshare),
        created_at: new Date().toISOString(),
        profile: targetProfile,
      };

      db.participants.push(newPart);
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        data: newPart,
        message: 'Forwarded invitation saved to server database.',
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
