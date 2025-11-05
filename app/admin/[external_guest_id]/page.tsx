'use client'

import { AdminLogin } from '@/components/AdminLogin'
import { AdminDashboard } from '@/components/AdminDashboard'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Separate component to handle URL parameters with Suspense
function UrlParamsHandler({ onResetParam, onRedirectParam }: { 
  onResetParam: (reset: boolean) => void
  onRedirectParam: (redirect: string | null) => void 
}) {
  // Import useSearchParams inside the component that's wrapped with Suspense
  const { useSearchParams } = require('next/navigation')
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const reset = searchParams.get('reset')
    const redirect = searchParams.get('redirect')
    
    if (reset === 'true') {
      onResetParam(true)
    }
    
    if (redirect) {
      onRedirectParam(redirect)
    }
  }, [searchParams, onResetParam, onRedirectParam])
  
  return null // This component doesn't render anything
}

export default function AdminWithExternalGuestIdPage() {
  const params = useParams()
  const externalGuestId = params.external_guest_id as string
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReset, setIsReset] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const router = useRouter()

  const handleResetParam = (reset: boolean) => {
    if (reset) {
      setError(null)
      setIsReset(true)
      // You could show a password reset form here
    }
  }

  const handleRedirectParam = (redirect: string | null) => {
    setRedirectPath(redirect)
  }

  useEffect(() => {
    // Flag to prevent multiple session checks
    let isMounted = true;
    
    async function checkSession() {
      try {
        if (!isMounted) return;
        
        const supabaseAuthClient = createClientComponentClient()
        const { data: { session }, error: sessionError } = await supabaseAuthClient.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        if (isMounted) {
          setUser(session?.user || null)
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to authenticate. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    async function setupAuthListener() {
      const supabaseAuthClient = createClientComponentClient()
      
      const { data: authListener } = supabaseAuthClient.auth.onAuthStateChange(
      (event, session) => {
        // Only respond to specific auth events
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
          // Handle redirect after login
          if (redirectPath) {
            router.push(redirectPath)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery
          router.push(`/admin/${externalGuestId}?reset=true`)
        }
      })

      return authListener
    }

    checkSession()
    const authListener = setupAuthListener()

    return () => {
      isMounted = false;
      authListener.then(listener => listener?.subscription?.unsubscribe())
    }
  }, [router, loading, redirectPath, externalGuestId])

  const handleLogin = (_accessToken: string, user: any) => {
    setUser(user)
  }

  const handleLogout = async () => {
    const supabaseAuthClient = createClientComponentClient()
    await supabaseAuthClient.auth.signOut()
    setUser(null)
  }

  return (
    <>
      {/* Wrap the component that uses useSearchParams in Suspense */}
      <Suspense fallback={null}>
        <UrlParamsHandler onResetParam={handleResetParam} onRedirectParam={handleRedirectParam} />
      </Suspense>

      {loading ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-8 animate-spin" />
            <p className="text-xl text-black">Loading...</p>
          </div>
        </div>
      ) : user ? (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout}
          initialExternalGuestId={externalGuestId}
        />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </>
  )
}
