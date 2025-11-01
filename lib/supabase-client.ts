'use server'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

let _supabase: Awaited<ReturnType<typeof createSupabaseServiceClient>> | null = null;

/**
 * Gets the initialized Supabase client or initializes it if not already done
 */
export async function getSupabaseServiceClient() {
  if (!_supabase) {
    _supabase = createSupabaseServiceClient();
  }
  return _supabase;
}

/**
 * Creates a Supabase client with service role credentials
 * Used for operations that require elevated permissions
 */
function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}