import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oigtjjfydtbbttxxvywb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZ3RqamZ5ZHRiYnR0eHh2eXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDAxNzAsImV4cCI6MjA3NDU3NjE3MH0.MjrkBa6UzcpL1Ot9jAcdI5gqWh0zsMzSLqet08hMOFI',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}


