import { NextRequest, NextResponse } from 'next/server';
import { calculateFocusBlocks } from '@/lib/ai-scheduler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const busyIntervals = (body.busyIntervals || []).map((b: any) => ({
      start: new Date(b.start),
      end: new Date(b.end),
    }));

    const recommendations = calculateFocusBlocks(busyIntervals);
    return NextResponse.json({ success: true, data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
