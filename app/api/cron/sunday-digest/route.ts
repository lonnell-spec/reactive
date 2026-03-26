import { NextResponse } from 'next/server';
import { sendHospitalityHostDigest } from '@/lib/notifications';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendHospitalityHostDigestWithError();
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Hospitality host digest sent' : 'Failed to send digest',
      error: result.error || undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[cron/sunday-digest] Error:', msg);
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}

async function sendHospitalityHostDigestWithError(): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await sendHospitalityHostDigest();
    return { success };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}
