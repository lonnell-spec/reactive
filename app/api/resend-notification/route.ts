import { NextRequest, NextResponse } from 'next/server';
import { notifyGuestOfApproval, sendAdminApprovalNotification } from '@/lib/notifications';

/**
 * TEMPORARY endpoint to resend notifications for a guest.
 * Protected by a secret token.
 * DELETE THIS ROUTE AFTER USE.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guestId, secret } = body;

  // Simple secret protection
  if (secret !== process.env.RESEND_NOTIFICATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!guestId) {
    return NextResponse.json({ error: 'guestId required' }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  try {
    const guestResult = await notifyGuestOfApproval(guestId);
    results.guestNotification = guestResult;
  } catch (e) {
    results.guestNotification = { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  try {
    const adminResult = await sendAdminApprovalNotification(guestId);
    results.adminNotification = adminResult;
  } catch (e) {
    results.adminNotification = { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  return NextResponse.json(results);
}
