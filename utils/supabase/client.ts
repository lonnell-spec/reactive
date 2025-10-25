import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oigtjjfydtbbttxxvywb.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZ3RqamZ5ZHRiYnR0eHh2eXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDAxNzAsImV4cCI6MjA3NDU3NjE3MH0.MjrkBa6UzcpL1Ot9jAcdI5gqWh0zsMzSLqet08hMOFI',
  })
}


