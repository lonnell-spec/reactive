import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read env file
const envPath = resolve(process.cwd(), '.env.production');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)="(.*)"/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const statements = [
  // Create invite_slugs table
  `CREATE TABLE IF NOT EXISTS public.invite_slugs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  
  // Create invites table
  `CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    invite_slug_id UUID NOT NULL REFERENCES public.invite_slugs(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
    guest_id UUID REFERENCES public.guests(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '72 hours'),
    ip_address TEXT,
    user_agent TEXT
  )`,

  // Enable RLS
  `ALTER TABLE public.invite_slugs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY`,

  // RLS Policies for invite_slugs
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invite_slugs' AND policyname = 'Allow anon read active slugs') THEN
      CREATE POLICY "Allow anon read active slugs" ON public.invite_slugs FOR SELECT USING (is_active = true);
    END IF;
  END $$`,

  // RLS Policies for invites
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invites' AND policyname = 'Allow anon insert invites') THEN
      CREATE POLICY "Allow anon insert invites" ON public.invites FOR INSERT WITH CHECK (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invites' AND policyname = 'Allow anon read invites') THEN
      CREATE POLICY "Allow anon read invites" ON public.invites FOR SELECT USING (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invites' AND policyname = 'Allow anon update invites') THEN
      CREATE POLICY "Allow anon update invites" ON public.invites FOR UPDATE USING (true);
    END IF;
  END $$`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token)`,
  `CREATE INDEX IF NOT EXISTS idx_invite_slugs_slug ON public.invite_slugs(slug)`,

  // Add columns to guests table
  `ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS invite_token TEXT`,
  `ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS invited_by TEXT`,
];

async function run() {
  for (const sql of statements) {
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
    if (error) {
      // Try using the raw SQL via postgrest
      console.log(`Statement result: ${error.message}`);
    } else {
      console.log(`OK: ${sql.substring(0, 60)}...`);
    }
  }
}

// Since we can't run arbitrary SQL via PostgREST, let's use the management API
// Actually, let's use a different approach - create the tables by inserting test data
// and catching the error to know if they exist

// Better approach: use the supabase-js admin client to call the database
async function runWithFetch() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  
  for (const sql of statements) {
    try {
      // Use the pg-graphql or management API
      const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql_text: sql })
      });
      const result = await response.text();
      console.log(`[${response.status}] ${sql.substring(0, 50)}... => ${result.substring(0, 100)}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

runWithFetch().catch(console.error);
