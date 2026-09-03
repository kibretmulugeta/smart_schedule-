import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/server-db';
import { Schedule } from '@/types/database.types';

export async function GET(req: NextRequest) {
  try {
    const db = readDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let schedules = db.schedules;
    if (userId) {
      schedules = schedules.filter((s) => s.user_id === userId);
    }

    return NextResponse.json({
      success: true,
      data: schedules,
      total: schedules.length,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.start_time || !body.frequency) {
      return NextResponse.json(
        { error: 'Missing required schedule fields (title, start_time, frequency)' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const newSchedule: Schedule = {
      id: body.id || `sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: body.user_id || 'user-admin-kibret',
      category_id: body.category_id || null,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      frequency: body.frequency,
      interval_value: body.interval_value || 1,
      custom_rule_json: body.custom_rule_json || null,
      start_time: body.start_time,
      end_time: body.end_time || null,
      is_completed: Boolean(body.is_completed),
      created_at: new Date().toISOString(),
    };

    db.schedules.unshift(newSchedule);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: newSchedule,
      message: 'Schedule successfully saved to server database.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing schedule id' }, { status: 400 });
    }

    const db = readDatabase();
    const index = db.schedules.findIndex((s) => s.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    db.schedules[index] = {
      ...db.schedules[index],
      ...body,
    };
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: db.schedules[index],
      message: 'Schedule updated in server database.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing schedule id' }, { status: 400 });
    }

    const db = readDatabase();
    db.schedules = db.schedules.filter((s) => s.id !== id);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted from server database.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
