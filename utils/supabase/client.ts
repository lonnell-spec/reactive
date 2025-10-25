'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create client with custom environment variables
export const createClient = () => {
  // For client components, we still need to use the NEXT_PUBLIC_ prefix
  // because these variables need to be exposed to the browser
  // However, we'll read them from non-prefixed variables on the server
  // and expose them as NEXT_PUBLIC_ variables
  return createClientComponentClient()
}