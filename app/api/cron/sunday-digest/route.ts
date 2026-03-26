import { NextResponse } from 'next/server';
import { sendHospitalityHostDigest } from '@/lib/notifications';

/**
 * GET /api/cron/sunday-digest
 * Triggered by Vercel Cron at 6 AM ET every Sunday (10:00 UTC).
 * Sends the hospitality host digest to all 6 hosts.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await sendHospitalityHostDigest();
    return NextResponse.json({
      success: true,
      message: 'Hospitality host digest sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[cron/sunday-digest] Error:', msg);
    return NextResponse.json({
      success: false,
      message: msg,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
