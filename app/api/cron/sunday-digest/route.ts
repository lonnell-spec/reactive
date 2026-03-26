import { NextResponse } from 'next/server';
import { sendTextMagicSMS } from '@/lib/textmagic';
import { getSupabaseServiceClient } from '@/lib/supabase-client';
import { formatHospitalityHostDigest } from '@/lib/message-utils';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseService = await getSupabaseServiceClient();
    const now = new Date();
    const etDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(now);

    const { data: guests, error: dbError } = await supabaseService
      .from('guests')
      .select('id, first_name, last_name, gathering_time, total_guests, vehicle_type, vehicle_color, vehicle_make, vehicle_model, should_enroll_children, photo_path')
      .eq('visit_date', etDate)
      .eq('status', 'approved')
      .order('gathering_time', { ascending: true });

    if (dbError) throw new Error(`DB error: ${dbError.message}`);

    // Enrich guests
    const enrichedGuests = await Promise.all((guests || []).map(async (guest) => {
      let child_count = 0;
      let photo_url: string | undefined;
      if (guest.should_enroll_children === true) {
        const { data: children } = await supabaseService.from('guest_children').select('id').eq('guest_id', guest.id);
        child_count = children?.length || 0;
      }
      if (guest.photo_path) {
        const { data: signedData } = await supabaseService.storage.from('guest-photos').createSignedUrl(guest.photo_path, 3600);
        if (signedData?.signedUrl) photo_url = signedData.signedUrl;
      }
      return { ...guest, child_count, photo_url };
    }));

    const message = await formatHospitalityHostDigest(enrichedGuests, etDate);
    const messageLength = message.length;

    // Test send to just Lonnell first to get the real error
    const testResult = await sendTextMagicSMS({ phone: '6099370946', message });

    return NextResponse.json({
      success: testResult.success,
      message_length: messageLength,
      message_preview: message.substring(0, 200),
      sms_error: testResult.success ? undefined : (testResult as any).error,
      guest_count: enrichedGuests.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
