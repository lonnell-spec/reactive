'use client'

import { AdminLogin } from '@/components/AdminLogin'
import { AdminDashboard } from '@/components/AdminDashboard'
import { useEffect, useState, useRef, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

// Separate component to handle URL parameters with Suspense
function UrlParamsHandler({ onResetParam }: { onResetParam: (reset: boolean) => void }) {
  // Import useSearchParams inside the component that's wrapped with Suspense
  const { useSearchParams } = require('next/navigation')
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const reset = searchParams.get('reset')
    if (reset === 'true') {
      onResetParam(true)
    }
  }, [searchParams, onResetParam])
  
  return null // This component doesn't render anything
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReset, setIsReset] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleResetParam = (reset: boolean) => {
    if (reset) {
      setError(null)
      setIsReset(true)
      // You could show a password reset form here
    }
  }

  useEffect(() => {
    // Flag to prevent multiple session checks
    let isMounted = true;
    console.log('Admin page effect running, loading state:', loading);
    
    async function checkSession() {
      try {
        if (!isMounted) return;
        
        console.log('Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        if (isMounted) {
          console.log('Setting user:', session?.user ? 'logged in' : 'not logged in');
          setUser(session?.user || null)
        }
      } catch (err) {
        console.error('Session check error:', err)
        if (isMounted) {
          setError('Failed to authenticate. Please try again.')
        }
      } finally {
        if (isMounted) {
          console.log('Setting loading to false');
          setLoading(false)
        }
      }
    }

    checkSession()

    // Only listen for critical auth events, not every state change
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only respond to specific auth events
        if (!isMounted) return;
        
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery
          router.push('/admin?reset=true')
        }
        // Ignore other events that might be triggered on focus
      }
    )

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe()
    }
  }, [supabase, router, loading])

  const handleLogin = (_accessToken: string, user: any) => {
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <>
      {/* Wrap the component that uses useSearchParams in Suspense */}
      <Suspense fallback={null}>
        <UrlParamsHandler onResetParam={handleResetParam} />
      </Suspense>

      {loading ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-xl">Loading...</p>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6 bg-red-50 border-2 border-red-600 rounded-lg">
            <p className="text-xl text-red-800 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                router.refresh()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : user ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </>
  )
}