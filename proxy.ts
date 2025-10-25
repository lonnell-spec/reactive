import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ 
    req, 
    res,
    options: {
      supabaseUrl: 'https://oigtjjfydtbbttxxvywb.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZ3RqamZ5ZHRiYnR0eHh2eXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDAxNzAsImV4cCI6MjA3NDU3NjE3MH0.MjrkBa6UzcpL1Ot9jAcdI5gqWh0zsMzSLqet08hMOFI'
    }
  })
  
  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If accessing admin routes and not authenticated, redirect to login
  if (pathname.startsWith('/admin') && !session) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - But DO match /admin routes for auth protection
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
