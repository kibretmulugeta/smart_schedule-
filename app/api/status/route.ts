import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/lib/server-db';

export async function GET(req: NextRequest) {
  try {
    const db = readDatabase();

    // Check Resend Status
    const resendApiKey = process.env.RESEND_API_KEY;
    let resendStatus = 'not_configured';
    if (resendApiKey) {
      resendStatus = 'configured_active';
    }

    // Check Supabase REST API connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let supabaseStatus = 'not_configured';
    let supabaseDetail = '';

    if (supabaseUrl && supabaseKey) {
      try {
        const checkRes = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        if (checkRes.ok) {
          supabaseStatus = 'connected_live';
        } else {
          const errData = await checkRes.json().catch(() => ({}));
          supabaseStatus = 'invalid_key_or_paused';
          supabaseDetail = errData.message || `HTTP ${checkRes.status}`;
        }
      } catch (err: any) {
        supabaseStatus = 'network_error';
        supabaseDetail = err.message || 'Failed to reach Supabase';
      }
    }

    return NextResponse.json({
      success: true,
      server: {
        status: 'online',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        port: 3000,
      },
      database: {
        storageType: 'persistent_server_database',
        filePath: 'data/db.json',
        records: {
          schedulesCount: db.schedules.length,
          appointmentsCount: db.appointments.length,
          participantsCount: db.participants.length,
          profilesCount: db.profiles.length,
          categoriesCount: db.categories.length,
        },
        supabaseIntegration: {
          url: supabaseUrl || null,
          status: supabaseStatus,
          detail: supabaseDetail || (supabaseStatus === 'connected_live' ? 'Connected' : undefined),
        },
      },
      emailService: {
        provider: 'Resend',
        sender: process.env.EMAIL_FROM || 'Smart Scheduling <onboarding@resend.dev>',
        status: resendStatus,
        accountOwner: 'kibretmail@gmail.com',
        verifiedRecipientNotice:
          'Resend free tier delivers to kibretmail@gmail.com. Verified delivery receipts and HTML previews logged for all recipient emails.',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
