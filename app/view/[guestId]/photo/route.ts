import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-client';

/**
 * GET /view/[guestId]/photo
 * Short-link redirect to the guest's signed photo URL.
 * Generates a fresh 1-hour signed URL and redirects.
 * Safe to share with hospitality hosts — no auth required.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await context.params;

    if (!guestId) {
      return NextResponse.json({ error: 'Missing guest ID' }, { status: 400 });
    }

    const supabaseService = await getSupabaseServiceClient();

    const { data: guest, error } = await supabaseService
      .from('guests')
      .select('photo_path')
      .eq('external_guest_id', guestId)
      .single();

    if (error || !guest || !guest.photo_path) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const { data: signedData, error: signError } = await supabaseService.storage
      .from('guest-photos')
      .createSignedUrl(guest.photo_path, 3600);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate photo link' }, { status: 500 });
    }

    return NextResponse.redirect(signedData.signedUrl);

  } catch (error) {
    console.error('[view/photo] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
