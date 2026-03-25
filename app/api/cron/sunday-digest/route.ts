import { NextResponse } from 'next/server';
import { sendHospitalityHostDigest } from '@/lib/notifications';

/**
 * GET /api/cron/sunday-digest
 * Triggered by Vercel Cron at 6 AM ET every Sunday (10:00 UTC).
 * Sends the hospitality host digest to Ernest, Demetria, and Jermaine.
 */
export async function GET(request: Request) {
  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await sendHospitalityHostDigest();
    return NextResponse.json({
      success,
      message: success ? 'Hospitality host digest sent' : 'Failed to send digest',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/sunday-digest] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
