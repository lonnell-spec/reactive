'use client'

import { AdminLogin } from '@/components/AdminLogin'
import { AdminDashboard } from '@/components/AdminDashboard'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        // Check for password reset from URL params
        const reset = searchParams.get('reset')
        if (reset === 'true') {
          // Handle password reset flow
          setError(null)
          // You could show a password reset form here
        }
        
        setUser(session?.user || null)
      } catch (err) {
        console.error('Session check error:', err)
        setError('Failed to authenticate. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle auth state changes
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery
          router.push('/admin?reset=true')
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user || null)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase, router, searchParams])

  const handleLogin = (_accessToken: string, user: any) => {
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
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
    )
  }

  return user ? (
    <AdminDashboard user={user} onLogout={handleLogout} />
  ) : (
    <AdminLogin onLogin={handleLogin} />
  )
}
